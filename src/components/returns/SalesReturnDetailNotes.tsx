import { cn } from "@/lib/utils";
import {
    getSalesReturnDetailNotes,
    type SalesReturnDetailNotesDisplay,
} from "@/utils/salesReturnDetailNotes";

/** Sales-return-detail notes block. Renders nothing when BE omitted or blanked `notes`. */
export function SalesReturnDetailNotes({
    salesReturn,
    className,
}: {
    salesReturn: SalesReturnDetailNotesDisplay;
    className?: string;
}) {
    const notes = getSalesReturnDetailNotes(salesReturn);
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
