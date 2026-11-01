import { EyeOff } from 'lucide-react';
import { cleanReason, isHeld, MODERATION_LABEL, retailerHint } from './moderationModel';

/** Full explanation on the product edit page when customers cannot see the product. */
export function ModerationNotice({
    product,
}: {
    product: { moderation_status?: string | null; moderation_reason?: string | null };
}) {
    const status = product.moderation_status;
    if (!isHeld(status)) return null;
    const reason = cleanReason(product.moderation_reason);
    const amber = status === 'pending_review';
    return (
        <div
            role="status"
            data-testid="moderation-notice"
            data-status={status}
            className={`flex gap-3 rounded-lg border p-4 text-sm ${amber
                ? 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200'
                : 'border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-300'}`}
        >
            <EyeOff className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="space-y-1">
                <div className="font-semibold">{MODERATION_LABEL[status]}</div>
                {reason && <div>Reason: {reason}</div>}
                <div className="opacity-90">{retailerHint(status, product.moderation_reason)}</div>
            </div>
        </div>
    );
}
