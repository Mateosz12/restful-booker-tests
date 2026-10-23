# booking-e2e-architect — Implementador de pruebas API/UI (Restful Booker Platform)

## Propósito

Guía a un agente para implementar escenarios de prueba (API, UI o integrados UI+API) contra
**Restful Booker Platform** (`https://automationintesting.online`), respetando la arquitectura
en capas del repo y produciendo código verificable: los tests deben ejecutarse y pasar — o fallar
con evidencia documentada — antes de darse por terminados.

Está pensada para correr **de forma autónoma**: solo pregunta al humano cuando falte una entrada
crítica (ver § Entradas). En todo lo demás, decide con los defaults de esta skill y documenta
las decisiones en el propio cambio.

## Entradas

| Entrada | Requerida | Default si falta |
|---|---|---|
| Escenario a implementar (descripción en lenguaje natural) | Sí | — **preguntar** |
| `BASE_URL` del ambiente | No | `https://automationintesting.online` (en `.env`) |
| Credenciales admin (`ADMIN_USERNAME`/`ADMIN_PASSWORD`) | Para endpoints protegidos | `admin`/`password` (semilla del repo fuente) |
| Habitación objetivo (`roomid`) | No | Descubrir con `GET /api/room` y elegir una sin solape de fechas |
| Validaciones extra a incluir | No | Proponer desde § Propuesta de validaciones y aplicar las de mayor valor |

Si falta el escenario o las credenciales fallan con 401/403 en `/api/auth/login`, **detente y
pregunta**. Para cualquier otra ambigüedad, elige el default, regístralo en el cuerpo del cambio
(o commit) y continúa.

## Contexto obligatorio antes de escribir código

1. Lee `docs/contract-vs-observed.md` — ahí viven las diferencias ya detectadas entre la doc de
   Postman y el comportamiento real (p.ej. `GET /api/booking/{id}` → 500, `GET /api/room/{id}` → 500,
   trailing slash → 308, token viaja como `Cookie: token=`, reglas de validación por campo).
2. Consulta la colección Postman de la API (enlazada en `README.md`) solo como referencia — el
   comportamiento observado en el ambiente manda; las discrepancias se documentan, no se asumen.
3. Para flujos UI: inspecciona la página real ANTES de escribir selectores (ver § Inspección).

## Pasos

```
1. [CONTEXTUALIZAR] → leer docs/contract-vs-observed.md + .env + src/ existente
2. [INSPECCIONAR]   → UI: navegar la página real con una herramienta de inspección
                      (MCP de Playwright, playwright-cli o `page.evaluate`/`curl` para API)
                      y registrar selectores/respuestas REALES
3. [PROPONER]       → validaciones adicionales del § Propuesta; si no hay humano disponible,
                      incluir las de mayor valor y listar las descartadas
4. [GENERAR]        → artefactos en capas (ver § Arquitectura), sin saltarse capas
5. [VERIFICAR]      → ejecutar los tests con los comandos de § Verificación; iterar hasta
                      verde o documentar el bloqueo en docs/contract-vs-observed.md
6. [REGISTRAR]      → toda diferencia contrato↔observado nueva va a docs/contract-vs-observed.md
```

## Inspección (obligatoria para UI)

- Usa la herramienta de navegación disponible (Playwright MCP `browser_*`, playwright-cli, o en
  su defecto scripts con `page.goto`/`locator` en un spec temporal que luego se borra).
- **Nunca escribas un selector que no hayas visto en el DOM real.** Si no tienes herramienta de
  inspección, detente y repórtalo — no inventes `data-testid`.
- Jerarquía de selectores: `data-testid` → role ARIA + nombre accesible → label → texto visible →
  CSS descriptivo. Prohibido `.nth()` posicional y clases autogeneradas.
- Inspecciona al mismo viewport que usará el test (default 1280x720) — el layout puede cambiar.
- Registra mensajes de éxito/error reales del DOM → prefijo `MSJ_` en el enum del resource.
- El flujo de reserva UI es: home → "Check Availability" o "Book now" en una room →
  `/reservation/{roomid}?checkin=&checkout=` → formulario de huésped + calendario → "Book" →
  confirmación "Booking Successful!". Captura el `bookingid` con
  `page.waitForResponse(r => r.url().includes('/api/booking') && r.status() === 201)` — la UI
  no lo muestra y lo necesitas para consultar el mismo registro por API.
- Si `/api/room/{id}` responde 5xx, la página `/reservation/{id}` no renderiza: verifica ese
  endpoint primero (`curl -s -o /dev/null -w "%{http_code}" $BASE_URL/api/room/1`). Si está caído,
  documenta el bloqueo y avisa al humano — es un incidente de ambiente, no un fallo de tu test.

