import { faker } from '@faker-js/faker';
import { Booking, BookingDates } from '../models/booking';

/**
 * Genera un rango de fechas futuras aleatorio (60-300 días adelante, 1-3 noches).
 * Fechas lejanas y aleatorias minimizan colisiones 409 en la demo compartida,
 * tanto con bookings de otros usuarios como entre nuestros propios workers.
 */
export const futureDates = (offsetMinDays = 60): BookingDates => {
    const checkin = faker.date.soon({ days: 240, refDate: new Date(Date.now() + offsetMinDays * 86_400_000) });
    const checkout = new Date(checkin);
    checkout.setDate(checkout.getDate() + faker.number.int({ min: 1, max: 3 }));
    return {
        checkin: checkin.toISOString().slice(0, 10),
        checkout: checkout.toISOString().slice(0, 10),
    };
};

export const buildBooking = (overrides: Partial<Booking> = {}): Booking => ({
    roomid: 1,
    firstname: faker.person.firstName().slice(0, 18).padEnd(3, 'a'),
    lastname: faker.person.lastName().slice(0, 30).padEnd(3, 'a'),
    depositpaid: faker.datatype.boolean(),
    email: faker.internet.email(),
    phone: faker.string.numeric(11),
    bookingdates: futureDates(),
    ...overrides,
});
