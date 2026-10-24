# restful-booker-tests

Suite de pruebas API + UI para [Restful Booker Platform](https://automationintesting.online/)
— reto técnico de automatización full stack.

- **Stack**: TypeScript + Playwright Test. POM para UI, clientes de API separados.
- **App bajo prueba**: `https://automationintesting.online` (demo compartida, puede reiniciarse).
- **Contrato de referencia**: [colección Postman](https://www.postman.com/automation-in-testing/restful-booker-collections/documentation/ci13ds3/restful-booker-platform) · [repo fuente](https://github.com/mwinteringham/restful-booker-platform).
- **Diferencias contrato↔observado**: [`docs/contract-vs-observed.md`](docs/contract-vs-observed.md) — léalo antes de ejecutar; el ambiente puede tener endpoints caídos.

## Instalación

```bash
npm install
npx playwright install chromium
cp .env.example .env   # rellenar BASE_URL / ADMIN_USERNAME / ADMIN_PASSWORD
```

La validación de env vars requeridas ocurre en `playwright.config.ts` al arrancar.

## Ejecución (personas y agentes)

| Comando | Qué corre | Exit code |
|---|---|---|
| `npm test` | toda la suite | 0 si todo pasa; 1 si hay fallos |
| `npm run test:api` | escenarios API (`tests/api`) | idem |
| `npm run test:e2e` | escenario integrado UI+API (`tests/e2e`) | idem |
| `npm run test:smoke` | tests etiquetados `@smoke` | idem |
| `npm run test:regression` | tests etiquetados `@regression` | idem |
| `npm run report` | abre el reporte HTML (`playwright-report/`) | — |
| `npm run health` | **pre-flight**: sondea endpoints críticos del ambiente | 0 sano · 1 degradado |

`npm run health` detecta en ~5 s si el ambiente está degradado (p.ej. `GET /api/room/{id}`
en 500) antes de correr la suite — evita depurar fallos masivos que son del ambiente.
Correrlo antes de `npm test`; la decisión de cambiar de ambiente (`BASE_URL`) es manual.

Los tests corren con `workers: 2` (ver `playwright.config.ts`) y son independientes entre sí:
cada uno siembra su propia reserva con fechas/rooms que no solapan (un solape daría 409 real).

Evidencias ante fallo: screenshot + video + trace en `test-results/` (`retain-on-failure`).
**Una prueba no ejecutada no cuenta como aprobada** — conservar el reporte y los exit codes.

## Arquitectura

```
tests/{api|e2e}/*.spec.ts    ← lógica de test; sin selectores ni HTTP crudo
src/pages/*Page.ts           ← acciones + assert*/expect* con mensaje descriptivo
src/resources/*UI.ts         ← enums de selectores (único lugar donde viven)
src/api/*Client.ts           ← un cliente por servicio (auth, booking, room) → APIResponse
src/models/*.ts              ← interfaces + build*() factories (faker)
src/fixtures/test.ts         ← test.extend(): clientes, adminToken
src/utils/dataFactory.ts     ← datos sintéticos (fechas futuras, huéspedes)
```

Reglas duras: ningún selector fuera de `resources/`; ningún `waitForTimeout`; ninguna
dependencia entre tests; credenciales solo desde `.env`. Convenciones completas para agentes:
[`.claude/skills/booking-e2e-architect/SKILL.md`](.claude/skills/booking-e2e-architect/SKILL.md).

## Cobertura implementada

| Escenario | Spec | Estado |
|---|---|---|
| API exitosa: crear y consultar reserva (parametrizado ×2) | `tests/api/create-booking.spec.ts` — TC-BOOK-01a/b | ✅ |
| Consulta por id: `GET /api/booking/{id}` | TC-BOOK-02 | ⏸ `test.fixme` — endpoint 500 en el ambiente (CVO-02) |
| API negativa: campo ausente/inválido + no-creación (×2) | `tests/api/create-booking-negative.spec.ts` — TC-BOOK-03/04 | ✅ |
| API negativa: `depositpaid` ausente debe rechazarse | TC-BOOK-05 | ⚠ `test.fail` — bug del contrato documentado (CVO-06) |
| Integrado UI+API: reservar por UI, confirmar, consultar por API | `tests/e2e/booking-ui-api.spec.ts` — TC-BOOK-10 | ✅ implementado por agente vía skill — verde en instancia local corregida; en demo bloqueado por BUG-001 |

## Evidencia de uso de la skill por un agente

- **Invocación**: skill `booking-e2e-architect` (`.claude/skills/`) — commit `3de3cc0`
  anterior a su uso; el escenario TC-BOOK-10 se implementó siguiendo su flujo
  (contextualizar → inspeccionar con Playwright MCP → generar → verificar).
- **Cambios producidos por el agente**: `homeUI.ts`, `reservationUI.ts`, `homePage.ts`,
  `reservationPage.ts`, `tests/e2e/booking-ui-api.spec.ts`.
- **Ejecución**: `BASE_URL=http://localhost npx playwright test` → 6 passed, 1 skipped
  (fixme documentado), exit 0, workers=2. Contra la demo: TC-BOOK-10 rojo en la consulta
  por id — discrepancia documentada (BUG-001), aserción no debilitada.
- **Correcciones tras revisión humana** (justificadas):
  1. El flujo inicial entraba por la home vía "Book now", que fija fechas por defecto
     (hoy/mañana) ignorando los datos sintéticos → se cambió a `/reservation/{id}?checkin=
     &checkout=` directo, la URL que la propia app genera. Sin la corrección, el test
     verificaba la reserva equivocada.
  2. Aserción de año débil (`/2027/`) reemplazada por las fechas ISO exactas que la UI
     confirma (`YYYY-MM-DD - YYYY-MM-DD`).
  3. `email`/`phone` no se asertan en `GET /booking/{id}`: el servicio no los devuelve
     al leer (CVO-07, causa raíz en el código fuente) — se asertó el contrato real,
     no el ideal.
- **Bugs encontrados en el proceso**: BUG-001 (rewrites horneadas a localhost en el
  build — con fix verificado) y BUG-002 (`depositpaid` nullable violado). Reportes
  completos en `docs/bugs/`.

## Uso de la skill por un agente

La skill `booking-e2e-architect` guía la implementación del escenario integrado UI+API.
Evidencia del proceso (invocación, cambios, ejecución, correcciones humanas) en
[`docs/evidencias/`](docs/evidencias/) y en el historial de commits: **la skill fue commiteada
antes de usarse** (`git log` lo muestra).

- Invocación: *(completar tras la corrida)*
- Correcciones humanas aplicadas y por qué: *(completar tras la revisión)*

## Gates de smoke y regresión

Los tags `@smoke`/`@regression` permiten conectar la suite a gates sin Azure ni despliegue:
`npm run test:smoke` como gate rápido pre-merge (happy paths, <1 min); `npm run test:regression`
como gate nocturno o pre-release. En CI basta un job que corra el comando y propague el
exit code — el reporte HTML queda como artefacto.

## Casos priorizados y bugs

- Plan de pruebas (alcance, escenarios, riesgos): [`docs/test-plan.md`](docs/test-plan.md)
- Casos documentados no automatizados: [`docs/casos-priorizados.md`](docs/casos-priorizados.md)
- Propuestas de 3 skills adicionales: [`docs/propuestas-skills.md`](docs/propuestas-skills.md)
- Bugs / discrepancias con pasos, esperado y observado:
  [`docs/contract-vs-observed.md`](docs/contract-vs-observed.md) +
  reportes en [`docs/bugs/`](docs/bugs/) (BUG-001 ambiente, BUG-002 bug de código)
- Instancia local como contingencia: la suite corre contra cualquier instancia vía
  `BASE_URL` (p.ej. `http://localhost` con el `docker-compose` del repo fuente —
  requiere compilar los JARs con JDK 26 antes, ver `build_locally` del repo fuente).

## Tiempo invertido y pendientes

*(completar al cierre)* — Alcance mínimo priorizado sobre extras.
