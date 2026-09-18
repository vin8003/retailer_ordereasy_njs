import { cn } from "@/lib/utils";
import {
    getCustomerMappingNotes,
    type CustomerMappingNotesDisplay,
} from "@/utils/customerMappingNotes";

/** Muted mapping notes on customer details. Renders nothing when BE omitted `notes`. */
export function CustomerMappingNotes({
    customer,
    className,
}: {
    customer: CustomerMappingNotesDisplay;
    className?: string;
}) {
    const notes = getCustomerMappingNotes(customer);
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
