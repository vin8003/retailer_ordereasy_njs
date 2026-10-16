import { cn } from "@/lib/utils";
import { getKhataLedgerNotes, type KhataLedgerListRow } from "@/utils/khataLedgerNotes";

/** Muted khata-list secondary under the row title. Renders nothing when BE omitted `notes`. */
export function KhataLedgerNotes({
    entry,
    className,
}: {
    entry: KhataLedgerListRow;
    className?: string;
}) {
    const notes = getKhataLedgerNotes(entry);
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
