import { cn } from "@/lib/utils";
import { getOrderDetailNotes, type OrderDetailNotesDisplay } from "@/utils/orderDetailNotes";

/** Muted retailer order-detail notes. Renders nothing when BE omitted `notes`. */
export function OrderDetailNotes({
    order,
    className,
}: {
    order: OrderDetailNotesDisplay;
    className?: string;
}) {
    const notes = getOrderDetailNotes(order);
    if (!notes) return null;

    return (
        <div
            aria-label={`Notes ${notes}`}
            className={cn("text-sm text-muted-foreground font-normal whitespace-pre-wrap", className)}
        >
            {notes}
        </div>
    );
}
