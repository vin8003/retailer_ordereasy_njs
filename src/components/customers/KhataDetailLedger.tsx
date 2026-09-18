import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { orderDetailsHref } from "@/lib/orderLinks";
import { KhataDetailReferenceNo } from "@/components/customers/KhataDetailReferenceNo";
import { type KhataDetailReferenceDisplay } from "@/utils/khataDetailReference";

export type KhataDetailLedgerEntry = KhataDetailReferenceDisplay & {
    order?: number | string | null;
    created_at?: string | null;
    balance_after?: number | string | null;
};

function formatCurrency(amount: number | string | null | undefined) {
    const value = Number(amount);
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(Number.isFinite(value) ? value : 0);
}

function formatLedgerDate(createdAt: string | null | undefined) {
    return new Date(createdAt || "").toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function EntryTitle({ entry }: { entry: KhataDetailLedgerEntry }) {
    if (entry.order_number) {
        return (
            <Link
                href={orderDetailsHref({ id: entry.order, orderNumber: entry.order_number }) || "#"}
                className="text-primary font-semibold hover:underline"
            >
                {`Order #${entry.order_number}`}
            </Link>
        );
    }
    return <>{entry.notes}</>;
}

/** Desktop table + mobile cards for customer khata detail (not OE-333 list notes). */
export function KhataDetailLedger({ entries }: { entries: KhataDetailLedgerEntry[] }) {
    return (
        <>
            <div className="hidden md:block border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50">
                            <TableHead>Date</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Details</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead className="text-right">Balance</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {entries.map((entry) => (
                            <TableRow key={entry.id}>
                                <TableCell className="text-xs">
                                    {formatLedgerDate(entry.created_at)}
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant={entry.transaction_type === "PAYMENT" ? "secondary" : "outline"}
                                        className={entry.transaction_type === "PAYMENT" ? "bg-green-100 text-green-700" : ""}
                                    >
                                        {entry.transaction_type}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="text-sm">
                                        <EntryTitle entry={entry} />
                                    </div>
                                    {entry.payment_mode && (
                                        <div className="text-[10px] text-muted-foreground uppercase">
                                            Mode: {entry.payment_mode}
                                        </div>
                                    )}
                                    <KhataDetailReferenceNo entry={entry} className="mt-0.5" />
                                </TableCell>
                                <TableCell className={`text-right font-medium ${entry.transaction_type === "PAYMENT" ? "text-green-600" : "text-red-600"}`}>
                                    {entry.transaction_type === "PAYMENT" ? "-" : "+"}
                                    {formatCurrency(entry.amount)}
                                </TableCell>
                                <TableCell className="text-right font-bold">
                                    {formatCurrency(entry.balance_after)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <div className="block md:hidden space-y-3">
                {entries.map((entry) => (
                    <div
                        key={entry.id}
                        className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm flex flex-col gap-2.5"
                    >
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Badge
                                    variant={entry.transaction_type === "PAYMENT" ? "secondary" : "outline"}
                                    className={`text-[9px] font-black uppercase tracking-wider border-none h-4 px-1.5 py-0 ${entry.transaction_type === "PAYMENT" ? "bg-green-50 text-green-700" : ""}`}
                                >
                                    {entry.transaction_type}
                                </Badge>
                                <span className="text-[10px] text-muted-foreground font-semibold">
                                    {formatLedgerDate(entry.created_at)}
                                </span>
                            </div>
                            <span className={`text-sm font-extrabold ${entry.transaction_type === "PAYMENT" ? "text-green-600" : "text-red-600"}`}>
                                {entry.transaction_type === "PAYMENT" ? "-" : "+"}
                                {formatCurrency(entry.amount)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center text-xs pt-1.5 border-t border-slate-50">
                            <div className="flex flex-col gap-0.5 min-w-0">
                                <span className="font-bold text-gray-700 truncate">
                                    {entry.order_number ? (
                                        <Link
                                            href={orderDetailsHref({ id: entry.order, orderNumber: entry.order_number }) || "#"}
                                            className="text-primary hover:underline"
                                        >
                                            {`Order #${entry.order_number}`}
                                        </Link>
                                    ) : (
                                        entry.notes || "No description"
                                    )}
                                </span>
                                {entry.payment_mode && (
                                    <span className="text-[9px] text-muted-foreground uppercase font-semibold">
                                        Mode: {entry.payment_mode}
                                    </span>
                                )}
                                <KhataDetailReferenceNo
                                    entry={entry}
                                    className="text-[10px] font-normal normal-case tracking-normal"
                                />
                            </div>
                            <div className="flex flex-col items-end shrink-0">
                                <span className="text-[9px] text-muted-foreground uppercase font-bold">Balance</span>
                                <span className="font-extrabold text-gray-900">{formatCurrency(entry.balance_after)}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}
