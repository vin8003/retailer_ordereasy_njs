import { cn } from "@/lib/utils";
import {
    getOfdSealNumberLabel,
    type OfdSealNumberDisplay,
} from "@/utils/ofdSealNumber";

/** Order-detail OFD seal. Renders nothing when BE omitted `seal_number`. */
export function OfdSealNumber({
    order,
    className,
}: {
    order: OfdSealNumberDisplay;
    className?: string;
}) {
    const sealNumber = getOfdSealNumberLabel(order);
    if (!sealNumber) return null;

    return (
        <div
            aria-label={`Seal ${sealNumber}`}
            className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}
        >
            <span>Seal {sealNumber}</span>
        </div>
    );
}
