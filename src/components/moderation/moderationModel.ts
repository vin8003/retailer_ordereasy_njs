/** Product moderation and customer reports (backend products/moderation.py, retailers/reports.py). */

export type ModerationStatus = 'ok' | 'pending_review' | 'hidden' | 'removed';

/** Prefix the backend puts on holds set by the automatic text checks. */
export const AUTO_PREFIX = 'Auto: ';

export const MODERATION_LABEL: Record<Exclude<ModerationStatus, 'ok'>, string> = {
    pending_review: 'Under review',
    hidden: 'Hidden from customers',
    removed: 'Removed by admin',
};

export function isHeld(status: string | null | undefined): status is Exclude<ModerationStatus, 'ok'> {
    return status === 'pending_review' || status === 'hidden' || status === 'removed';
}

export function isAutoHold(reason: string | null | undefined): boolean {
    return (reason || '').startsWith(AUTO_PREFIX);
}

/** Reason without the internal "Auto: " prefix. */
export function cleanReason(reason: string | null | undefined): string {
    const r = (reason || '').trim();
    return isAutoHold(r) ? r.slice(AUTO_PREFIX.length) : r;
}

/** What the retailer can do about a held product. */
export function retailerHint(status: string | null | undefined, reason: string | null | undefined): string {
    if (!isHeld(status)) return '';
    if (status === 'removed') return 'An admin removed this product. Contact support if you think this is a mistake.';
    if (status === 'pending_review') return 'Our team will check it soon. Customers cannot see it until then. Your POS still works.';
    return isAutoHold(reason)
        ? 'Fix the name or description and save. It goes live again automatically. Your POS still works.'
        : 'An admin hid this product. Contact support if you think this is a mistake. Your POS still works.';
}

export type ReportReason = 'misleading' | 'offensive' | 'illegal' | 'wrong_price' | 'not_delivered' | 'other';

export const REPORT_REASON_LABEL: Record<ReportReason, string> = {
    misleading: 'Fake or misleading',
    offensive: 'Offensive content',
    illegal: 'Illegal or restricted item',
    wrong_price: 'Wrong price',
    not_delivered: 'Order never delivered',
    other: 'Other',
};

export type ReportAction = 'dismiss' | 'hide_product' | 'remove_product' | 'strike';

export const REPORT_ACTION_META: Record<ReportAction, { label: string; needsReason: boolean; productOnly: boolean; tone: 'neutral' | 'red' }> = {
    dismiss: { label: 'Dismiss', needsReason: false, productOnly: false, tone: 'neutral' },
    hide_product: { label: 'Hide product', needsReason: true, productOnly: true, tone: 'neutral' },
    remove_product: { label: 'Remove product', needsReason: true, productOnly: true, tone: 'red' },
    strike: { label: 'Strike shop', needsReason: true, productOnly: false, tone: 'red' },
};

/** Button text: a strike on a product report also removes that product. */
export function reportActionLabel(action: ReportAction, targetType: 'shop' | 'product'): string {
    if (action === 'strike' && targetType === 'product') return 'Remove + strike shop';
    return REPORT_ACTION_META[action].label;
}

/** Actions offered on one inbox group. Hide and remove need a product. */
export function reportActionsFor(targetType: 'shop' | 'product', status: 'open' | 'actioned' | 'dismissed' = 'open'): ReportAction[] {
    if (status !== 'open') return [];
    return (Object.keys(REPORT_ACTION_META) as ReportAction[]).filter(
        (a) => targetType === 'product' || !REPORT_ACTION_META[a].productOnly,
    );
}

export interface ReportGroup {
    target_type: 'shop' | 'product';
    retailer_id: number;
    shop_name: string;
    shop_status: string;
    strikes_in_90_days: number;
    product_id: number | null;
    product_name: string | null;
    product_image: string | null;
    product_moderation_status: ModerationStatus | null;
    reports: number;
    reporters: number;
    needs_review: boolean;
    latest: string;
    recent: { reason: string; text: string; created_at: string }[];
}

export interface ReviewProduct {
    id: number;
    name: string;
    description: string;
    image: string | null;
    category: string | null;
    price: string;
    retailer_id: number;
    shop_name: string;
    moderation_status: ModerationStatus;
    moderation_reason: string;
    moderated_at: string | null;
}

export type ProductModerateAction = 'approve' | 'hide' | 'remove';

/** Product queue actions: never offer the state the product is already in. */
export function productActionsFor(status: ModerationStatus): ProductModerateAction[] {
    const all: ProductModerateAction[] = ['approve', 'hide', 'remove'];
    const current: Record<ModerationStatus, ProductModerateAction | null> = {
        ok: 'approve',
        pending_review: null,
        hidden: 'hide',
        removed: 'remove',
    };
    return all.filter((a) => a !== current[status]);
}
