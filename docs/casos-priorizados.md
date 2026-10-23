# Casos priorizados no automatizados (propuesta)

Tres casos que priorizaría a continuación, con el riesgo que cubre cada uno.
Fuente de las expectativas: código fuente `BookingService.java` / `Booking.java` + colección Postman.

| Prioridad | Caso | Expectativa | Riesgo que cubre |
|---|---|---|---|
| 1 | **Reserva solapada** — misma habitación, fechas que se cruzan con una reserva existente | `POST /api/booking` → **409 Conflict**, sin `bookingid`; el registro nuevo no aparece en summary | Doble-booking: el peor fallo de negocio de un sistema de reservas (sobreventa de habitación). La suite actual solo prueba fechas libres |
| 2 | **Rango de fechas invertido** — `checkin > checkout` | **409 Conflict** (regla de negocio `DateCheckValidator`, no 400 de bean-validation) | Integridad de datos + semántica de API: confunde al consumidor si se documenta como 400. Distingue validación de forma (400) vs regla de negocio (409) |
| 3 | **Acceso no autenticado a endpoints protegidos** — `GET /api/report`, `GET /api/booking/{id}`, `DELETE /api/booking/{id}` sin `Cookie: token` | **401/403** sin cuerpo de datos | Seguridad/privacidad: el reporte expone nombres de huéspedes y fechas de estancia — fuga de datos personales si el filtro de auth falla |

Mención: el caso "campo obligatorio inválido" ya está cubierto por TC-BOOK-03/04 (parametrizado).

## Otros candidatos (backlog)

- `phone` presente pero <11 dígitos → 400; `email` mal formado → 400 (validaciones condicionales de campos opcionales).
- `DELETE /api/booking/{id}` → 202 y desaparición del summary (ciclo de vida completo).
- Concurrencia: dos `POST` simultáneos a la misma habitación/fechas → solo uno debe obtener 201.
- `GET /api/booking/unavailable?checkin=&checkout=` — endpoint público que alimenta "Check Availability" de la UI.
