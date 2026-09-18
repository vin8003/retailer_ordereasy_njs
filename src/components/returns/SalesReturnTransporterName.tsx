import { Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    getSalesReturnTransporterName,
    type SalesReturnTransporterDisplay,
} from "@/utils/salesReturnTransporter";

/** Optional sales-return transporter. Renders nothing when BE omitted `transporter_name`. */
export function SalesReturnTransporterName({
    salesReturn,
    className,
}: {
    salesReturn: SalesReturnTransporterDisplay;
    className?: string;
}) {
    const name = getSalesReturnTransporterName(salesReturn);
    if (!name) return null;

    return (
        <div className={cn("space-y-2", className)}>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Transporter
            </div>
            <div
                aria-label={`Transporter ${name}`}
                className="flex items-center gap-2 text-sm text-gray-700 font-medium"
            >
                <Truck className="h-4 w-4 text-muted-foreground" />
                <span>{name}</span>
            </div>
        </div>
    );
}
