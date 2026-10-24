# Plan de Pruebas: Restful Booker Platform — Reserva de habitación

**Versión:** 1.0
**Fecha:** 2026-10-23
**Autor:** QA — reto técnico de automatización full stack
**Ambiente:** `https://automationintesting.online` (demo compartida, reiniciable)
**Dedicación estimada:** 4–5 horas

---

## 1. Objetivo

Validar el flujo de reserva de habitación de Restful Booker Platform en tres niveles:
API (contrato + negocio), negativa (validaciones), e integrado UI+API (la reserva
hecha por UI es la misma que la API reporta). Criterio de éxito: los 3 escenarios del
alcance mínimo ejecutando con exit code 0, con datos sintéticos y sin dependencias
entre pruebas.

---

## 2. Alcance

### En scope
- `POST /api/booking` — creación exitosa y rechazos de validación (400/409)
- Consulta del registro creado: `GET /api/booking/{id}`, `GET /api/booking/summary`, `GET /api/report`
- `POST /api/auth/login` — token admin para endpoints protegidos
- Flujo UI de reserva: home → `/reservation/{id}` → formulario → confirmación
- Verificación cruzada UI→API del mismo registro (bookingid capturado por red)

### Fuera de scope
- Panel `/admin` (gestión de rooms, mensajes) — fuera del flujo de reserva
- `PUT`/`DELETE` de bookings — no requeridos por el alcance mínimo
- Pruebas de carga/performance, accesibilidad formal, cross-browser (solo Chromium)
- Formulario de contacto ("Send Us a Message") — feature distinta

---

## 3. Artefactos a crear / creados

| Artefacto | Archivo | Estado |
|-----------|---------|--------|
| Model | `src/models/booking.ts` | ✅ creado |
| Factory | `src/utils/dataFactory.ts` | ✅ creado |
| API clients | `src/api/{auth,booking,room}Client.ts` | ✅ creados |
| Fixtures | `src/fixtures/test.ts` | ✅ creado |
| Spec API éxito | `tests/api/create-booking.spec.ts` | ✅ implementado |
| Spec API negativo | `tests/api/create-booking-negative.spec.ts` | ✅ implementado |
| Resource UI home | `src/resources/homeUI.ts` | ✅ creado (agente + skill) |
| Resource UI reserva | `src/resources/reservationUI.ts` | ✅ creado (agente + skill) |
| Page Object home | `src/pages/homePage.ts` | ✅ creado (agente + skill) |
| Page Object reserva | `src/pages/reservationPage.ts` | ✅ creado (agente + skill) |
| Spec integrado | `tests/e2e/booking-ui-api.spec.ts` | ✅ implementado (agente + skill) |

---

## 4. Escenarios de prueba

### Suite: BOOK — API

| ID | Escenario | Tipo | Prioridad | Estado |
|----|-----------|------|-----------|--------|
| TC-BOOK-01a | Crear reserva (Single, con depósito) y consultarla vía summary + report | API | Alta | ✅ automatizado |
| TC-BOOK-01b | Crear reserva (Double, sin depósito) y consultarla | API | Alta | ✅ automatizado |
| TC-BOOK-02 | `GET /api/booking/{id}` devuelve registro completo | API | Alta | ⏸ fixme — env 500 (CVO-02) |
| TC-BOOK-03 | Rechazo sin `firstname` (400 + errors) + no-creación | API neg | Alta | ✅ automatizado |
| TC-BOOK-04 | Rechazo con `phone` <11 dígitos (400 + errors) + no-creación | API neg | Alta | ✅ automatizado |
| TC-BOOK-05 | Rechazo sin `depositpaid` (contrato: 400) | API neg | Alta | ⚠ test.fail — bug CVO-06 |
| TC-BOOK-06 | Reserva solapada misma room+fechas → 409 | API | Media | 📋 documentado (casos-priorizados) |
| TC-BOOK-07 | `checkin > checkout` → 409 | API | Media | 📋 documentado |
| TC-BOOK-08 | `GET /api/report` sin token → 401/403 | API seg | Alta | 📋 documentado |

### Suite: BOOK — Integrado UI+API

| ID | Escenario | Tipo | Prioridad | Estado |
|----|-----------|------|-----------|--------|
| TC-BOOK-10 | Reservar por UI (datos sintéticos), verificar confirmación "Booking Confirmed", capturar `bookingid` vía `waitForResponse` y consultar el mismo registro por API | E2E integrado | Alta | ✅ automatizado — verde en instancia local corregida; en demo bloqueado por BUG-001 (500 en `/api/room/{id}`) |

