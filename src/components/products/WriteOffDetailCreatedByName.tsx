import { cn } from "@/lib/utils";
import {
    getWriteOffDetailCreatedByName,
    type WriteOffDetailCreatedByDisplay,
} from "@/utils/writeOffDetailCreatedBy";

/** Write-off detail created-by block. Renders nothing when BE omitted `created_by_name`. */
export function WriteOffDetailCreatedByName({
    detail,
    className,
}: {
    detail: WriteOffDetailCreatedByDisplay;
    className?: string;
}) {
    const name = getWriteOffDetailCreatedByName(detail);
    if (!name) return null;

    return (
        <div className={cn("space-y-2", className)}>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Created by
            </div>
            <div
                aria-label={`Created by ${name}`}
                className="text-sm text-gray-700 font-medium truncate"
            >
                {name}
            </div>
        </div>
    );
}
