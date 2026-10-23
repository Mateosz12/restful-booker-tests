import { APIRequestContext, APIResponse } from '@playwright/test';
import { Booking } from '../models/booking';

/**
 * Cliente del servicio booking.
 * Instanciar SIN token para endpoints públicos (create) o CON token admin
 * para los protegidos (getById, getSummary, getReport, delete).
 * OJO: la API rechaza trailing slashes con 308 — las rutas aquí son exactas.
 */
export class BookingClient {
    constructor(
        private readonly request: APIRequestContext,
        private readonly baseURL: string,
        private readonly token?: string,
    ) {}

    private headers(): Record<string, string> {
        return this.token ? { Cookie: `token=${this.token}` } : {};
    }

    /** POST /api/booking — público. 201 Created; 400 validación de campos; 409 conflicto de fechas.
     *  Acepta Partial<Booking> para poder enviar payloads deliberadamente inválidos en tests negativos. */
    async create(booking: Booking | Partial<Booking>): Promise<APIResponse> {
        return this.request.post(`${this.baseURL}/api/booking`, {
            data: booking,
            headers: this.headers(),
        });
    }

    /** GET /api/booking/{id} — protegido (admin). Devuelve el booking completo o 404. */
    async getById(bookingid: number): Promise<APIResponse> {
        return this.request.get(`${this.baseURL}/api/booking/${bookingid}`, {
            headers: this.headers(),
        });
    }

    /** GET /api/booking/summary?roomid=N — protegido. Lista { bookingDates } por habitación. */
    async getSummary(roomid: number): Promise<APIResponse> {
        return this.request.get(`${this.baseURL}/api/booking/summary?roomid=${roomid}`, {
            headers: this.headers(),
        });
    }

    /** GET /api/report — protegido. Lista global "Name - Room: N" con fechas. */
    async getReport(): Promise<APIResponse> {
        return this.request.get(`${this.baseURL}/api/report`, { headers: this.headers() });
    }

    /** GET /api/booking/unavailable?checkin=&checkout= — público; ids de habitaciones no disponibles. */
    async checkUnavailability(checkin: string, checkout: string): Promise<APIResponse> {
        return this.request.get(
            `${this.baseURL}/api/booking/unavailable?checkin=${checkin}&checkout=${checkout}`,
            { headers: this.headers() },
        );
    }

    /** DELETE /api/booking/{id} — protegido. 202 Accepted si borra, 404 si no existe. */
    async delete(bookingid: number): Promise<APIResponse> {
        return this.request.delete(`${this.baseURL}/api/booking/${bookingid}`, {
            headers: this.headers(),
        });
    }
}
