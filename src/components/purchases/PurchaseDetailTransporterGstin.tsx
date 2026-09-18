import { cn } from "@/lib/utils";
import {
    getPurchaseDetailTransporterGstin,
    type PurchaseDetailTransporterGstinDisplay,
} from "@/utils/purchaseDetailTransporterGstin";

/** Purchase-detail transporter GSTIN. Renders nothing when BE omitted or blanked `transporter_gstin`. */
export function PurchaseDetailTransporterGstin({
    invoice,
    className,
}: {
    invoice: PurchaseDetailTransporterGstinDisplay;
    className?: string;
}) {
    const gstin = getPurchaseDetailTransporterGstin(invoice);
    if (!gstin) return null;

    return (
        <div className={cn("space-y-2", className)}>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Transporter GSTIN
            </div>
            <div
                aria-label={`Transporter GSTIN ${gstin}`}
                className="text-sm text-gray-700 font-medium font-mono tracking-wide"
            >
                {gstin}
            </div>
        </div>
    );
}
