import { WriteOffDetailCreatedByName } from "./WriteOffDetailCreatedByName";
import type { WriteOffDetailItem } from "@/utils/writeOffDetailCreatedBy";

export type { WriteOffDetailItem };

function detailTitle(detail: WriteOffDetailItem): string {
    const name = detail.product_name?.trim();
    return name ? name : `Write-off #${detail.id}`;
}

/** Write-off / damage detail. Optional created_by_name is shown only when BE sent it. */
export function WriteOffDetail({ detail }: { detail: WriteOffDetailItem }) {
    const qty = detail.quantity_change ?? "";
    const logType = detail.log_type?.trim() || "";

    return (
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8 space-y-6">
            <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">{detailTitle(detail)}</h2>
                {(qty !== "" || logType) && (
                    <p className="text-sm text-muted-foreground mt-1">
                        {[qty !== "" ? String(qty) : null, logType || null].filter(Boolean).join(" · ")}
                    </p>
                )}
            </div>
            <WriteOffDetailCreatedByName detail={detail} />
        </div>
    );
}
