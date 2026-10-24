import { faker } from '@faker-js/faker';
import { test, expect } from '../../src/fixtures/test';
import { buildBooking, futureDates } from '../../src/utils/dataFactory';
import { ReservationPage } from '../../src/pages/reservationPage';
import { CreatedBooking } from '../../src/models/booking';

/**
 * Escenario 3 — UI y API integradas:
 * completar una reserva por UI, verificar la confirmación y consultar
 * por API el MISMO registro para comprobar sus datos.
 *
 * Implementado por el agente siguiendo .claude/skills/booking-e2e-architect/SKILL.md.
 *
 * Captura del bookingid: la UI no lo muestra — se toma de la respuesta real del
 * POST /api/booking con waitForResponse (skill § Inspección).
 *
 * OJO con el ambiente: en la demo pública GET /api/booking/{id} responde 500
 * (BUG-001 — rewrites horneadas a localhost). Verificado funcionando contra la
 * instancia local corregida; contra la demo este test quedará rojo en la
 * consulta por id — discrepancia documentada, no se debilita la aserción.
 */

test.describe('BOOK — reserva integrada UI + API', () => {
    test.describe.configure({ timeout: 60_000 });

    test('TC-BOOK-10 — reserva por UI y verifica el mismo registro por API @smoke @regression', async ({
        page,
        authedBookingClient,
    }) => {
        // Room y ventana de fechas aleatorias: la instancia local también acumula
        // reservas entre corridas y un solape daría 409 (regla de negocio real).
        const dates = futureDates(120);
        const roomid = faker.helpers.arrayElement([1, 2, 3]);
        const guest = buildBooking({ roomid, bookingdates: dates });

        // Flujo UI: /reservation/{id}?checkin=&checkout= (la URL que la propia app
        // genera desde "Book now"/"Check Availability") → formulario → confirmación.
        // NOTA: entrar por la home via "Book now" usa fechas por defecto (hoy/mañana),
        // no controladas — por eso se fija el rango explícito en la URL.
        const reservation = new ReservationPage(page);
        await reservation.goto(guest.roomid, dates.checkin, dates.checkout);
        await reservation.startBooking();
        await reservation.fillGuest(guest);

        const createResponsePromise = page.waitForResponse(
            (r) => r.url().includes('/api/booking') && r.request().method() === 'POST',
            { timeout: 15_000 },
        );
        await reservation.submitBooking();

        const createResponse = await createResponsePromise;
        expect(
            createResponse.status(),
            'el POST /api/booking disparado por la UI debe responder 201',
        ).toBe(201);
        const created = (await createResponse.json()) as CreatedBooking;
        expect(created.bookingid, 'el POST debe devolver bookingid').toBeGreaterThan(0);

        await reservation.assertConfirmed(dates.checkin, dates.checkout);

        // Consulta por API del MISMO registro — datos completos del huésped
        const getRes = await authedBookingClient.getById(created.bookingid);
        expect(
            getRes.status(),
            `GET /api/booking/${created.bookingid} debe responder 200 — en la demo responde 500 (BUG-001)`,
        ).toBe(200);
        const fetched = await getRes.json();
        expect(fetched.bookingid).toBe(created.bookingid);
        expect(fetched.roomid).toBe(guest.roomid);
        expect(fetched.firstname).toBe(guest.firstname);
        expect(fetched.lastname).toBe(guest.lastname);
        // CVO-07: GET /booking/{id} nunca devuelve email/phone — el constructor
        // Booking(ResultSet) del servicio no los mapea. No se asertan aquí.
        // depositpaid no se controla por UI (el formulario no lo expone) — se
        // verifica contra el valor que el POST de la UI envió realmente.
        expect(fetched.depositpaid).toBe(created.depositpaid);
        expect(fetched.bookingdates).toEqual(guest.bookingdates);
    });
});
