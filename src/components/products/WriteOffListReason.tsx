import { cn } from "@/lib/utils";
import { getWriteOffListReason, type WriteOffListReasonDisplay } from "@/utils/writeOffListReason";

/** Muted write-off/damage-list secondary. Renders nothing when BE omitted `reason`. */
export function WriteOffListReason({
    row,
    className,
}: {
    row: WriteOffListReasonDisplay;
    className?: string;
}) {
    const reason = getWriteOffListReason(row);
    if (!reason) return null;

    return (
        <div
            aria-label={`Reason ${reason}`}
            className={cn("text-xs text-muted-foreground font-normal truncate", className)}
        >
            {reason}
        </div>
    );
}
