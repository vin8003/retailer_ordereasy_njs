import { cn } from "@/lib/utils";
import {
    getOfdSignedByLabel,
    isOfdCloseDisplay,
    type OfdSignedByDisplay,
} from "@/utils/ofdSignedBy";

/** Muted OFD-close signer line. Renders nothing unless close display and BE sent `signed_by`. */
export function OfdSignedByLabel({
    order,
    className,
}: {
    order: OfdSignedByDisplay;
    className?: string;
}) {
    if (!isOfdCloseDisplay(order.status, order.delivery_mode)) return null;
    const label = getOfdSignedByLabel(order);
    if (!label) return null;

    return (
        <div
            aria-label={`Signed by ${label}`}
            className={cn("text-sm text-muted-foreground font-normal truncate", className)}
        >
            Signed by {label}
        </div>
    );
}
