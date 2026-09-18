import { cn } from "@/lib/utils";
import {
    getWriteOffDetailInspectorName,
    type WriteOffDetailInspectorNameDisplay,
} from "@/utils/writeOffDetailInspectorName";

/** Write-off-detail inspector line. Renders nothing when BE omitted or blanked `inspector_name`. */
export function WriteOffDetailInspectorName({
    writeOff,
    className,
}: {
    writeOff: WriteOffDetailInspectorNameDisplay;
    className?: string;
}) {
    const inspectorName = getWriteOffDetailInspectorName(writeOff);
    if (!inspectorName) return null;

    return (
        <div
            aria-label={`Inspector ${inspectorName}`}
            className={cn("text-xs text-muted-foreground font-normal", className)}
        >
            Inspector {inspectorName}
        </div>
    );
}
