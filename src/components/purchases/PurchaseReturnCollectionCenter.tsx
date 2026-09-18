import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    getPurchaseReturnCollectionCenter,
    type PurchaseReturnCollectionCenterDisplay,
} from "@/utils/purchaseReturnCollectionCenter";

/** Purchase-return-detail collection center. Renders nothing when BE omitted `collection_center`. */
export function PurchaseReturnCollectionCenter({
    returnRecord,
    className,
}: {
    returnRecord: PurchaseReturnCollectionCenterDisplay;
    className?: string;
}) {
    const label = getPurchaseReturnCollectionCenter(returnRecord);
    if (!label) return null;

    return (
        <div className={cn("space-y-2", className)}>
            <div className="text-xs font-bold text-red-400 uppercase tracking-widest flex items-center gap-2">
                <MapPin size={14} /> Collection Center
            </div>
            <div
                aria-label={`Collection center ${label}`}
                className="text-lg font-bold text-red-900"
            >
                {label}
            </div>
        </div>
    );
}
