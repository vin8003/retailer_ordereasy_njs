import { MinusCircle, PlusCircle, User } from "lucide-react";
import { InventoryLedgerBatchLabel } from "@/components/products/InventoryLedgerBatchLabel";
import { InventoryAdjustReasonNote } from "@/components/products/InventoryAdjustReasonNote";
import { WriteOffDetailBatchNumber } from "@/components/inventory/WriteOffDetailBatchNumber";

export type InventoryLedgerLog = {
    id: number;
    log_type: string;
    quantity_change: number;
    previous_quantity: number;
    new_quantity: number;
    reason?: string | null;
    note?: string | null;
    batch_number?: string | null;
    created_at: string;
    created_by: string;
    batch_id?: number | string | null;
};

function ledgerTypeClass(logType: string) {
    if (logType === "added") return "text-green-600 bg-green-50";
    if (logType === "sold") return "text-blue-600 bg-blue-50";
    if (logType === "removed") return "text-red-600 bg-red-50";
    return "text-gray-600 bg-gray-50";
}

/** Desktop table + mobile cards for inventory ledger rows. */
export function InventoryLedgerHistory({ logs }: { logs: InventoryLedgerLog[] }) {
    return (
        <>
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="text-[10px] uppercase tracking-widest text-gray-400 font-black border-b border-gray-50">
                            <th className="p-6">Date & Time</th>
                            <th className="p-6">Type</th>
                            <th className="p-6">Movement</th>
                            <th className="p-6">Balance</th>
                            <th className="p-6">Reason / By</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 uppercase text-[11px]">
                        {logs.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-20 text-center text-gray-400 italic">
                                    No history recorded for this product.
                                </td>
                            </tr>
                        ) : (
                            logs.map((log) => {
                                const isPositive = log.quantity_change > 0;
                                return (
                                    <tr key={log.id} className="hover:bg-gray-50/30 transition-colors">
                                        <td className="p-6">
                                            <div className="font-bold text-gray-900 whitespace-nowrap">
                                                {new Date(log.created_at).toLocaleString("en-IN", {
                                                    dateStyle: "medium",
                                                    timeStyle: "short",
                                                })}
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex flex-col gap-1">
                                                <span
                                                    className={`px-2 py-1 rounded-md font-black tracking-widest text-[9px] w-fit ${ledgerTypeClass(log.log_type)}`}
                                                >
                                                    {log.log_type}
                                                </span>
                                                <InventoryLedgerBatchLabel row={log} />
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div
                                                className={`flex items-center gap-2 text-base font-black ${isPositive ? "text-green-600" : "text-red-500"}`}
                                            >
                                                {isPositive ? <PlusCircle size={14} /> : <MinusCircle size={14} />}
                                                {Math.abs(log.quantity_change)}
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex flex-col">
                                                <span className="text-[8px] text-gray-400 font-bold">New Balance</span>
                                                <span className="text-sm font-black text-gray-900">{log.new_quantity}</span>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex flex-col gap-1">
                                                <InventoryAdjustReasonNote row={log} />
                                                <div className="flex items-center gap-2 font-bold text-gray-400 italic">
                                                    <User size={10} /> {log.created_by}
                                                </div>
                                                <WriteOffDetailBatchNumber writeOff={log} />
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            <div className="block md:hidden divide-y divide-gray-100">
                {logs.length === 0 ? (
                    <div className="p-12 text-center text-gray-400 italic">
                        No history recorded for this product.
                    </div>
                ) : (
                    logs.map((log) => {
                        const isPositive = log.quantity_change > 0;
                        return (
                            <div key={log.id} className="p-4 flex flex-col gap-3">
                                <div className="flex justify-between items-start gap-3">
                                    <div className="flex flex-col gap-1 min-w-0">
                                        <div className="font-bold text-gray-900 text-xs">
                                            {new Date(log.created_at).toLocaleString("en-IN", {
                                                dateStyle: "medium",
                                                timeStyle: "short",
                                            })}
                                        </div>
                                        <span
                                            className={`px-2 py-1 rounded-md font-black tracking-widest text-[9px] uppercase w-fit ${ledgerTypeClass(log.log_type)}`}
                                        >
                                            {log.log_type}
                                        </span>
                                        <InventoryLedgerBatchLabel row={log} />
                                    </div>
                                    <div
                                        className={`flex items-center gap-1 text-base font-black ${isPositive ? "text-green-600" : "text-red-500"}`}
                                    >
                                        {isPositive ? <PlusCircle size={14} /> : <MinusCircle size={14} />}
                                        {Math.abs(log.quantity_change)}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between text-[11px]">
                                    <span className="text-[8px] text-gray-400 font-bold uppercase">New Balance</span>
                                    <span className="text-sm font-black text-gray-900">{log.new_quantity}</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <InventoryAdjustReasonNote row={log} />
                                    <div className="flex items-center gap-2 font-bold text-gray-400 italic text-[11px]">
                                        <User size={10} /> {log.created_by}
                                    </div>
                                                <WriteOffDetailBatchNumber writeOff={log} />
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </>
    );
}
