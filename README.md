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
| Integrado UI+API: reservar por UI, confirmar, consultar por API | `tests/e2e/` | ⏳ pendiente — implementado por agente vía la skill |

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

- Casos documentados no automatizados: [`docs/casos-priorizados.md`](docs/casos-priorizados.md)
- Bugs / discrepancias con pasos, esperado y observado: [`docs/contract-vs-observed.md`](docs/contract-vs-observed.md)

## Tiempo invertido y pendientes

*(completar al cierre)* — Alcance mínimo priorizado sobre extras.
