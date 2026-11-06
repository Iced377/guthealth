// In-memory stand-ins for the Firebase Admin SDK, used by the security tests.
// Synthetic users only. No network access and no real project.
import { vi } from 'vitest';

export const TOKENS: Record<string, string> = {
    'token-user-a': 'user-a',
    'token-user-b': 'user-b',
    'token-admin': 'admin-1',
};
export const REVOKED_TOKEN = 'token-revoked';

type Doc = Record<string, unknown>;

export class FakeDb {
    docs = new Map<string, Doc>();
    added: { collection: string; data: Doc }[] = [];
    writes: { path: string; data: Doc }[] = [];

    collection(name: string) {
        return new FakeCollection(this, name);
    }
    reset() {
        this.docs.clear();
        this.added = [];
        this.writes = [];
    }
}

class FakeCollection {
    constructor(private db: FakeDb, private path: string) {}
    doc(id: string) {
        return new FakeDocRef(this.db, `${this.path}/${id}`);
    }
    async add(data: Doc) {
        this.db.added.push({ collection: this.path, data });
        return { id: `auto-${this.db.added.length}` };
    }
    where() {
        return this;
    }
    async get() {
        return { empty: true, docs: [] };
    }
}

class FakeDocRef {
    constructor(private db: FakeDb, readonly path: string) {}
    collection(name: string) {
        return new FakeCollection(this.db, `${this.path}/${name}`);
    }
    async get() {
        const data = this.db.docs.get(this.path);
        return { exists: data !== undefined, data: () => data };
    }
    async set(data: Doc) {
        this.db.writes.push({ path: this.path, data });
        this.db.docs.set(this.path, { ...(this.db.docs.get(this.path) ?? {}), ...data });
    }
}

export const fakeDb = new FakeDb();

export const fakeAuth = {
    verifyIdToken: vi.fn(async (token: string, checkRevoked?: boolean) => {
        if (token === REVOKED_TOKEN && checkRevoked) {
            throw Object.assign(new Error('revoked'), { code: 'auth/id-token-revoked' });
        }
        const uid = TOKENS[token];
        if (!uid) {
            throw Object.assign(new Error('invalid'), { code: 'auth/argument-error' });
        }
        return { uid };
    }),
    listUsers: vi.fn(async () => ({
        users: [{ uid: 'synthetic-1', email: 'synthetic-1@example.test', metadata: { creationTime: 'Mon, 02 Nov 2026 00:00:00 GMT', lastSignInTime: undefined } }],
        pageToken: undefined,
    })),
};

export function seedProfiles() {
    fakeDb.docs.set('users/user-a', { displayName: 'Synthetic A' });
    fakeDb.docs.set('users/user-b', { displayName: 'Synthetic B' });
    fakeDb.docs.set('users/admin-1', { displayName: 'Synthetic Admin', isAdmin: true });
    fakeDb.docs.set('users/user-a/timelineEntries/entry-a1', { name: 'pending' });
    fakeDb.docs.set('users/user-b/timelineEntries/entry-b1', { name: 'pending' });
}
