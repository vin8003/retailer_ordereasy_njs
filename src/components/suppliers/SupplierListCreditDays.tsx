import { cn } from "@/lib/utils";
import {
    getSupplierCreditDaysLabel,
    type SupplierListCreditDaysDisplay,
} from "@/utils/supplierListCreditDays";

/** Muted supplier-list credit days. Renders nothing when BE omitted `credit_days`. */
export function SupplierListCreditDays({
    supplier,
    className,
}: {
    supplier: SupplierListCreditDaysDisplay;
    className?: string;
}) {
    const label = getSupplierCreditDaysLabel(supplier);
    if (!label) return null;

    return (
        <div
            aria-label={`Credit ${label}`}
            className={cn("text-[10px] text-muted-foreground font-normal truncate tracking-wide", className)}
        >
            {label}
        </div>
    );
}
