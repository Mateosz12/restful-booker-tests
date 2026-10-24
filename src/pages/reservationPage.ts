import { Page, expect } from '@playwright/test';
import { ReservationUI } from '../resources/reservationUI';
import { Booking } from '../models/booking';

export class ReservationPage {
    constructor(private readonly page: Page) {}

    /** Navega directo a la reserva con fechas preseleccionadas por query params. */
    async goto(roomid: number, checkin: string, checkout: string): Promise<void> {
        await this.page.goto(`/reservation/${roomid}?checkin=${checkin}&checkout=${checkout}`);
    }

    /** Primer "Reserve Now": despliega el formulario de huésped inline. */
    async startBooking(): Promise<void> {
        await this.page.locator(ReservationUI.BTN_RESERVE_NOW).click();
        await expect(
            this.page.locator(ReservationUI.INPUT_FIRSTNAME),
            'el formulario de huésped debe aparecer tras "Reserve Now"',
        ).toBeVisible();
    }

    async fillGuest(booking: Booking): Promise<void> {
        await this.page.locator(ReservationUI.INPUT_FIRSTNAME).fill(booking.firstname);
        await this.page.locator(ReservationUI.INPUT_LASTNAME).fill(booking.lastname);
        await this.page.locator(ReservationUI.INPUT_EMAIL).fill(booking.email!);
        await this.page.locator(ReservationUI.INPUT_PHONE).fill(booking.phone!);
    }

    /** Segundo "Reserve Now": envía el POST /api/booking. El spec captura la respuesta. */
    async submitBooking(): Promise<void> {
        await this.page.locator(ReservationUI.BTN_RESERVE_NOW).click();
    }

    /** Confirmación visible: título + fechas ISO exactas reservadas (la UI las muestra como "YYYY-MM-DD - YYYY-MM-DD"). */
    async assertConfirmed(checkin: string, checkout: string): Promise<void> {
        await expect(
            this.page.locator(ReservationUI.MSJ_CONFIRMED_TITLE),
            'debe mostrarse "Booking Confirmed" tras el envío',
        ).toBeVisible({ timeout: 15_000 });
        await expect(
            this.page.locator(ReservationUI.MSJ_CONFIRMED_BODY),
            'la confirmación debe listar las fechas reservadas',
        ).toBeVisible();
        await expect(
            this.page.getByText(`${checkin} - ${checkout}`),
            `la confirmación debe mostrar exactamente las fechas ${checkin} - ${checkout}`,
        ).toBeVisible();
    }
}
