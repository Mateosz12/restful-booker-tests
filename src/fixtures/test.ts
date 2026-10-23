import { test as base, expect } from '@playwright/test';
import { AuthClient } from '../api/authClient';
import { BookingClient } from '../api/bookingClient';
import { RoomClient } from '../api/roomClient';

type ApiFixtures = {
    baseApiUrl: string;
    adminToken: string;
    authClient: AuthClient;
    /** Cliente sin token — endpoints públicos (p.ej. POST /api/booking). */
    bookingClient: BookingClient;
    /** Cliente con token admin — endpoints protegidos (getById, summary, report, delete). */
    authedBookingClient: BookingClient;
    roomClient: RoomClient;
};

export const test = base.extend<ApiFixtures>({
    baseApiUrl: async ({}, use) => {
        await use(process.env.BASE_URL!);
    },

    authClient: async ({ request, baseApiUrl }, use) => {
        await use(new AuthClient(request, baseApiUrl));
    },

    adminToken: async ({ authClient }, use) => {
        const token = await authClient.login(
            process.env.ADMIN_USERNAME!,
            process.env.ADMIN_PASSWORD!,
        );
        await use(token);
    },

    bookingClient: async ({ request, baseApiUrl }, use) => {
        await use(new BookingClient(request, baseApiUrl));
    },

    authedBookingClient: async ({ request, baseApiUrl, adminToken }, use) => {
        await use(new BookingClient(request, baseApiUrl, adminToken));
    },

    roomClient: async ({ request, baseApiUrl }, use) => {
        await use(new RoomClient(request, baseApiUrl));
    },
});

export { expect };
