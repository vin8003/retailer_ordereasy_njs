import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SalesReturnListNotes } from "@/components/returns/SalesReturnListNotes";
import type { SalesReturnListNotesDisplay } from "@/utils/salesReturnListNotes";

export type SalesReturnListItem = SalesReturnListNotesDisplay & {
    id: number;
    refund_amount?: number | string | null;
    total_amount?: number | string | null;
    created_at?: string | null;
};

function refundLabel(item: SalesReturnListItem): string {
    const raw = item.refund_amount ?? item.total_amount;
    const amount = Number(raw ?? 0);
    return Number.isFinite(amount) ? amount.toLocaleString("en-IN") : "0";
}

function returnLabel(item: SalesReturnListItem): string {
    return item.return_number || `SRET-${item.id}`;
}

function createdLabel(item: SalesReturnListItem): string {
    if (!item.created_at) return "—";
    const date = new Date(item.created_at);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

/** Presentational sales-return list. Notes snippet is optional; blank stays hidden. */
export function SalesReturnList({
    returns,
    isLoading = false,
}: {
    returns: SalesReturnListItem[];
    isLoading?: boolean;
}) {
    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground">Loading sales returns...</div>;
    }

    if (returns.length === 0) {
        return <div className="p-8 text-center text-muted-foreground">No sales returns found.</div>;
    }

    return (
        <div className="space-y-4">
            <div className="hidden md:block rounded-md border">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                            <th className="p-4 pl-6 font-semibold">Return</th>
                            <th className="p-4 font-semibold">Date</th>
                            <th className="p-4 font-semibold">Customer</th>
                            <th className="p-4 text-right font-semibold">Refund</th>
                            <th className="p-4 pr-6 w-[50px]" />
                        </tr>
                    </thead>
                    <tbody>
                        {returns.map((item) => (
                            <tr key={item.id} className="border-b last:border-0 hover:bg-muted/40">
                                <td className="p-4 pl-6">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-gray-900">{returnLabel(item)}</span>
                                        {item.order_number ? (
                                            <span className="text-[10px] text-muted-foreground font-medium mt-0.5">
                                                Against {item.order_number}
                                            </span>
                                        ) : null}
                                        <SalesReturnListNotes salesReturn={item} className="mt-0.5" />
                                    </div>
                                </td>
                                <td className="p-4 text-sm text-gray-600">{createdLabel(item)}</td>
                                <td className="p-4 text-sm font-medium text-gray-800">
                                    {item.customer_name || "Customer"}
                                </td>
                                <td className="p-4 text-right font-bold text-red-600">
                                    ₹{refundLabel(item)}
                                </td>
                                <td className="p-4 pr-6 text-right">
                                    <Link
                                        href={`/dashboard/orders/return-detail?id=${item.id}`}
                                        className="inline-flex p-2 text-gray-400 hover:text-red-700 hover:bg-red-50 rounded-lg"
                                        aria-label={`View ${returnLabel(item)}`}
                                    >
                                        <ArrowRight size={18} />
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="block md:hidden space-y-3">
                {returns.map((item) => (
                    <Link
                        key={item.id}
                        href={`/dashboard/orders/return-detail?id=${item.id}`}
                        className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex flex-col gap-2"
                    >
                        <div className="flex justify-between items-start gap-3">
                            <div className="flex flex-col min-w-0">
                                <span className="font-bold text-gray-800 text-[15px]">{returnLabel(item)}</span>
                                {item.order_number ? (
                                    <span className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                                        Against {item.order_number}
                                    </span>
                                ) : null}
                                <SalesReturnListNotes salesReturn={item} className="text-[10px] mt-0.5" />
                            </div>
                            <span className="font-extrabold text-red-600 shrink-0">₹{refundLabel(item)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 font-medium">
                            <span>{item.customer_name || "Customer"}</span>
                            <span>{createdLabel(item)}</span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
