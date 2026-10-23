import { APIRequestContext, APIResponse } from '@playwright/test';

/** Cliente del servicio room. */
export class RoomClient {
    constructor(
        private readonly request: APIRequestContext,
        private readonly baseURL: string,
    ) {}

    /** GET /api/room — público. Lista de habitaciones. */
    async getRooms(): Promise<APIResponse> {
        return this.request.get(`${this.baseURL}/api/room`);
    }

    /** GET /api/room/{id} — público según docs. HOY devuelve 500 (ver docs/contract-vs-observed.md). */
    async getRoom(roomid: number): Promise<APIResponse> {
        return this.request.get(`${this.baseURL}/api/room/${roomid}`);
    }
}
