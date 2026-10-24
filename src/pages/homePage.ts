import { Page } from '@playwright/test';
import { HomeUI } from '../resources/homeUI';

export class HomePage {
    constructor(private readonly page: Page) {}

    async goto(): Promise<void> {
        await this.page.goto('/');
    }

    /** Clic en "Book now" de una habitación → navega a /reservation/{roomid}?checkin=&checkout=. */
    async openRoomReservation(roomid: number): Promise<void> {
        await this.page.locator(HomeUI.roomBookLink(roomid)).click();
        await this.page.waitForURL(new RegExp(`/reservation/${roomid}\\?`), { timeout: 15_000 });
    }
}
