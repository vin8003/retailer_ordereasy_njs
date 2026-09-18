import { cn } from "@/lib/utils";
import {
    getWriteOffDetailBatchNumber,
    type WriteOffDetailBatchNumberDisplay,
} from "@/utils/writeOffDetailBatchNumber";

/** Optional batch line on an existing write-off / ledger row. Renders nothing when BE omitted or blanked `batch_number`. */
export function WriteOffDetailBatchNumber({
    writeOff,
    className,
}: {
    writeOff: WriteOffDetailBatchNumberDisplay;
    className?: string;
}) {
    const batchNumber = getWriteOffDetailBatchNumber(writeOff);
    if (!batchNumber) return null;

    return (
        <div
            aria-label={`Batch ${batchNumber}`}
            className={cn("text-xs text-muted-foreground font-normal", className)}
        >
            Batch {batchNumber}
        </div>
    );
}
