import { cn } from "@/lib/utils";
import {
    getOfdDistanceKmLabel,
    isOutForDeliveryRow,
    type OfdDistanceKmDisplay,
} from "@/utils/ofdDistanceKm";

/** Muted OFD list-row distance line. Renders nothing unless the row is OFD and BE sent `distance_km`. */
export function OfdDistanceKmLabel({
    row,
    className,
}: {
    row: OfdDistanceKmDisplay;
    className?: string;
}) {
    if (!isOutForDeliveryRow(row)) return null;
    const label = getOfdDistanceKmLabel(row);
    if (!label) return null;

    return (
        <div
            aria-label={`Distance ${label}`}
            className={cn("text-[10px] text-muted-foreground font-normal truncate tracking-wide", className)}
        >
            {label}
        </div>
    );
}
