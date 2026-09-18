import { cn } from "@/lib/utils";
import {
    getKhataDetailReferenceNo,
    type KhataDetailReferenceDisplay,
} from "@/utils/khataDetailReference";

/** Muted khata-detail reference line. Renders nothing when BE omitted `reference_no`. */
export function KhataDetailReferenceNo({
    entry,
    className,
}: {
    entry: KhataDetailReferenceDisplay;
    className?: string;
}) {
    const label = getKhataDetailReferenceNo(entry);
    if (!label) return null;

    return (
        <div
            aria-label={`Reference ${label}`}
            className={cn("text-[10px] text-muted-foreground font-normal truncate tracking-wide", className)}
        >
            Ref {label}
        </div>
    );
}
