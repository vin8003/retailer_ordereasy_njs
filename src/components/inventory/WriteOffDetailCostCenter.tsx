import { cn } from "@/lib/utils";
import {
    getWriteOffDetailCostCenter,
    type WriteOffDetailCostCenterDisplay,
} from "@/utils/writeOffDetailCostCenter";

/** Write-off-detail cost center line. Renders nothing when BE omitted or blanked `cost_center`. */
export function WriteOffDetailCostCenter({
    writeOff,
    className,
}: {
    writeOff: WriteOffDetailCostCenterDisplay;
    className?: string;
}) {
    const costCenter = getWriteOffDetailCostCenter(writeOff);
    if (!costCenter) return null;

    return (
        <div
            aria-label={`Cost center ${costCenter}`}
            className={cn("text-xs text-muted-foreground font-normal", className)}
        >
            Cost center {costCenter}
        </div>
    );
}
