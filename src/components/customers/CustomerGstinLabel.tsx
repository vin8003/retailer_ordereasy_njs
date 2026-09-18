import { cn } from "@/lib/utils";
import {
    getCustomerGstin,
    type CustomerDetailGstinDisplay,
} from "@/utils/customerDetailGstin";

/** Muted GSTIN on customer details. Renders nothing when BE omitted `gstin`. */
export function CustomerGstinLabel({
    customer,
    className,
}: {
    customer: CustomerDetailGstinDisplay;
    className?: string;
}) {
    const gstin = getCustomerGstin(customer);
    if (!gstin) return null;

    return (
        <div
            aria-label={`GSTIN ${gstin}`}
            className={cn("text-sm text-muted-foreground font-normal truncate", className)}
        >
            GSTIN {gstin}
        </div>
    );
}
