'use client';

import { auth } from '@/config/firebase';

/**
 * Returns credentials for server actions that require a signed-in user.
 * Throws when no user is signed in, so callers fail before calling the server.
 */
export async function getActionAuth(): Promise<{ idToken: string }> {
    const user = auth.currentUser;
    if (!user) {
        throw new Error('Not signed in');
    }
    return { idToken: await user.getIdToken() };
}

/**
 * Wraps a server action whose first argument is the caller's credentials,
 * so call sites pass only the remaining arguments.
 */
export function withAuth<A extends unknown[], R>(
    action: (auth: { idToken: string }, ...args: A) => Promise<R>,
): (...args: A) => Promise<R> {
    return async (...args: A) => action(await getActionAuth(), ...args);
}
