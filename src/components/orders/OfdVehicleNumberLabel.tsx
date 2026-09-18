import { cn } from "@/lib/utils";
import {
    getOfdVehicleNumberLabel,
    type OfdVehicleNumberDisplay,
} from "@/utils/ofdVehicleNumber";

/** Muted OFD vehicle line. Renders nothing when BE omitted `vehicle_number`. */
export function OfdVehicleNumberLabel({
    order,
    className,
}: {
    order: OfdVehicleNumberDisplay;
    className?: string;
}) {
    const label = getOfdVehicleNumberLabel(order);
    if (!label) return null;

    return (
        <div
            aria-label={`Vehicle ${label}`}
            className={cn("text-[10px] text-muted-foreground font-normal truncate tracking-wide", className)}
        >
            Vehicle {label}
        </div>
    );
}
