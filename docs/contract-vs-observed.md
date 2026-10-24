# Contrato vs. comportamiento observado — Restful Booker Platform

Registro vivo de diferencias entre la documentación (colección Postman / código fuente en
`mwinteringham/restful-booker-platform`) y el comportamiento real del ambiente
`https://automationintesting.online`. Cada entrada: endpoint, esperado, observado, evidencia, fecha.

> Ambiente compartido y reiniciable — verificar si cada discrepancia persiste antes de correr.

## Discrepancias activas (verificadas 2026-10-23)

| # | Endpoint / comportamiento | Contrato | Observado | Impacto |
|---|---|---|---|---|
| CVO-01 | `GET /api/room/{id}` | 200 con detalle de la habitación (público) | **500 Internal Server Error** para ids 1, 2 y 3 — **bug de build reproducible en demo y local** (ver Causa raíz ↓). **Corregido en instancia local** moviendo ENV al stage `builder` del Dockerfile | La página `/reservation/{id}` no renderiza en la demo → flujo UI bloqueado en demo; en local funciona tras el fix |
| CVO-02 | `GET /api/booking/{id}` | 200 con booking completo (admin), 404 si no existe | **500** — **misma causa raíz que CVO-01** (rewrite horneado a localhost). Localmente responde 200 con auth tras el fix | "Consultar por id" funciona en local; en demo se verifica vía `/api/booking/summary` y `/api/report`. `TC-BOOK-02` en fixme hasta que la demo se corrija |

### Causa raíz de CVO-01 / CVO-02 (verificada end-to-end el 2026-10-23)

No es degradación de ambiente: es un **bug determinista del build de la imagen `rbp-assets`**:

1. `assets/next.config.js` define rewrites `/api/{svc}/:path*` → `${SVC_API}/{svc}/:path*`; las env vars se resuelven **en build time** y quedan horneadas en `.next/routes-manifest.json`.
2. `assets/Dockerfile` declara `ENV ROOM_API=http://rbp-room:3001` (y las demás) **solo en el stage `runner`**, DESPUÉS de `npm run build` (stage `builder`, donde no están definidas) → el manifest se hornea con los fallbacks `http://localhost:300x`.
3. Las rewrites evalúan **antes que las rutas dinámicas** de Next (`app/api/room/[id]/route.ts`), así que `/api/room/1` va al proxy horneado → `connect ECONNREFUSED 127.0.0.1:3001` dentro del contenedor → catch → **500**.
4. Las rutas **estáticas** (`/api/room`, `POST /api/booking`) se resuelven en el check de filesystem ANTES del rewrite → ejecutan el route handler con la env correcta de runtime → funcionan. Por eso solo fallan los paths `/{id}`.
5. Evidencia: `docker exec rbp-assets cat .next/routes-manifest.json` mostraba `localhost:3001/room/:path*`; el servicio Java directo (`:3001/room/1`) respondía 200.

**Fix aplicado localmente** (clone del repo fuente, `assets/Dockerfile`): mover las 6 `ENV *_API` al stage `builder` antes de `npm run build` → el manifest hornea `rbp-*` → todos los endpoints 200. Mismo fix aplicable upstream (PR potencial).
| CVO-03 | `POST /api/booking/` (trailing slash) | — | **308 Permanent Redirect** | Clientes API deben usar rutas exactas sin slash final |
| CVO-04 | Auth en endpoints protegidos | token en cookie | `POST /api/auth/login` devuelve el token **en el body** (sin `Set-Cookie`); los endpoints protegidos lo aceptan como **`Cookie: token=<valor>`**; como header `token` o `Authorization` → 401 | `BookingClient` envía el token como cookie |
| CVO-05 | `POST /api/booking` respuesta | booking creado | 201 con `{bookingid, roomid, firstname, lastname, depositpaid, bookingdates}` — **omite `email` y `phone`** | Para verificar email/phone se necesita `GET /booking/{id}` (hoy caído, ver CVO-02) |
| CVO-06 | `POST /api/booking` sin `depositpaid` | 400 `"Deposit paid should not be null"` (`@NotNull` en `Booking.java`) | **201 Created** — crea la reserva con `depositpaid:false`. Causa raíz: Jackson asigna el default del `boolean` primitivo y `@NotNull` nunca evalúa | Campo "obligatorio" que no lo es — validación silenciosa. Cubierto por `TC-BOOK-05` (`test.fail`) con limpieza automática de la reserva creada |
| CVO-07 | `GET /api/booking/{id}` respuesta | booking completo con datos del huésped | 200 con `bookingid, roomid, firstname, lastname, depositpaid, bookingdates` — **`email` y `phone` ausentes**: el constructor `Booking(ResultSet)` del servicio no los mapea al leer de BD | Los datos de contacto del huésped no son recuperables por API tras crear la reserva (solo se usan para el servicio `message` al crear) |

## Comportamientos confirmados (coinciden con el código fuente)

- `POST /api/booking` sin `firstname` → **400** `{"errors":["Firstname should not be blank"]}`
- `POST /api/booking` con `firstname` <3 chars → **400** `{"errors":["size must be between 3 and 18"]}` — el mensaje **no nombra el campo** (mejorable)
- `POST /api/booking` con `phone` <11 dígitos → **400** `{"errors":["size must be between 11 and 21"]}`
- `POST /api/booking` con `email` mal formado → **400** `{"errors":["must be a well-formed email address"]}`
- `POST /api/auth/login` `admin/password` → **200** `{"token":"..."}`
- `GET /api/booking?roomid=1` sin auth → **401** `{"error":"Authentication required"}`
- `GET /api/booking/summary?roomid=1` con `Cookie: token` → **200** `{"bookings":[{bookingDates:{...}}]}`
- `GET /api/report` con `Cookie: token` → **200** — lista `"Name - Room: N"` con fechas

## Reglas de dominio extraídas del código fuente

`booking/src/main/java/com/automationintesting/`:

- `model/db/Booking.java`: `firstname` `@NotBlank`+`@Size(3,18)`; `lastname` `@NotBlank`+`@Size(3,30)`;
  `depositpaid` `@NotNull`; `email` opcional `@Email`; `phone` opcional `@Size(11,21)`; `roomid` `@Min(1)`.
- `service/BookingService.java`: reserva solapada → **409**; `checkin >= checkout` → **409** (regla de
  negocio, distinto del 400 de bean-validation); `DELETE` → **202**; booking con email+phone dispara
  un mensaje al servicio `message` (efecto secundario).
