import { WriteOffListReason } from "./WriteOffListReason";
import type { WriteOffListItem } from "@/utils/writeOffListReason";

export type { WriteOffListItem };

function rowTitle(item: WriteOffListItem): string {
    const name = item.product_name?.trim();
    return name ? name : `Write-off #${item.id}`;
}

/** Write-off / damage list rows. Optional reason is muted; blank/null is omitted. */
export function WriteOffList({ items }: { items: WriteOffListItem[] }) {
    if (items.length === 0) {
        return <p className="text-sm text-muted-foreground">No write-offs.</p>;
    }

    return (
        <>
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="text-[10px] uppercase tracking-widest text-gray-400 font-black border-b border-gray-50">
                            <th className="p-4 pl-6">Product</th>
                            <th className="p-4">Qty</th>
                            <th className="p-4">Type</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {items.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="p-4 pl-6 font-bold text-gray-900">
                                    <div className="flex flex-col">
                                        <span>{rowTitle(item)}</span>
                                        <WriteOffListReason row={item} className="mt-0.5 font-normal" />
                                    </div>
                                </td>
                                <td className="p-4 text-gray-600">{item.quantity_change ?? ""}</td>
                                <td className="p-4 text-gray-600">{item.log_type ?? ""}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="md:hidden divide-y divide-gray-50">
                {items.map((item) => (
                    <div key={item.id} className="p-4 flex flex-col">
                        <span className="font-bold text-gray-900">{rowTitle(item)}</span>
                        <WriteOffListReason
                            row={item}
                            className="text-[10px] mt-0.5 font-normal normal-case tracking-normal"
                        />
                        <span className="text-[10px] text-gray-400 font-bold mt-1 uppercase">
                            {[item.quantity_change, item.log_type].filter(Boolean).join(" · ")}
                        </span>
                    </div>
                ))}
            </div>
        </>
    );
}
