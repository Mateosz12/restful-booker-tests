# BUG-002 — `POST /api/booking` sin `depositpaid` crea la reserva con `false` en vez de rechazar

| Campo | Valor |
|---|---|
| **Severidad** | Media — validación de contrato violada silenciosamente; dato de negocio (¿pagó?) incorrecto |
| **Clasificación** | Bug de código (reproduce en cualquier instancia, incluida local) |
| **Detectado** | 2026-10-23 — `TC-BOOK-05` en `tests/api/create-booking-negative.spec.ts` |
| **Estado** | Confirmado; cubierto por `test.fail()` que alertará si el backend se corrige |
| **Refs** | CVO-06 · `booking/src/main/java/com/automationintesting/model/db/Booking.java` |

## Pasos para reproducir

```bash
curl -X POST https://automationintesting.online/api/booking \
  -H "Content-Type: application/json" \
  -d '{"roomid":3,"firstname":"BugProbe","lastname":"Deposit",
       "email":"b.p@test.dev","phone":"12345678901",
       "bookingdates":{"checkin":"2027-06-10","checkout":"2027-06-11"}}'
# ojo: SIN el campo depositpaid
```

## Esperado

`HTTP 400` con `{"errors":["Deposit paid should not be null"]}` — la anotación
`@NotNull(message = "Deposit paid should not be null")` sobre `depositpaid` lo declara obligatorio.

## Observado

`HTTP 201` — la reserva se crea con `"depositpaid": false` (verificado también en el
response del POST y en `/api/report`).

## Causa raíz

En `Booking.java` el campo es `private boolean depositpaid` — **boolean primitivo**.
Jackson, al no encontrar la clave en el JSON, asigna el default del primitivo (`false`)
y `@NotNull` nunca evalúa un `null`: la validación es código muerto para ese campo.
Fix correcto: `Boolean depositpaid` (boxed) para que `@NotNull` sí pueda disparar.

## Impacto

- Los clientes API pueden crear reservas sin declarar estado de depósito — dato de
  negocio inventado por el servidor.
- La suite lo documenta sin debilitar la aserción: `test.fail()` mantiene el contrato
  y el test limpia la reserva creada (`DELETE` autenticado) para no contaminar la demo.

## Evidencia

- Fallo de `TC-BOOK-05` en la corrida del 2026-10-23: `Expected: 400, Received: 201`,
  body `{"bookingid":6,...,"depositpaid":false}`.
