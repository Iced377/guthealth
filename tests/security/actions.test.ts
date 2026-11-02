// F-01 regression tests: every exported server action must reject callers
// without valid credentials, and must act only on the caller's own data.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeAuth, fakeDb, seedProfiles } from './fake-firebase';

vi.mock('@/lib/firebase/admin', () => ({ adminAuth: fakeAuth, adminDb: fakeDb }));

const flows = vi.hoisted(() => ({
    identifyFoodFromImage: vi.fn(async () => ({ recognitionSuccess: true, identifiedFoodName: 'Synthetic toast', identifiedIngredients: 'bread', estimatedPortionSize: '1', estimatedPortionUnit: 'slice' })),
    analyzeFoodItem: vi.fn(async () => ({ overallRisk: 'Green', reason: 'synthetic', calories: 80, protein: 3, carbs: 15, fat: 1 })),
    isSimilarToSafeFoods: vi.fn(async () => ({ isSimilar: false })),
    processMealDescription: vi.fn(async () => ({ wittyName: 'Synthetic', primaryFoodItemForAnalysis: 'toast', consolidatedIngredients: 'bread', estimatedPortionSize: '1', estimatedPortionUnit: 'slice' })),
    getPersonalizedDietitianInsight: vi.fn(async () => ({ aiResponse: 'synthetic' })),
    processFeedback: vi.fn(async (input: unknown) => ({ received: input })),
    verifyFoodAnalysisFlow: vi.fn(async (input: unknown) => ({ verified: true, flags: [], received: input })),
}));

vi.mock('@/ai/flows/identify-food-from-image-flow', () => ({ identifyFoodFromImage: flows.identifyFoodFromImage }));
vi.mock('@/ai/flows/fodmap-detection', () => ({ analyzeFoodItem: flows.analyzeFoodItem }));
vi.mock('@/ai/flows/food-similarity', () => ({ isSimilarToSafeFoods: flows.isSimilarToSafeFoods }));
vi.mock('@/ai/flows/process-meal-description-flow', () => ({ processMealDescription: flows.processMealDescription }));
vi.mock('@/ai/flows/personalized-dietitian-flow', () => ({ getPersonalizedDietitianInsight: flows.getPersonalizedDietitianInsight }));
vi.mock('@/ai/flows/process-feedback-flow', () => ({ processFeedback: flows.processFeedback }));
vi.mock('@/ai/flows/verify-food-analysis', () => ({ verifyFoodAnalysisFlow: flows.verifyFoodAnalysisFlow }));

const foodActions = await import('@/actions/food-analysis');
const adminActions = await import('@/actions/admin');
const aiActions = await import('@/actions/ai');

const userA = { idToken: 'token-user-a' };
const admin = { idToken: 'token-admin' };
const badCredentials: [string, any][] = [
    ['no credentials', undefined],
    ['empty token', { idToken: '' }],
    ['forged token', { idToken: 'forged-token' }],
    ['revoked token', { idToken: 'token-revoked' }],
];

const anyFlowCalled = () => Object.values(flows).some((fn) => fn.mock.calls.length > 0);

beforeEach(() => {
    fakeDb.reset();
    seedProfiles();
    vi.clearAllMocks();
});

describe('triggerFoodAnalysis', () => {
    it.each(badCredentials)('rejects %s without AI calls or writes', async (_label, auth) => {
        const result = await foodActions.triggerFoodAnalysis(auth, 'entry-a1', 'data:image/png;base64,AAAA');
        expect(result).toEqual({ success: false, error: 'unauthenticated' });
        expect(anyFlowCalled()).toBe(false);
        expect(fakeDb.writes).toHaveLength(0);
    });

    it("rejects another user's entry id", async () => {
        const result = await foodActions.triggerFoodAnalysis(userA, 'entry-b1', 'data:image/png;base64,AAAA');
        expect(result).toEqual({ success: false, error: 'not_found' });
        expect(anyFlowCalled()).toBe(false);
        expect(fakeDb.writes).toHaveLength(0);
    });

    it('rejects an entry id that tries to escape the collection', async () => {
        const result = await foodActions.triggerFoodAnalysis(userA, '../../user-b/timelineEntries/entry-b1', undefined);
        expect(result).toEqual({ success: false, error: 'not_found' });
        expect(fakeDb.writes).toHaveLength(0);
    });

    it("analyses the caller's own entry and writes only under the caller's uid", async () => {
        const result = await foodActions.triggerFoodAnalysis(userA, 'entry-a1', 'data:image/png;base64,AAAA');
        expect(result).toEqual({ success: true });
        expect(fakeDb.writes.map((w) => w.path)).toEqual(['users/user-a/timelineEntries/entry-a1']);
    });
});

describe('triggerTextFoodAnalysis', () => {
    it.each(badCredentials)('rejects %s', async (_label, auth) => {
        const result = await foodActions.triggerTextFoodAnalysis(auth, 'entry-a1', 'toast', false);
        expect(result).toEqual({ success: false, error: 'unauthenticated' });
        expect(anyFlowCalled()).toBe(false);
    });

    it("rejects another user's entry id", async () => {
        const result = await foodActions.triggerTextFoodAnalysis(userA, 'entry-b1', 'toast', false);
        expect(result).toEqual({ success: false, error: 'not_found' });
        expect(fakeDb.writes).toHaveLength(0);
    });

    it("writes only to the caller's own entry", async () => {
        const result = await foodActions.triggerTextFoodAnalysis(userA, 'entry-a1', 'toast', false);
        expect(result).toEqual({ success: true });
        expect(fakeDb.writes.map((w) => w.path)).toEqual(['users/user-a/timelineEntries/entry-a1']);
    });
});

