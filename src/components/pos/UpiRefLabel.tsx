import type { CSSProperties } from "react";
import { getUpiRefLabel, type UpiRefDisplay } from "@/utils/upiRef";

/** Receipt UPI ref line. Renders nothing when BE omitted `upi_ref`. */
export function UpiRefLabel({
    payment,
    className,
    style,
}: {
    payment: UpiRefDisplay;
    className?: string;
    style?: CSSProperties;
}) {
    const label = getUpiRefLabel(payment);
    if (!label) return null;

    return (
        <div aria-label={`UPI ref ${label}`} className={className} style={style}>
            UPI REF: {label}
        </div>
    );
}
