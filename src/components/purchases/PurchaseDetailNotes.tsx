import { cn } from "@/lib/utils";
import { getPurchaseDetailNotes, type PurchaseDetailNotesDisplay } from "@/utils/purchaseDetailNotes";

/** Purchase-detail notes block. Renders nothing when BE omitted or blanked `notes`. */
export function PurchaseDetailNotes({
    invoice,
    className,
}: {
    invoice: PurchaseDetailNotesDisplay;
    className?: string;
}) {
    const notes = getPurchaseDetailNotes(invoice);
    if (!notes) return null;

    return (
        <div className={cn("space-y-2", className)}>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Notes</div>
            <div
                aria-label={`Notes ${notes}`}
                className="text-sm text-gray-700 font-medium whitespace-pre-wrap"
            >
                {notes}
            </div>
        </div>
    );
}
