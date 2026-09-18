import { cn } from "@/lib/utils";
import {
    getCustomerAreaNameLabel,
    type CustomerListAreaDisplay,
} from "@/utils/customerListAreaName";

/** Muted customer-list area line. Renders nothing when BE omitted `area_name`. */
export function CustomerListAreaName({
    customer,
    className,
}: {
    customer: CustomerListAreaDisplay;
    className?: string;
}) {
    const label = getCustomerAreaNameLabel(customer);
    if (!label) return null;

    return (
        <div
            aria-label={`Area ${label}`}
            className={cn("text-xs text-muted-foreground font-normal truncate", className)}
        >
            {label}
        </div>
    );
}
