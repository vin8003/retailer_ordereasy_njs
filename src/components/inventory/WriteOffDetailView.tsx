import { WriteOffDetailCostCenter } from "@/components/inventory/WriteOffDetailCostCenter";
import type { WriteOffDetailCostCenterDisplay } from "@/utils/writeOffDetailCostCenter";

export type WriteOffDetailViewModel = WriteOffDetailCostCenterDisplay & {
    id?: number;
    product_id?: number;
    quantity_change?: number | string | null;
    previous_quantity?: number | string | null;
    new_quantity?: number | string | null;
    log_type?: string | null;
    created_at?: string | null;
};

function optionalText(raw: string | number | null | undefined): string | null {
    if (raw === undefined || raw === null) return null;
    const text = String(raw).trim();
    return text === "" ? null : text;
}

/** Thin write-off detail chrome. Optional cost_center only — no invent from aliases. */
export function WriteOffDetailView({ writeOff }: { writeOff: WriteOffDetailViewModel }) {
    const productName = optionalText(writeOff.product_name);
    const quantityChange = optionalText(writeOff.quantity_change);
    const createdAt = optionalText(writeOff.created_at);

    return (
        <div className="space-y-4">
            {productName ? (
                <div className="text-lg font-bold text-gray-900">{productName}</div>
            ) : null}
            {quantityChange ? (
                <div className="text-sm font-medium text-gray-600">Qty {quantityChange}</div>
            ) : null}
            {createdAt ? (
                <div className="text-xs text-gray-400">
                    {new Date(createdAt).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                    })}
                </div>
            ) : null}
            <WriteOffDetailCostCenter writeOff={writeOff} />
        </div>
    );
}
