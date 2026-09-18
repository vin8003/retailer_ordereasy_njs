import { cn } from "@/lib/utils";
import {
    getOfdVehicleTypeLabel,
    isOfdDetailStatus,
    type OfdVehicleTypeDisplay,
} from "@/utils/ofdVehicleType";

/** Muted OFD-detail vehicle line. Renders nothing unless status is OFD and BE sent `vehicle_type`. */
export function OfdVehicleTypeLabel({
    order,
    className,
}: {
    order: OfdVehicleTypeDisplay;
    className?: string;
}) {
    if (!isOfdDetailStatus(order.status)) return null;
    const label = getOfdVehicleTypeLabel(order);
    if (!label) return null;

    return (
        <div
            aria-label={`Vehicle ${label}`}
            className={cn("text-sm text-muted-foreground font-normal truncate", className)}
        >
            Vehicle {label}
        </div>
    );
}
