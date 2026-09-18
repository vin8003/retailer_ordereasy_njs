"use client";

import Link from "next/link";
import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { orderDetailsHref, parseOrderNumberFromText } from "@/lib/orderLinks";
import {
    getInventoryAdjustNoteLabel,
    getInventoryAdjustReasonLabel,
    type InventoryAdjustHistoryDisplay,
} from "@/utils/inventoryAdjustHistory";

/** Muted inventory adjust/history reason and note. Renders nothing when BE omitted both. */
export function InventoryAdjustReasonNote({
    row,
    className,
}: {
    row: InventoryAdjustHistoryDisplay;
    className?: string;
}) {
    const reason = getInventoryAdjustReasonLabel(row);
    const note = getInventoryAdjustNoteLabel(row);
    if (!reason && !note) return null;

    const orderNumber = reason ? parseOrderNumberFromText(reason) : null;
    const href = orderNumber ? orderDetailsHref({ orderNumber }) : null;

    return (
        <div className={cn("flex flex-col gap-1", className)}>
            {reason ? (
                <div className="flex items-center gap-2 font-bold text-gray-900">
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
            ) : null}
            {note ? (
                <div
                    aria-label={`Note ${note}`}
                    className="text-xs text-muted-foreground font-normal truncate"
                >
                    {note}
                </div>
            ) : null}
        </div>
    );
}