**Precondición del TC-BOOK-10:** `GET /api/room/{id}` debe responder 200 — en la demo
falla por BUG-001 (rewrites horneadas a localhost en el build de `rbp-assets`). Se
levantó la plataforma local con `docker-compose` + fix del Dockerfile (ENV al stage
builder), donde el flujo completo funciona.

---

## 5. Usuarios y datos de prueba

| Rol | Fuente | Uso |
|-----|--------|-----|
| Huésped sintético | `buildBooking()` + faker | Datos de cada reserva (único por test) |
| Admin | `.env` `ADMIN_USERNAME`/`ADMIN_PASSWORD` (semilla `admin`/`password`) | Endpoints protegidos: summary, report, getById, delete |

**Variables de entorno** (en `.env.example`):
```bash
BASE_URL=https://automationintesting.online
ADMIN_USERNAME=admin
ADMIN_PASSWORD=password
```

**Aislamiento entre workers:** cada test usa una room distinta (1, 2, 3) o fechas
futuras aleatorias (60–300 días) → evita 409 por solape con otros tests y con
bookings de otros usuarios de la demo.

---

## 6. Configuración de Playwright

```typescript
workers: 2,
fullyParallel: true,
retries: process.env.CI ? 1 : 0,
use: {
  baseURL: process.env.BASE_URL,
  trace: 'retain-on-failure',
  screenshot: 'only-on-failure',
  video: 'retain-on-failure',
},
projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
```

---

## 7. Criterios de entrada
- [x] `.env` con BASE_URL y credenciales admin
- [x] Contrato explorado y diferencias registradas (`docs/contract-vs-observed.md`)
- [x] `GET /api/room/{id}` respondiendo 200 — en demo sigue 500 (BUG-001); resuelto vía instancia local con fix del Dockerfile
- [x] Skill `booking-e2e-architect` commiteada antes de su uso

## 8. Criterios de salida
- [x] Tests de prioridad Alta de API pasando (4/4 activos)
- [x] TC-BOOK-10 ejecutando y verde en instancia local; en demo bloqueado y documentado (BUG-001)
- [x] Parametrización con ≥2 datasets cumplida (01a/b, 03/04)
- [x] Reporte HTML conservado + exit codes en README
- [ ] Bugs reportados con pasos/esperado/observado (CVO-01, CVO-02, CVO-06)

---

## 9. Riesgos y mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|-----------|
| Ambiente compartido degradado (endpoints 500) | Alta | Alto | Registro CVO + fixme documentado; plan B: docker-compose local del repo fuente |
| Colisión de fechas entre workers o con otros usuarios → 409 falso | Media | Medio | Rooms distintas por test + fechas aleatorias 60–300 días |
| Reset de la demo durante la corrida | Media | Medio | Datos sintéticos siempre nuevos; ningún test depende de estado previo |
| Calendario UI frágil (días deshabilitados) | Media | Medio | Seleccionar primer día habilitado; selectores inspeccionados al viewport real |
| Cambios de UI en la demo | Baja | Medio | Selectores centralizados en `src/resources/*UI.ts` |

---

## 10. Estimación de esfuerzo

| Actividad | Estimado | Real |
|-----------|----------|------|
| Sondeo de contrato (API + fuente) | 0.5 h | ~0.5 h |
| Harness + clientes + fixtures + specs API | 1.5 h | ~1 h |
| SKILL.md + docs (plan, CVO, casos) | 1.0 h | ~0.75 h |
| Escenario integrado UI+API (con agente) | 1.0 h | ~1.2 h (incluye diagnóstico BUG-001 y fix del Dockerfile) |
| Revisión del resultado + README/evidencias | 0.5 h | ~0.3 h |
| **Total** | **4.5 h** | **~2.8 h** — restante: push a GitHub y reporte final |

---

## 11. Tags para gates

```bash
npm run test:smoke        # @smoke  → TC-BOOK-01a/b — gate pre-merge
npm run test:regression   # @regression → TC-BOOK-03/04/05 (+ e2e) — gate nocturno/pre-release
```

---

## 12. Historial de cambios
| Versión | Fecha | Cambio |
|---------|-------|--------|
| 1.0 | 2026-10-23 | Versión inicial — alcance del reto, escenarios API implementados, integrado pendiente por CVO-01 |
