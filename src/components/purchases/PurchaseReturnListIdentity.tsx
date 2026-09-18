import { cn } from "@/lib/utils";
import { PurchaseReturnLrNumber } from "@/components/purchases/PurchaseReturnLrNumber";
import type { PurchaseReturnLrDisplay } from "@/utils/purchaseReturnLrNumber";

export type PurchaseReturnListItem = PurchaseReturnLrDisplay & {
    id: number;
    return_number?: string | null;
    invoice_number?: string | null;
};

/** Return-number cell for purchase-return list rows (desktop + mobile). */
export function PurchaseReturnListIdentity({
    item,
    className,
}: {
    item: PurchaseReturnListItem;
    className?: string;
}) {
    return (
        <div className={cn("flex flex-col", className)}>
            <span>{item.return_number || `RET-${item.id}`}</span>
            <span className="text-[10px] text-red-400 font-medium mt-0.5">
                Against {item.invoice_number}
            </span>
            <PurchaseReturnLrNumber row={item} className="mt-0.5 font-normal" />
        </div>
    );
}
