import { APIRequestContext } from '@playwright/test';

/**
 * Cliente del servicio auth de Restful Booker Platform.
 * POST /api/auth/login devuelve { token } — el token NO viaja en Authorization:
 * los endpoints protegidos lo exigen como cookie `token=<valor>` (verificado 2026-10-23).
 */
export class AuthClient {
    constructor(
        private readonly request: APIRequestContext,
        private readonly baseURL: string,
    ) {}

    async login(username: string, password: string): Promise<string> {
        const res = await this.request.post(`${this.baseURL}/api/auth/login`, {
            data: { username, password },
        });
        if (!res.ok()) {
            throw new Error(`Auth login failed: HTTP ${res.status()} — ${await res.text()}`);
        }
        const body = await res.json();
        return body.token as string;
    }

    async validate(token: string) {
        return this.request.post(`${this.baseURL}/api/auth/validate`, { data: { token } });
    }
}
