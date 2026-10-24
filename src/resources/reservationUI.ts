/**
 * Selectores de /reservation/{id} — inspección real del DOM (2026-10-24, local).
 * El formulario de huésped aparece inline tras el primer clic en "Reserve Now";
 * el segundo clic envía la reserva (POST /api/booking).
 */
export const ReservationUI = {
    // Encabezado / info de la habitación
    LBL_ROOM_TITLE:      'h1',

    // Flujo: primer "Reserve Now" abre el formulario, el segundo lo envía
    BTN_RESERVE_NOW:     'button:has-text("Reserve Now")',
    BTN_CANCEL:          'button:has-text("Cancel")',

    // Formulario de huésped (atributo name — estable)
    INPUT_FIRSTNAME:     'input[name="firstname"]',
    INPUT_LASTNAME:      'input[name="lastname"]',
    INPUT_EMAIL:         'input[name="email"]',
    INPUT_PHONE:         'input[name="phone"]',

    // Confirmación (texto visible tras el POST exitoso)
    MSJ_CONFIRMED_TITLE: 'text=Booking Confirmed',
    MSJ_CONFIRMED_BODY:  'text=has been confirmed for the following dates',
};
