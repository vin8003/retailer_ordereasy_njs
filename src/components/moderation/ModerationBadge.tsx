import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { cleanReason, isHeld, MODERATION_LABEL } from './moderationModel';

const TONE: Record<string, string> = {
    pending_review: 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200',
    hidden: 'border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-300',
    removed: 'border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-300',
};

/** Compact list badge for a product customers cannot see. Renders nothing for live products. */
export function ModerationBadge({
    product,
    className,
}: {
    product: { moderation_status?: string | null; moderation_reason?: string | null };
    className?: string;
}) {
    const status = product.moderation_status;
    if (!isHeld(status)) return null;
    const reason = cleanReason(product.moderation_reason);
    return (
        <div className={cn('flex flex-wrap gap-1', className)}>
            <Badge
                variant="outline"
                data-testid="moderation-badge"
                data-status={status}
                title={reason || MODERATION_LABEL[status]}
                className={cn('text-[10px] px-1.5 py-0 h-4 font-semibold', TONE[status])}
            >
                {MODERATION_LABEL[status]}
            </Badge>
        </div>
    );
}