describe('client logging actions', () => {
    it.each(badCredentials)('logAdminEvent rejects %s', async (_label, auth) => {
        const result = await foodActions.logAdminEvent(auth, { type: 'analysis_failure' });
        expect(result.success).toBe(false);
        expect(fakeDb.added).toHaveLength(0);
    });

    it('logAdminEvent rejects unknown event types', async () => {
        const result = await foodActions.logAdminEvent(userA, { type: 'hallucination_detected' } as any);
        expect(result).toEqual({ success: false, error: 'invalid_event' });
        expect(fakeDb.added).toHaveLength(0);
    });

    it('logAdminEvent stores only known fields and the verified uid', async () => {
        await foodActions.logAdminEvent(userA, { type: 'analysis_failure', foodName: 'toast', user: 'user-b', resolved: true } as any);
        expect(fakeDb.added).toHaveLength(1);
        const stored = fakeDb.added[0].data;
        expect(stored.user).toBe('user-a');
        expect(stored).not.toHaveProperty('resolved');
    });

    it.each(badCredentials)('logAiPerformanceMetric rejects %s', async (_label, auth) => {
        const result = await foodActions.logAiPerformanceMetric(auth, { flow: 'scan', durationMs: 10, success: true });
        expect(result.success).toBe(false);
        expect(fakeDb.added).toHaveLength(0);
    });

    it('logAiPerformanceMetric records the verified uid, not a client value', async () => {
        await foodActions.logAiPerformanceMetric(userA, { flow: 'scan', durationMs: 10, success: true, userId: 'user-b' } as any);
        expect(fakeDb.added[0].data.userId).toBe('user-a');
    });

    it.each(badCredentials)('logAiTelemetryEvent rejects %s', async (_label, auth) => {
        const result = await foodActions.logAiTelemetryEvent(auth, { type: 'recalc_skipped' });
        expect(result.success).toBe(false);
        expect(fakeDb.added).toHaveLength(0);
    });

    it('logAiTelemetryEvent rejects server-only event types from the client', async () => {
        const result = await foodActions.logAiTelemetryEvent(userA, { type: 'hallucination_flagged' });
        expect(result).toEqual({ success: false, error: 'invalid_event' });
    });
});

describe('admin actions', () => {
    it.each([...badCredentials, ['non-admin user', userA]])('getAuthUsersAction denies %s and lists no users', async (_label, auth) => {
        const result = await adminActions.getAuthUsersAction(auth);
        expect(result.success).toBe(false);
        expect(result.users).toBeUndefined();
        expect(fakeAuth.listUsers).not.toHaveBeenCalled();
    });

    it('getAuthUsersAction allows an admin', async () => {
        const result = await adminActions.getAuthUsersAction(admin);
        expect(result.success).toBe(true);
        expect(fakeAuth.listUsers).toHaveBeenCalled();
    });

    it.each([...badCredentials, ['non-admin user', userA]])('getAcquisitionStats denies %s', async (_label, auth) => {
        await expect(adminActions.getAcquisitionStats(auth, 'monthly')).rejects.toThrow('Not authorised');
        expect(fakeAuth.listUsers).not.toHaveBeenCalled();
    });

    it('getAcquisitionStats allows an admin', async () => {
        await expect(adminActions.getAcquisitionStats(admin, 'monthly')).resolves.toBeInstanceOf(Array);
    });

    it.each([...badCredentials, ['non-admin user', userA]])('checkNewJoinersSince returns false for %s', async (_label, auth) => {
        await expect(adminActions.checkNewJoinersSince(auth)).resolves.toBe(false);
    });
});

describe('AI actions', () => {
    const calls: [string, (auth: any) => Promise<unknown>][] = [
        ['analyzeFoodItemAction', (auth) => aiActions.analyzeFoodItemAction(auth, { foodItem: 'toast' } as any)],
        ['isSimilarToSafeFoodsAction', (auth) => aiActions.isSimilarToSafeFoodsAction(auth, {} as any)],
        ['identifyFoodFromImageAction', (auth) => aiActions.identifyFoodFromImageAction(auth, {} as any)],
        ['processMealDescriptionAction', (auth) => aiActions.processMealDescriptionAction(auth, { mealDescription: 'toast' } as any)],
        ['getPersonalizedDietitianInsightAction', (auth) => aiActions.getPersonalizedDietitianInsightAction(auth, {} as any)],
        ['processFeedbackAction', (auth) => aiActions.processFeedbackAction(auth, { feedbackText: 'x' } as any)],
        ['verifyFoodAnalysisAction', (auth) => aiActions.verifyFoodAnalysisAction(auth, {} as any)],
    ];

    for (const [name, call] of calls) {
        it.each(badCredentials)(`${name} rejects %s without calling the model`, async (_label, auth) => {
            await expect(call(auth)).rejects.toMatchObject({ code: 'unauthenticated' });
            expect(anyFlowCalled()).toBe(false);
        });

        it(`${name} runs for a signed-in user`, async () => {
            await expect(call(userA)).resolves.toBeDefined();
        });
    }

    it('processFeedbackAction replaces a client-supplied userId with the verified uid', async () => {
        await aiActions.processFeedbackAction(userA, { feedbackText: 'x', userId: 'user-b' } as any);
        expect(flows.processFeedback).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user-a' }));
    });

    it('verifyFoodAnalysisAction replaces a client-supplied userId with the verified uid', async () => {
        await aiActions.verifyFoodAnalysisAction(userA, { userId: 'user-b' } as any);
        expect(flows.verifyFoodAnalysisFlow).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user-a' }));
    });
});
