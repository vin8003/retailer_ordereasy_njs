/** Shapes and helpers for the retailer verification API (backend retailers/verification.py). */

export type CheckResult = 'pass' | 'fail' | 'flag' | 'manual';
export type VerificationStatus = 'pending' | 'needs_changes' | 'approved' | 'suspended' | 'rejected';

export interface VerificationCheck {
    key: string;
    label: string;
    result: CheckResult;
    detail: string;
}

export interface VerificationStep {
    key: 'phone' | 'shop' | 'address' | 'proof' | 'owner_id';
    label: string;
    done: boolean;
    detail: string;
}

export interface VerificationDocument {
    id: number;
    kind: 'proof' | 'owner_id' | 'selfie';
    uploaded_at: string;
}

export interface VerificationData {
    verification_status: VerificationStatus;
    is_verified?: boolean;
    reason: string;
    submitted_at: string | null;
    review_needed?: boolean;
    proof_type: '' | 'gst' | 'fssai' | 'licence' | 'board';
    proof_number: string;
    documents: VerificationDocument[];
    checks: VerificationCheck[];
    steps: VerificationStep[];
    counts: Record<CheckResult, number>;
    ready: boolean;
}

/** What the retailer should see right now. */
export type VerificationStage =
    | 'incomplete'
    | 'ready'
    | 'submitted'
    | 'needs_changes'
    | 'approved'
    | 'suspended'
    | 'rejected';

export function deriveStage(data: Pick<VerificationData, 'verification_status' | 'submitted_at' | 'ready'>): VerificationStage {
    switch (data.verification_status) {
        case 'approved':
        case 'needs_changes':
        case 'suspended':
        case 'rejected':
            return data.verification_status;
        default:
            if (data.submitted_at) return 'submitted';
            return data.ready ? 'ready' : 'incomplete';
    }
}

export function stepsDone(steps: VerificationStep[] | undefined): number {
    return (steps || []).filter((s) => s.done).length;
}

/** Where each step is edited. Phone, shop and address already live on the profile page. */
export const STEP_LINKS: Record<VerificationStep['key'], string | null> = {
    phone: '/dashboard/profile',
    shop: '/dashboard/profile',
    address: '/dashboard/profile',
    proof: null,
    owner_id: null,
};

export const STEP_HINDI: Record<VerificationStep['key'], string> = {
    phone: 'फ़ोन नंबर',
    shop: 'आपकी दुकान',
    address: 'पता और मैप पिन',
    proof: 'बिज़नेस प्रूफ',
    owner_id: 'मालिक का ID',
};

export const PROOF_OPTIONS: { value: 'gst' | 'fssai' | 'licence' | 'board'; label: string; hint: string }[] = [
    { value: 'gst', label: 'GST number', hint: '15 characters, e.g. 08AAAAA0000A1Z5' },
    { value: 'fssai', label: 'FSSAI licence', hint: '14-digit licence number and a photo' },
    { value: 'licence', label: 'Shop / trade licence', hint: 'Licence number and a photo' },
    { value: 'board', label: 'Shop board photo', hint: 'A clear photo of your shop board with the name' },
];

export const CHECK_LABEL: Record<CheckResult, string> = {
    pass: 'Pass',
    fail: 'Fail',
    flag: 'Flag',
    manual: 'You check',
};

export type AdminAction = 'approve' | 'request_changes' | 'reject' | 'suspend' | 'reinstate' | 'mark_reviewed';

export const ADMIN_ACTION_META: Record<AdminAction, { label: string; needsReason: boolean; tone: 'green' | 'red' | 'neutral' }> = {
    approve: { label: 'Approve', needsReason: false, tone: 'green' },
    reinstate: { label: 'Reinstate', needsReason: false, tone: 'green' },
    mark_reviewed: { label: 'Mark changes reviewed', needsReason: false, tone: 'neutral' },
    request_changes: { label: 'Ask for changes', needsReason: true, tone: 'neutral' },
    suspend: { label: 'Suspend', needsReason: true, tone: 'red' },
    reject: { label: 'Reject', needsReason: true, tone: 'red' },
};

/** Mirrors ADMIN_ACTIONS in the backend's retailers/verification.py. */
export function adminActionsFor(status: VerificationStatus, reviewNeeded = false): AdminAction[] {
    switch (status) {
        case 'pending':
            return ['approve', 'request_changes', 'reject'];
        case 'needs_changes':
            return ['approve', 'reject'];
        case 'approved':
            return [...(reviewNeeded ? (['mark_reviewed'] as AdminAction[]) : []), 'request_changes', 'suspend', 'reject'];
        case 'suspended':
            return ['reinstate', 'reject'];
        case 'rejected':
            return ['approve'];
        default:
            return [];
    }
}

export const STATUS_LABEL: Record<VerificationStatus, string> = {
    pending: 'Pending review',
    needs_changes: 'Needs changes',
    approved: 'Approved',
    suspended: 'Suspended',
    rejected: 'Rejected',
};