## Arquitectura (dependencia unidireccional: tests → pages → resources; api/ y fixtures/ son transversales)

```
tests/{api|e2e}/{feature}.spec.ts   ← lógica de test; sin selectores ni fetch/request crudos
src/pages/{feature}Page.ts          ← acciones + métodos assert*/expect* con mensaje descriptivo
src/resources/{feature}UI.ts        ← enums de selectores (prefijos BTN_ INPUT_ LBL_ MSJ_ NAV_)
src/api/{service}Client.ts          ← un cliente por servicio (auth, booking, room); devuelven
                                      APIResponse; nunca lanzan assertions
src/models/{entidad}.ts             ← interfaces + factory build*() con faker + Partial<T> override
src/fixtures/test.ts                ← test.extend(): clientes, adminToken, factories
src/utils/dataFactory.ts            ← helpers de datos sintéticos (futureDates, etc.)
```

### Reglas duras

- **Selectores**: solo en `src/resources/*UI.ts`. Prohibido `page.locator()` con literal en specs
  o page objects. Si un elemento no tiene selector estable, documenta `// TODO: pedir data-testid`
  en el enum y usa el mejor disponible.
- **Aserciones**: en el spec, o en métodos `assert*`/`expect*` del page object que fallan con
  mensaje descriptivo. Prohibido devolver `boolean` para que el spec haga `.toBe(true)` — eso
  borra el motivo real del fallo. Los clients API nunca asertan: devuelven `APIResponse`.
- **Esperas**: web-first (`expect(locator).toBeVisible()`, `waitForResponse`, `waitForURL`).
  Prohibido `waitForTimeout` y sleeps.
- **Independencia**: ningún test depende de otro. Cada test siembra sus datos (booking propio)
  y usa fechas/rooms que no solapen con otros tests del archivo (los workers corren en paralelo;
  solape mismo room+mismas fechas → 409).
- **Datos**: siempre sintéticos vía `build*()` + faker. Nada hardcodeado salvo constantes de
  contrato (rooms existentes, credenciales de `.env`).
- **Naming**: `TC-{SUITE}-{NN} — {comportamiento en presente}`; tags `@smoke` / `@regression`.
- **Env**: nuevas variables → `.env` y `.env.example`. Nada de secretos en código ni commits.
- **Bugs del ambiente o de la app**: NO debilites la aserción. Opciones honestas: (a) deja el
  test fallando con evidencia, o (b) `test.fixme()` citando la entrada en
  `docs/contract-vs-observed.md`. Nunca un `try/catch` que trague el fallo.

## Verificación

```bash
npm install                 # primera vez
npx playwright install chromium
npx playwright test tests/api --workers=2      # escenarios API
npx playwright test tests/e2e --workers=2      # escenario integrado UI+API
npm run report                                 # evidencia HTML
```

Criterios de éxito: exit code 0 para los escenarios implementados; todo `fixme`/`fail`
justificado con entrada en `docs/contract-vs-observed.md`; reporte HTML conservado;
cero `waitForTimeout`, cero selectores fuera de `resources/`, cero dependencias entre tests.

## Ante errores o información insuficiente

| Situación | Acción |
|---|---|
| Falta el escenario o credenciales inválidas | Detenerse, preguntar al humano |
| Endpoint devuelve 5xx de forma consistente | Verificar si es contrato o ambiente (reintentar 2-3 veces, revisar `contract-vs-observed.md`); documentar y seguir por la vía alternativa que exista (p.ej. `/summary` si `/{id}` falla) o marcar `fixme` |
| El DOM no tiene el elemento esperado | Re-inspeccionar; si es un cambio real de UI, registrar discrepancia; nunca inventar el selector |
| Respuesta difiere de la doc de Postman | Registrar en `contract-vs-observed.md` (endpoint, esperado, observado, fecha) y codificar contra lo observado |
| Test flaky | Reproducir 3 veces; si rota entre pasada/fallida sin causa de código, documentar como ambiental y NO enmascarar con retries |

## Propuesta de validaciones (elige las de mayor valor para el escenario)

- Reserva solapada misma room+mismas fechas → 409 (doble booking)
- `checkin > checkout` → 409 (no 400 — es regla de negocio, no bean validation)
- `email`/`phone` inválidos → 400 con `errors[]` descriptivo
- Endpoints protegidos sin token → 401/403
- Confirmación UI muestra fechas y nombre correctos; el booking aparece en `/api/report`
- Navegación atrás tras reservar no duplica el registro
