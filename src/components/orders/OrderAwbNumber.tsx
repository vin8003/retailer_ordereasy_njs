import { Barcode } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    getOrderAwbNumberLabel,
    type OrderAwbNumberDisplay,
} from "@/utils/orderAwbNumber";

/** Order-detail OFD AWB. Renders nothing when BE omitted `awb_number`. */
export function OrderAwbNumber({
    order,
    className,
}: {
    order: OrderAwbNumberDisplay;
    className?: string;
}) {
    const awbNumber = getOrderAwbNumberLabel(order);
    if (!awbNumber) return null;

    return (
        <div
            aria-label={`AWB ${awbNumber}`}
            className={cn("flex items-center gap-2 text-sm", className)}
        >
            <Barcode className="h-4 w-4 text-muted-foreground" />
            <span>{awbNumber}</span>
        </div>
    );
}
