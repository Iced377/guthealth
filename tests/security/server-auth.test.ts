import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeAuth, fakeDb, seedProfiles, REVOKED_TOKEN } from './fake-firebase';

vi.mock('@/lib/firebase/admin', () => ({ adminAuth: fakeAuth, adminDb: fakeDb }));

const { requireUser, requireAdmin, AuthorizationError } = await import('@/lib/auth/server-auth');

beforeEach(() => {
    fakeDb.reset();
    seedProfiles();
    vi.clearAllMocks();
});

describe('requireUser', () => {
    it('returns the uid from a valid token', async () => {
        await expect(requireUser('token-user-a')).resolves.toBe('user-a');
    });

    it('checks for revoked tokens', async () => {
        await requireUser('token-user-a');
        expect(fakeAuth.verifyIdToken).toHaveBeenCalledWith('token-user-a', true);
        await expect(requireUser(REVOKED_TOKEN)).rejects.toMatchObject({ code: 'unauthenticated' });
    });

    it.each([
        ['missing', undefined],
        ['null', null],
        ['empty', ''],
        ['number', 42],
        ['object', { uid: 'user-a' }],
        ['oversized', 'x'.repeat(10000)],
    ])('rejects %s credentials without calling Firebase', async (_label, token) => {
        await expect(requireUser(token)).rejects.toBeInstanceOf(AuthorizationError);
        expect(fakeAuth.verifyIdToken).not.toHaveBeenCalled();
    });

    it('rejects an invalid or forged token', async () => {
        await expect(requireUser('forged-token')).rejects.toMatchObject({ code: 'unauthenticated' });
    });
});

describe('requireAdmin', () => {
    it('allows a user whose profile has isAdmin true', async () => {
        await expect(requireAdmin('token-admin')).resolves.toBe('admin-1');
    });

    it('denies a signed-in user without the admin flag', async () => {
        await expect(requireAdmin('token-user-a')).rejects.toMatchObject({ code: 'forbidden' });
    });

    it('denies when isAdmin is truthy but not true', async () => {
        fakeDb.docs.set('users/user-a', { isAdmin: 'true' });
        await expect(requireAdmin('token-user-a')).rejects.toMatchObject({ code: 'forbidden' });
    });

    it('denies when the profile does not exist', async () => {
        fakeDb.docs.delete('users/user-b');
        await expect(requireAdmin('token-user-b')).rejects.toMatchObject({ code: 'forbidden' });
    });

    it('denies unauthenticated callers', async () => {
        await expect(requireAdmin(undefined)).rejects.toMatchObject({ code: 'unauthenticated' });
    });
});
