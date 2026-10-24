# BUG-001 — `GET /api/room/{id}` y `GET /api/booking/{id}` devuelven 500 (rewrites horneadas a localhost)

| Campo | Valor |
|---|---|
| **Severidad** | Alta — rompe la página de reserva (`/reservation/{id}`) y la consulta por id de booking |
| **Clasificación** | **Bug de código/build** — determinista, reproduce en demo y en instancia local |
| **Detectado** | 2026-10-23 — sondeo API + reproducción en local con docker-compose |
| **Estado** | Confirmado con causa raíz y fix verificado en instancia local |
| **Refs** | CVO-01, CVO-02 en `docs/contract-vs-observed.md` |

## Pasos para reproducir

```bash
curl -i https://automationintesting.online/api/room/1        # → 500
curl -i https://automationintesting.online/api/room          # → 200 (la lista sí funciona)
```

Por UI: home → "Book now" en cualquier habitación → `/reservation/{id}` queda en blanco
(la SPA llama `/api/room/{id}`, recibe 500, no renderiza).

## Esperado

`HTTP 200` con el detalle del recurso — los servicios Java responden correctamente cuando
se les llama directo (`:3001/room/1`, `:3000/booking/1` → 200 con JSON completo).

## Observado

`HTTP 500` solo en los paths con parámetro `/{id}` (room, booking). Los endpoints sin
parámetro (`/api/room`, `POST /api/booking`) funcionan.

## Causa raíz (verificada)

1. `assets/next.config.js` define rewrites `/api/:svc/:path*` → `${SVC_API}/:svc/:path*`;
   estas env vars se leen **en build time** y quedan en `.next/routes-manifest.json`.
2. `assets/Dockerfile` define `ENV *_API=http://rbp-*` solo en el stage `runner` —
   DESPUÉS de `RUN npm run build` en el stage `builder`, donde no existen →
   el manifest hornea los fallbacks `http://localhost:300x`.
3. Las rewrites corren **antes que las dynamic routes** de la app → `/api/room/1`
   proxy a `localhost:3001` dentro del contenedor → `ECONNREFUSED` → catch → 500.
4. Las rutas estáticas (`/api/room`) se evalúan antes del rewrite → route handler
   con env correcta → 200. De ahí el patrón "solo falla `/{id}`".

Evidencias:
- `docker exec rbp-assets cat /app/.next/routes-manifest.json` → `localhost:3001/room/:path*`
- `docker logs rbp-assets` → `Failed to proxy http://localhost:3000/booking/1 · ECONNREFUSED 127.0.0.1:3000`
- Servicio directo `http://localhost:3001/room/1` → 200 OK.

## Fix (verificado en local)

Mover las `ENV *__API` al stage `builder` del `assets/Dockerfile`, ANTES de
`RUN npm run build`. Tras rebuild: manifest con `rbp-room:3001/room/:path*` →
`/api/room/1` → 200 y la página de reserva renderiza. Aplicable upstream.

## Impacto en la suite

- `TC-BOOK-02` en `fixme` contra la demo (endpoint caído allí); pasa en local.
- `TC-BOOK-10` (UI+API): desarrollado y verificado contra la instancia local corregida;
  queda bloqueado en la demo hasta que el fix llegue a su despliegue.
