import type { CSSProperties } from "react";
import { getChequeNumberLabel, type ChequeNumberDisplay } from "@/utils/chequeNumber";

/** Receipt cheque number line. Renders nothing when BE omitted `cheque_number`. */
export function ChequeNumberLabel({
    payment,
    className,
    style,
}: {
    payment: ChequeNumberDisplay;
    className?: string;
    style?: CSSProperties;
}) {
    const label = getChequeNumberLabel(payment);
    if (!label) return null;

    return (
        <div aria-label={`Cheque number ${label}`} className={className} style={style}>
            CHEQUE NO: {label}
        </div>
    );
}
