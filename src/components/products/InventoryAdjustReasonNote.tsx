"use client";

import Link from "next/link";
import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { orderDetailsHref, parseOrderNumberFromText } from "@/lib/orderLinks";
import {
    getInventoryAdjustReasonLabel,
    type InventoryAdjustHistoryDisplay,
} from "@/utils/inventoryAdjustHistory";

/** Inventory adjust/history reason. Renders nothing when BE omitted it (logs have no note field). */
export function InventoryAdjustReasonNote({
    row,
    className,
}: {
    row: InventoryAdjustHistoryDisplay;
    className?: string;
}) {
    const reason = getInventoryAdjustReasonLabel(row);
    if (!reason) return null;

    const orderNumber = parseOrderNumberFromText(reason);
    const href = orderNumber ? orderDetailsHref({ orderNumber }) : null;

    return (
        <div className={cn("flex items-center gap-2 font-bold text-gray-900", className)}>
            <FileText size={12} className="text-gray-400" />
            {href ? (
                <Link
                    href={href}
                    aria-label={`Reason ${reason}`}
                    className="text-primary hover:underline"
                    onClick={(e) => e.stopPropagation()}
                >
                    {reason}
                </Link>
            ) : (
                <span aria-label={`Reason ${reason}`}>{reason}</span>
            )}
        </div>
    );
}
