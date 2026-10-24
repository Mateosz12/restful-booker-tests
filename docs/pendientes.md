# Pendientes para la entrega — estado al cierre de sesión 2026-10-23/24

## Estado actual

- Repo local: `C:\Users\Acer\OneDrive\Desktop\restful-booker-tests`
- Commits: `3de3cc0` (harness + skill, ANTES de usarla) → `aac41b2` (TC-BOOK-10 vía skill + evidencias) → `9003611` (resiliencia 409)
- Suite verde en demo para API: 5 passed, 1 skipped. En local: 6 passed, 1 skipped.
- Instancia local Docker corriendo en `C:\Users\Acer\OneDrive\Desktop\restful-booker-platform` (fix al `assets/Dockerfile`: ENV `*_API` movidas al stage builder — eso reparó `/api/room/{id}` y `/api/booking/{id}`).

## Lo que FALTA (por hacer mañana)

### 1. Push a GitHub (bloqueante para la entrega)
```powershell
cd C:\Users\Acer\OneDrive\Desktop\restful-booker-tests
gh repo create restful-booker-tests --public --source=. --push
# o crear repo en github.com y:
# git remote add origin https://github.com/<tu-usuario>/restful-booker-tests.git
# git push -u origin main
```

### 2. Completar en README.md
- Sección "Tiempo invertido" — ajustar a las horas reales (~2.8 h + mañana).
- Sección "Invocación / correcciones humanas" ya está escrita — revisarla y afinarla con tu voz.

### 3. Evidencias finales
- Guardar una corrida limpia completa y su reporte: `npm test` + `npm run report` → capturar exit code y copiar `playwright-report/` a `docs/evidencias/` (o referenciarlo).
- Screenshot del reporte HTML o del `npm run health` para `docs/evidencias/`.

### 4. Decisiones abiertas
- **TC-BOOK-10 en demo**: sigue rojo por BUG-001 (endpoint `/api/room/{id}` en 500). Opciones documentadas: (a) dejarlo rojo+documentado en demo y verde en local — lo más honesto; (b) si la demo se recupera antes de entregar, correrlo ahí y subir la evidencia.
- **Docker local**: `docker compose down` al terminar si no se usa; si queda para la sustentación, documentar cómo levantarlo (compilar JARs con JDK 26 → `maven:3.9-eclipse-temurin-26` en contenedor, luego `docker compose up -d --build`).

### 5. Repaso final antes de entregar (checklist del reto)
- [ ] Repo público con código, lockfile, config, skill, README
- [ ] Commit de la skill ANTES de usarla + commit del resultado (hecho: `3de3cc0` / `aac41b2`)
- [ ] Reporte de ejecución + resumen de casos/riesgos/limitaciones
- [ ] Bugs con pasos/esperado/observado/evidencia (BUG-001, BUG-002 listos)
- [ ] 3 propuestas de skills con justificación (`docs/propuestas-skills.md` listo)
- [ ] Tiempo invertido y pendientes declarados

## Datos clave para no perder contexto

- Credenciales admin de la app: `admin`/`password` (en `.env`).
- Auth: `POST /api/auth/login` → token en body → enviar como `Cookie: token=<v>`.
- Hallazgos en `docs/contract-vs-observed.md` (CVO-01..07) — la historia más fuerte del reto es BUG-001: rewrites horneadas a localhost en build.
- Local: `BASE_URL=http://localhost npm test`. Demo: `npm test`.
- La demo se reinicia sola — verificar `npm run health` mañana por si se recuperó.
