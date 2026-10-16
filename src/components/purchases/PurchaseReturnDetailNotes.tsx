import { cn } from "@/lib/utils";
import {
    getPurchaseReturnDetailNotes,
    type PurchaseReturnDetailNotesDisplay,
} from "@/utils/purchaseReturnDetailNotes";

/** Purchase-return detail notes block. Renders nothing when BE omitted or blanked `notes`. */
export function PurchaseReturnDetailNotes({
    purchaseReturn,
    className,
}: {
    purchaseReturn: PurchaseReturnDetailNotesDisplay;
    className?: string;
}) {
    const notes = getPurchaseReturnDetailNotes(purchaseReturn);
    if (!notes) return null;

    return (
        <div className={cn("space-y-3", className)}>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">
                Notes
            </label>
            <div
                aria-label={`Notes ${notes}`}
                className="bg-gray-50 rounded-2xl py-4 px-5 text-gray-700 text-sm italic border border-gray-100 whitespace-pre-wrap"
            >
                {notes}
            </div>
        </div>
    );
}
