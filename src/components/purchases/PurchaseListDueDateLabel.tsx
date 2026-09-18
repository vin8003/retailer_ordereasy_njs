import { cn } from "@/lib/utils";
import {
    getPurchaseListDueDateLabel,
    type PurchaseListDueDateDisplay,
} from "@/utils/purchaseListDueDate";

/** Muted purchase-list due date. Renders nothing unless the row is unpaid and BE sent `due_date`. */
export function PurchaseListDueDateLabel({
    row,
    className,
}: {
    row: PurchaseListDueDateDisplay;
    className?: string;
}) {
    const label = getPurchaseListDueDateLabel(row);
    if (!label) return null;

    return (
        <div
            aria-label={`Due ${label}`}
            className={cn("text-[10px] text-muted-foreground font-normal truncate tracking-wide", className)}
        >
            Due {label}
        </div>
    );
}
