import { test, expect } from '../../src/fixtures/test';
import { buildBooking } from '../../src/utils/dataFactory';
import { Booking, BookingSummary } from '../../src/models/booking';

/**
 * Escenario 2 (parametrizado x2) — API negativa:
 * enviar un dato obligatorio ausente o inválido, validar el rechazo
 * (400 + errors[]) y que la reserva NO quedó creada (summary autenticado).
 *
 * Mensajes esperados según el código fuente (Booking.java):
 *   firstname ausente      → "Firstname should not be blank"
 *   phone presente <11 dig → "size must be between 11 and 21"
 *
 * TC-BOOK-05 documenta un bug real del contrato: `depositpaid` ausente debería
 * rechazarse 400 ("Deposit paid should not be null") pero el backend lo crea con
 * false (Jackson asigna el default del boolean primitivo y @NotNull nunca dispara).
 * Ver docs/contract-vs-observed.md — CVO-06.
 */

const negativeCases: {
    tc: string;
    label: string;
    mutate: (b: Booking) => Partial<Booking>;
    expectedError: RegExp;
}[] = [
    {
        tc: 'TC-BOOK-03',
        label: 'firstname ausente',
        mutate: ({ firstname: _omitted, ...rest }) => rest,
        expectedError: /Firstname should not be blank/i,
    },
    {
        tc: 'TC-BOOK-04',
        label: 'phone inválido (<11 dígitos)',
        mutate: (b) => ({ ...b, phone: '123' }),
        expectedError: /size must be between 11 and 21/i,
    },
];

test.describe('BOOK — validaciones negativas de creación (API)', () => {
    test.describe.configure({ timeout: 30_000 });

    for (const c of negativeCases) {
        test(`${c.tc} — rechaza reserva con ${c.label} y no la crea @regression`, async ({
            bookingClient,
            authedBookingClient,
        }) => {
            const fullBooking = buildBooking({ roomid: 3 });
            const payload = c.mutate(fullBooking);

            const res = await bookingClient.create(payload);
            expect(
                res.status(),
                `POST /api/booking con ${c.label} debe responder 400 — body: ${await res.text()}`,
            ).toBe(400);

            const body = await res.json();
            expect(body.bookingid, 'una reserva rechazada no debe devolver bookingid').toBeUndefined();
            expect(
                (body.errors as string[]).join(' '),
                'errors[] debe describir el campo rechazado',
            ).toMatch(c.expectedError);

            // Verificar que no se creó: el summary de la room no debe contener esas fechas
            const summaryRes = await authedBookingClient.getSummary(fullBooking.roomid);
            expect(summaryRes.status()).toBe(200);
            const summaries = (await summaryRes.json()).bookings as BookingSummary[];
            const leaked = summaries.some(
                (b) =>
                    b.bookingDates.checkin === fullBooking.bookingdates.checkin &&
                    b.bookingDates.checkout === fullBooking.bookingdates.checkout,
            );
            expect(
                leaked,
                `no debe existir una reserva en room ${fullBooking.roomid} con fechas ${fullBooking.bookingdates.checkin}→${fullBooking.bookingdates.checkout}`,
            ).toBe(false);
        });
    }

    // Bug documentado (CVO-06): depositpaid ausente debe dar 400 pero la API crea la
    // reserva con depositpaid=false. test.fail() mantiene el contrato como aserción real:
    // si el backend se corrige, este test "falla" y avisa del cambio de comportamiento.
    test.fail(
        'TC-BOOK-05 — rechaza reserva sin depositpaid (bug: hoy la crea con false) @regression',
        async ({ bookingClient, authedBookingClient }) => {
            const { depositpaid: _omitted, ...payload } = buildBooking({ roomid: 3 });
            const res = await bookingClient.create(payload);
            const body = await res.json();

            // Higiene: el defecto crea la reserva — borrarla para no contaminar la demo compartida
            if (body.bookingid) {
                await authedBookingClient.delete(body.bookingid);
            }

            expect(
                res.status(),
                'contrato: 400 "Deposit paid should not be null" — observado: 201 con depositpaid=false (CVO-06)',
            ).toBe(400);
            expect((body.errors as string[])?.join(' ')).toMatch(/Deposit paid should not be null/i);
        },
    );
});
