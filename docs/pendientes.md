# Pendientes para la entrega — estado actualizado 2026-10-24

## Estado: ENTREGABLE COMPLETO

- Repo público: `https://github.com/Mateosz12/restful-booker-tests` (rama `main`, pusheado)
- Demo (`npm test`): API 5 passed + 1 skipped (TC-BOOK-02) + TC-BOOK-05 `test.fail` esperado;
  TC-BOOK-10 rojo en demo por BUG-001 (documentado, evidencia en test-results/).
- Local (`BASE_URL=http://localhost npm test`): **7 passed, exit 0** — cobertura completa.
- Evidencia commiteada en `docs/evidencias/` (reporte HTML + run-log).

## Checklist del reto

- [x] Repo público con código, lockfile, config, skill, README
- [x] Skill commiteada ANTES de usarla + commit del resultado (`3de3cc0` / `aac41b2`)
- [x] 3 escenarios mínimos (API éxito parametrizado ×2, negativo ×2+bug, integrado UI+API)
- [x] 3 casos documentados con riesgo (`docs/casos-priorizados.md`)
- [x] 3 propuestas de skills justificadas (`docs/propuestas-skills.md`)
- [x] Contrato vs observado (CVO-01..07) + bugs con repro/esperado/observado/evidencia
- [x] Reporte de ejecución preservado + exit codes
- [x] 2 workers, aislamiento, sin waits fijos, sin dependencias entre tests
- [x] Tiempo invertido y pendientes declarados

## Único opcional antes de entregar

- Releer README con voz propia (sección "Invocación / correcciones humanas").
- Ajustar "Tiempo invertido" al total real.
- `docker compose down` en `restful-booker-platform` si no se usa más
  (o dejarlo arriba para demo en vivo durante la sustentación).
- Si la demo se recupera, re-correr `npm test` y actualizar evidencia de TC-BOOK-10.
