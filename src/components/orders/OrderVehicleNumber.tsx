import { Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    getOrderVehicleNumberLabel,
    type OrderVehicleNumberDisplay,
} from "@/utils/orderVehicleNumber";

/** Order-detail OFD vehicle. Renders nothing when BE omitted `vehicle_number`. */
export function OrderVehicleNumber({
    order,
    className,
}: {
    order: OrderVehicleNumberDisplay;
    className?: string;
}) {
    const vehicleNumber = getOrderVehicleNumberLabel(order);
    if (!vehicleNumber) return null;

    return (
        <div
            aria-label={`Vehicle ${vehicleNumber}`}
            className={cn("flex items-center gap-2 text-sm", className)}
        >
            <Truck className="h-4 w-4 text-muted-foreground" />
            <span>{vehicleNumber}</span>
        </div>
    );
}
