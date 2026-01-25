import type { Timestamp } from 'firebase/firestore';

export interface CRMIssue {
    id: string;
    kind: 'issue' | 'note' | 'auto_log';
    status: 'open' | 'resolved';
    severity: 'low' | 'medium' | 'high';
    code?: string; // e.g. BUG_REPORT, PAYMENT_FAIL
    title: string; // max 80 chars
    detail?: string; // max 280 chars, NO PII, NO Health Data
    createdAt: Timestamp;
    createdBy: 'system' | 'admin';
    expiresAt?: Timestamp; // For TTL on auto_logs

    // Reference to source data (Actionable Link)
    source?: {
        type: 'feedback' | 'crash' | 'timeline';
        refId: string; // docId of the actual content
    };
}

export interface CRMStats {
    openIssuesCount: number;
    lastIssueAt?: Timestamp;
    lastAdminNoteAt?: Timestamp;
}

export interface CRMMeta {
    acquisitionSource?: 'Organic' | 'Instagram' | 'Referral' | 'Other';
    acquisitionCampaign?: string; // Short code only (e.g. IG_REEL_07), no full URLs
    joinedAt?: Timestamp;
}
