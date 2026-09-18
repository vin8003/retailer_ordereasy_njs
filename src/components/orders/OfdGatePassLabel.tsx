import { cn } from "@/lib/utils";
import {
    getOfdGatePassLabel,
    isOutForDeliveryRow,
    type OfdGatePassDisplay,
} from "@/utils/ofdGatePass";

/** Muted OFD list-row gate pass line. Renders nothing unless the row is OFD and BE sent `gate_pass`. */
export function OfdGatePassLabel({
    row,
    className,
}: {
    row: OfdGatePassDisplay;
    className?: string;
}) {
    if (!isOutForDeliveryRow(row)) return null;
    const label = getOfdGatePassLabel(row);
    if (!label) return null;

    return (
        <div
            aria-label={`Gate pass ${label}`}
            className={cn("text-[10px] text-muted-foreground font-normal truncate tracking-wide", className)}
        >
            Gate pass {label}
        </div>
    );
}
