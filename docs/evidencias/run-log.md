# Log de ejecución — 2026-10-24

## Instancia local (docker-compose, BUG-001 corregido)
- Comando: `BASE_URL=http://localhost npx playwright test`
- Resultado: **7 passed, 0 skipped, exit 0** (4.3s, workers=2)
- Incluye TC-BOOK-02 (GET por id) y TC-BOOK-10 (integrado UI+API) verdes.
- TC-BOOK-05 reportado como `test.fail` esperado (bug CVO-06) → cuenta como pass esperado.
- Reporte HTML preservado en `report-local-2026-10-24/index.html` (abrir en navegador).

## Demo https://automationintesting.online (misma fecha)
- Comando: `npm test` · healthcheck previo: DEGRADADO (`GET /api/room/{id}` → 500).
- API: **5 passed, 1 skipped** (TC-BOOK-02 en fixme condicional), exit 0.
- TC-BOOK-10: fallo esperado — la página /reservation/{id} no renderiza por BUG-001
  (evidencia en test-results/: screenshot + video + trace, retain-on-failure).
- Se observaron además timeouts IPv6 transitorios a Cloudflare en una corrida (red, no app).

## Interpretación
- Exit 0 en demo = suite API verde + escenario integrado bloqueado por defecto de
  despliegue documentado (no por la suite).
- Exit 0 en local = cobertura completa verde contra el mismo código v2.2.
