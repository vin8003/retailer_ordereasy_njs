import { cn } from "@/lib/utils";
import {
    getSalesReturnNotesSnippet,
    type SalesReturnListNotesDisplay,
} from "@/utils/salesReturnListNotes";

/** Muted sales-return-list notes preview. Renders nothing when BE omitted `notes`. */
export function SalesReturnListNotes({
    salesReturn,
    className,
}: {
    salesReturn: SalesReturnListNotesDisplay;
    className?: string;
}) {
    const notes = getSalesReturnNotesSnippet(salesReturn);
    if (!notes) return null;

    return (
        <div
            aria-label={`Notes ${notes}`}
            className={cn("text-xs text-muted-foreground font-normal truncate", className)}
        >
            {notes}
        </div>
    );
}
