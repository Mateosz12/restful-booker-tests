/**
 * Modelo de dominio para reservas de Restful Booker Platform.
 * Reglas de validación del backend (fuente: booking/src/main/java/.../model/db/Booking.java):
 *   firstname:   @NotBlank + @Size(3,18)
 *   lastname:    @NotBlank + @Size(3,30)
 *   depositpaid: @NotNull
 *   email:       opcional; si viene, @Email
 *   phone:       opcional; si viene, @Size(11,21)
 *   roomid:      @Min(1)
 *   bookingdates.checkin < bookingdates.checkout (regla de negocio → 409 si se viola)
 */

export interface BookingDates {
    checkin: string;   // formato YYYY-MM-DD
    checkout: string;  // formato YYYY-MM-DD
}

export interface Booking {
    roomid: number;
    firstname: string;
    lastname: string;
    depositpaid: boolean;
    email?: string;
    phone?: string;
    bookingdates: BookingDates;
}

/** Respuesta de POST /api/booking — no incluye email ni phone (verificado 2026-10-23). */
export interface CreatedBooking {
    bookingid: number;
    roomid: number;
    firstname: string;
    lastname: string;
    depositpaid: boolean;
    bookingdates: BookingDates;
}

/** Item de GET /api/booking/summary?roomid=N (requiere auth). Solo expone fechas. */
export interface BookingSummary {
    bookingid?: number;
    bookingDates: BookingDates;
}

/** Item de GET /api/report (requiere auth). title = "{firstname} {lastname} - Room: {roomName}". */
export interface ReportEntry {
    title: string;
    start: string;
    end: string;
}
