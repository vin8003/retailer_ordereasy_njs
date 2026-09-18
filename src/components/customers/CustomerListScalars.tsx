import { cn } from "@/lib/utils";
import {
    getCreditDueDaysLabel,
    getCreditLimitLabel,
    getCustomerEmailLabel,
    type CustomerListScalarDisplay,
} from "@/utils/customerListScalars";

/** Muted customer-list secondary under name/phone. Renders nothing when BE omitted the scalars. */
export function CustomerListScalars({
    customer,
    className,
}: {
    customer: CustomerListScalarDisplay;
    className?: string;
}) {
    const email = getCustomerEmailLabel(customer);
    const creditLimit = getCreditLimitLabel(customer);
    const dueDays = getCreditDueDaysLabel(customer);
    if (!email && !creditLimit && !dueDays) return null;

    const creditBits = [
        creditLimit ? `Limit ${creditLimit}` : null,
        dueDays,
    ].filter((part): part is string => Boolean(part));

    return (
        <div className={cn("flex flex-col text-xs text-muted-foreground font-normal", className)}>
            {email ? (
                <div aria-label={`Email ${email}`} className="truncate">
                    {email}
                </div>
            ) : null}
            {creditBits.length > 0 ? (
                <div aria-label={`Credit ${creditBits.join(" • ")}`} className="truncate">
                    {creditBits.join(" • ")}
                </div>
            ) : null}
        </div>
    );
}
