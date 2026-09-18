import { cn } from "@/lib/utils";
import {
    getCustomerTerritoryLabel,
    type CustomerTerritoryDisplay,
} from "@/utils/customerTerritory";

/** Muted territory on customer details. Renders nothing when BE omitted `territory`. */
export function CustomerTerritoryLabel({
    customer,
    className,
}: {
    customer: CustomerTerritoryDisplay;
    className?: string;
}) {
    const label = getCustomerTerritoryLabel(customer);
    if (!label) return null;

    return (
        <div
            aria-label={`Territory ${label}`}
            className={cn("text-sm text-muted-foreground font-normal truncate", className)}
        >
            {label}
        </div>
    );
}
