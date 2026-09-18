import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getPriorityFlagLabel, type PriorityFlagDisplay } from "@/utils/priorityFlag";

/** Compact order-list badge. Renders nothing unless BE sent `priority_flag === true`. */
export function PriorityFlagBadge({
    order,
    className,
}: {
    order: PriorityFlagDisplay;
    className?: string;
}) {
    const label = getPriorityFlagLabel(order);
    if (!label) return null;

    return (
        <Badge
            variant="outline"
            aria-label="Priority order"
            className={cn(
                "text-[10px] px-1.5 py-0 h-4 font-medium text-muted-foreground border-border/60",
                className
            )}
        >
            {label}
        </Badge>
    );
}
