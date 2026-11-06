// INC-002: the Fitbit Web API was turned off on 2 November 2026.
// While FITBIT_ENABLED is false, sync and connect must refuse without
// touching Firebase or calling Fitbit.
import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const getAdminApp = vi.hoisted(() => vi.fn());
const fetchMock = vi.hoisted(() => vi.fn());
vi.mock('@/lib/firebase/admin', () => ({ getAdminApp }));
vi.mock('node-fetch', () => ({ default: fetchMock }));

const { FITBIT_ENABLED } = await import('@/lib/featureFlags');
const sync = await import('@/app/api/fitbit/sync/route');
const initiate = await import('@/app/api/fitbit/initiate/route');

const post = (path: string) =>
    new NextRequest(`http://localhost${path}`, { method: 'POST', body: JSON.stringify({ idToken: 'token-user-a' }) });

describe('Fitbit integration paused', () => {
    it('is switched off', () => {
        expect(FITBIT_ENABLED).toBe(false);
    });

    it.each([
        ['sync', () => sync.POST(post('/api/fitbit/sync'))],
        ['initiate', () => initiate.POST(post('/api/fitbit/initiate'))],
    ])('%s returns 410 without calling Firebase or Fitbit', async (_name, call) => {
        const res = await call();
        expect(res.status).toBe(410);
        expect(getAdminApp).not.toHaveBeenCalled();
        expect(fetchMock).not.toHaveBeenCalled();
    });
});
