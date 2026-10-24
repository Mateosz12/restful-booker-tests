/**
 * Selectores de la home (/) — descubiertos por inspección real del DOM
 * (2026-10-24, instancia local + demo: misma estructura).
 * Sin data-testid en la app → se usan atributos name/role/texto estable.
 */
export const HomeUI = {
    // Sección "Our Rooms"
    SEC_ROOMS:           'h2:has-text("Our Rooms")',
    BTN_CHECK_AVAIL:     'button:has-text("Check Availability")',
    INPUT_CHECKIN:       'textbox:near(:text("Check In"))',

    // Enlace "Book now" de cada habitación — apunta a /reservation/{id}?checkin=&checkout=
    roomBookLink: (roomid: number): string => `a[href^="/reservation/${roomid}?"]`,
};
