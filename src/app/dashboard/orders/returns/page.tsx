'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeftRight, ChevronLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/services/api';
import { SalesReturnListNotes } from '@/components/returns/SalesReturnListNotes';
import {
    parseSalesReturnListPage,
    salesReturnUnitCount,
    type SalesReturnListRow,
} from '@/utils/salesReturnList';

/** Sales returns list (OE-336): each row opens the OE-327 detail page. */
export default function SalesReturnsPage() {
    const [rows, setRows] = useState<SalesReturnListRow[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const load = useCallback(async (pageNumber: number) => {
        setIsLoading(true);
        try {
            const res = await api.get('/returns/sales/', { params: { page: pageNumber } });
            const parsed = parseSalesReturnListPage(res.data);
            setRows((prev) => (pageNumber === 1 ? parsed.rows : [...prev, ...parsed.rows]));
            setHasMore(parsed.hasMore);
            setPage(pageNumber);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load sales returns');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        load(1);
    }, [load]);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link
                    href="/dashboard/orders"
                    aria-label="Back to orders"
                    className="p-3 hover:bg-white rounded-2xl border border-gray-100 transition-all text-gray-400 hover:text-gray-900 shadow-sm"
                >
                    <ChevronLeft size={20} />
                </Link>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <ArrowLeftRight className="text-red-500" /> Sales Returns
                    </h2>
                    <p className="text-muted-foreground">Refunds given against customer orders, newest first.</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-black border-b border-gray-50">
                            <th className="p-4">Return</th>
                            <th className="p-4">Customer</th>
                            <th className="p-4 text-center">Units</th>
                            <th className="p-4 text-right">Refund</th>
                            <th className="p-4">Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {rows.map((row) => (
                            <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="p-4 min-w-[220px] max-w-[360px]">
                                    <Link
                                        href={`/dashboard/orders/return-detail?id=${row.id}`}
                                        className="font-bold text-gray-900 hover:text-primary hover:underline"
                                    >
                                        {row.return_number || `SRET-${row.id}`}
                                    </Link>
                                    {row.order_number ? (
                                        <div className="text-xs text-gray-500">Against {row.order_number}</div>
                                    ) : null}
                                    <SalesReturnListNotes salesReturn={row} className="mt-1" />
                                </td>
                                <td className="p-4 text-gray-700">{row.customer_name || '—'}</td>
                                <td className="p-4 text-center font-bold text-red-600">{salesReturnUnitCount(row)}</td>
                                <td className="p-4 text-right font-black text-gray-900">
                                    ₹{Number(row.refund_amount ?? 0).toFixed(2)}
                                </td>
                                <td className="p-4 text-gray-500 whitespace-nowrap">
                                    {row.created_at
                                        ? new Date(row.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                                        : '—'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {!isLoading && rows.length === 0 ? (
                    <p className="p-8 text-center text-muted-foreground">No sales returns yet.</p>
                ) : null}
                {isLoading ? (
                    <div className="p-8 flex justify-center">
                        <Loader2 className="animate-spin text-red-500" size={28} />
                    </div>
                ) : null}
            </div>

            {hasMore && !isLoading ? (
                <div className="flex justify-center">
                    <button
                        type="button"
                        onClick={() => load(page + 1)}
                        className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50"
                    >
                        Load more
                    </button>
                </div>
            ) : null}
        </div>
    );
}
