// Server-side caller verification for server actions.
// Server actions are public HTTP endpoints: never trust a user id sent by the client.
// This module is not a 'use server' file, so its exports are not callable from the client.
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export type AuthorizationErrorCode = 'unauthenticated' | 'forbidden';

export class AuthorizationError extends Error {
    readonly code: AuthorizationErrorCode;
    constructor(code: AuthorizationErrorCode, message: string) {
        super(message);
        this.name = 'AuthorizationError';
        this.code = code;
    }
}

const MAX_TOKEN_LENGTH = 8192;

/**
 * Verifies a Firebase ID token and returns the caller's uid.
 * Revoked tokens are rejected.
 */
export async function requireUser(idToken: unknown): Promise<string> {
    if (typeof idToken !== 'string' || idToken.length === 0 || idToken.length > MAX_TOKEN_LENGTH) {
        throw new AuthorizationError('unauthenticated', 'Missing or malformed credentials');
    }
    try {
        const decoded = await adminAuth.verifyIdToken(idToken, true);
        if (!decoded?.uid) {
            throw new Error('Token has no uid');
        }
        return decoded.uid;
    } catch {
        throw new AuthorizationError('unauthenticated', 'Invalid credentials');
    }
}

/**
 * Verifies the caller and requires users/{uid}.isAdmin === true,
 * the same rule used by firestore.rules isAdmin() and /api/admin/crm.
 */
export async function requireAdmin(idToken: unknown): Promise<string> {
    const uid = await requireUser(idToken);
    const snap = await adminDb.collection('users').doc(uid).get();
    if (!snap.exists || snap.data()?.isAdmin !== true) {
        throw new AuthorizationError('forbidden', 'Admin access required');
    }
    return uid;
}

export function isAuthorizationError(error: unknown): error is AuthorizationError {
    return error instanceof AuthorizationError;
}
