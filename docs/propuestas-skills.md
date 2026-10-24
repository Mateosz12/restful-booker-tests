# Propuestas de skills adicionales

Tres skills que aportarían valor a este proyecto y al trabajo del equipo. Formato:
propósito · usuario · entradas/salidas · verificación · prioridad. Al final: cuál
construiría primero, cómo mediría su utilidad y qué resolvería con script/fixture.

---

## 1. `api-contract-sentinel` — PRIORIDAD ALTA (la que construiría primero)

- **Propósito**: comparar respuestas reales de la API contra el contrato documentado
  (colección Postman / código fuente) y mantener `docs/contract-vs-observed.md`
  actualizado automáticamente, con entrada por discrepancia (endpoint, esperado,
  observado, status, fecha, evidencia curl).
- **Usuario**: QA automation al iniciar un ciclo o al ver un 5xx/4xx inesperado;
  también el agente, como paso 1 del flujo de `booking-e2e-architect`.
- **Entradas**: base URL, lista de endpoints a sondear (o descubrimiento por
  colección), credenciales admin si aplica. **Salidas**: diff contrato↔observado en
  Markdown + exit code ≠0 si hay discrepancias nuevas (usable como gate).
- **Verificación**: correrlo contra un endpoint controlado donde se inyecta un
  cambio de contrato (mock local o versión distinta del servicio) y comprobar que
  genera la entrada correcta en el .md.
- **Por qué**: este reto ya lo necesitó — las discrepancias CVO-01..06 se
  descubrieron a mano con curl. Una skill las habría catalogado en minutos y las
  dejaría monitoreadas entre corridas.

## 2. `env-healthcheck` — PRIORIDAD ALTA

- **Propósito**: pre-flight del ambiente antes de ejecutar la suite: verifica que
  los endpoints críticos responden (`/api/room`, `/api/room/{id}`, `/api/auth/login`,
  `/api/booking`) y que la página raíz renderiza; aborta temprano con diagnóstico
  claro si el ambiente está degradado.
- **Usuario**: cualquier dev/QA antes de correr tests; el pipeline como primer job.
- **Entradas**: base URL + matriz de endpoints críticos. **Salidas**: reporte
  corto OK/DEGRADADO por endpoint + recomendación ("ambiente caído en X → los tests
  de reserva fallarán; considere instancia local").
- **Verificación**: apuntarlo a una URL muerta → debe fallar rápido con exit code 1
  y diagnóstico; a la demo sana → 0.
- **Por qué**: hoy `GET /api/room/{id}` → 500 hacía fallar en masa. Detectarlo en
  10 segundos ahorra depurar 5 tests "rotos" que eran ambiente, no código.

## 3. `defect-reporter` — PRIORIDAD MEDIA

- **Propósito**: a partir de un test fallido (trace, screenshot, response body),
  generar el reporte de bug con formato estándar: pasos para reproducir, esperado,
  observado, evidencia adjunta, severidad sugerida y clasificación
  (bug de app / bug de contrato / degradación de ambiente).
- **Usuario**: QA al encontrar un fallo real; reviewers que reciben el reporte.
- **Entradas**: resultado del test (JSON de Playwright + artifacts).
  **Salidas**: `docs/bugs/BUG-XXX.md` + entrada enlazada en `contract-vs-observed.md`
  si es discrepancia de contrato.
- **Verificación**: alimentarla con el trace de TC-BOOK-05 (depositpaid) → debe
  producir reporte con repro steps y la evidencia correcta.
- **Por qué**: el reto pide "si encuentras bugs: pasos, esperado, observado y
  evidencia". Estandarizarlo evita reportes incompletos y acelera el triage.

---

## ¿Cuál construir primero?

**`api-contract-sentinel`**. Es la de mayor apalancamiento: alimenta a las otras
(su output es input de `env-healthcheck` y de `defect-reporter`) y ataca el
problema más costoso del dominio — distinguir "la app cambió/está rota" de "mi
test está mal".

## ¿Cómo mediría su utilidad?

- **Tiempo a diagnóstico**: minutos desde el primer 5xx hasta la entrada CVO
  documentada (hoy: ~15 min manual; objetivo: <2 min automático).
- **Falsos positivos de test**: % de fallos de suite que eran ambiente y que el
  healthcheck habría evitado correr.
- **Adopción**: corridas por semana en el equipo; entradas CVO generadas por skill
  vs a mano.

## ¿Qué resolvería con un script o fixture en vez de skill?

- El sondeo de endpoints de `env-healthcheck` es esencialmente un script
  (`scripts/healthcheck.ts` con fetch + tabla de URLs) — la skill aporta el
  diagnóstico y la integración al flujo, pero el chequeo puro puede ser npm script
  `npm run health` usado también por CI.
- La creación/limpieza de bookings de prueba (semilla para tests UI) es mejor
  **fixture** que skill: `authedBookingClient.create()` + `delete()` en
  `afterEach` — determinista, sin juicio que delegar a un agente.
