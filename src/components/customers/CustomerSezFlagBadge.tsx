import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
    getCustomerSezFlagLabel,
    type CustomerDetailSezFlagDisplay,
} from "@/utils/customerDetailSezFlag";

/** Compact customer-detail badge. Renders nothing unless BE sent `sez_flag === true`. */
export function CustomerSezFlagBadge({
    customer,
    className,
}: {
    customer: CustomerDetailSezFlagDisplay;
    className?: string;
}) {
    const label = getCustomerSezFlagLabel(customer);
    if (!label) return null;

    return (
        <Badge
            variant="outline"
            aria-label="SEZ customer"
            className={cn(
                "text-[10px] px-1.5 py-0 h-4 font-medium text-muted-foreground border-border/60",
                className
            )}
        >
            {label}
        </Badge>
    );
}
