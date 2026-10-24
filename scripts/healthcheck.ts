/**
 * Pre-flight del ambiente — sondea los endpoints críticos antes de correr la suite.
 * Uso: npm run health   (o BASE_URL=http://localhost npm run health)
 * Exit 0 = ambiente sano · Exit 1 = degradado (con diagnóstico por endpoint).
 * No sustituye a los tests: evita depurar fallos masivos que son del ambiente.
 */

const BASE_URL = process.env.BASE_URL ?? 'https://automationintesting.online';

interface Probe {
    name: string;
    url: string;
    criticalFor: string;
}

const PROBES: Probe[] = [
    { name: 'GET /api/room',            url: '/api/room',            criticalFor: 'suite completa' },
    { name: 'GET /api/room/{id}',       url: '/api/room/1',          criticalFor: 'flujo UI de reserva (TC-BOOK-10)' },
    { name: 'POST /api/auth/login',     url: '/api/auth/login',      criticalFor: 'endpoints protegidos (summary/report/delete)' },
    { name: 'UI home',                  url: '/',                    criticalFor: 'tests e2e' },
];

async function probe(p: Probe): Promise<{ ok: boolean; detail: string }> {
    try {
        const init: RequestInit = p.name.startsWith('POST')
            ? {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: process.env.ADMIN_USERNAME ?? 'admin',
                    password: process.env.ADMIN_PASSWORD ?? 'password',
                }),
            }
            : { method: 'GET' };
        const res = await fetch(`${BASE_URL}${p.url}`, init);
        return res.status < 500
            ? { ok: true,  detail: `HTTP ${res.status}` }
            : { ok: false, detail: `HTTP ${res.status} — servidor caído` };
    } catch (e) {
        return { ok: false, detail: `sin respuesta — ${(e as Error).message}` };
    }
}

async function main() {
    const results = await Promise.all(PROBES.map(async (p) => ({ p, r: await probe(p) })));
    let degraded = 0;
    for (const { p, r } of results) {
        const mark = r.ok ? 'OK ' : 'FAIL';
        if (!r.ok) degraded++;
        console.log(`[${mark}] ${p.name.padEnd(28)} ${r.detail.padEnd(32)} ← ${p.criticalFor}`);
    }
    if (degraded > 0) {
        console.log(`\nAmbiente DEGRADADO (${degraded}/${PROBES.length} endpoints caídos).`);
        console.log('Revisar docs/contract-vs-observed.md; considere instancia local (docker-compose del repo fuente).');
        process.exit(1);
    }
    console.log('\nAmbiente OK — suite lista para correr.');
    process.exit(0);
}

void main();
