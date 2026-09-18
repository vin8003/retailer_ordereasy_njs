import { cn } from "@/lib/utils";
import {
    getOfdDriverNameLabel,
    isOutForDeliveryRow,
    type OfdDriverNameDisplay,
} from "@/utils/ofdDriverName";

/** Muted OFD list-row driver line. Renders nothing unless the row is OFD and BE sent `driver_name`. */
export function OfdDriverNameLabel({
    row,
    className,
}: {
    row: OfdDriverNameDisplay;
    className?: string;
}) {
    if (!isOutForDeliveryRow(row)) return null;
    const label = getOfdDriverNameLabel(row);
    if (!label) return null;

    return (
        <div
            aria-label={`Driver ${label}`}
            className={cn("text-[10px] text-muted-foreground font-normal truncate tracking-wide", className)}
        >
            Driver {label}
        </div>
    );
}
