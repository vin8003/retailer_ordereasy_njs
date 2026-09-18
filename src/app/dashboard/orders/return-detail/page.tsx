'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/services/api';
import {
    ChevronLeft, Loader2, User, Calendar, Hash, ArrowLeftRight, Package
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import Link from 'next/link';
import { SalesReturnDetailNotes } from '@/components/returns/SalesReturnDetailNotes';
import type { SalesReturnDetailNotesDisplay } from '@/utils/salesReturnDetailNotes';

function SalesReturnDetailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const returnId = searchParams.get('id');

    const [returnData, setReturnData] = useState<(SalesReturnDetailNotesDisplay & {
        id?: number;
        invoice_number?: string | null;
        customer_mobile?: string | null;
        return_date?: string | null;
        created_at?: string | null;
        total_amount?: number | string | null;
        processed_by_name?: string | null;
        items?: Array<{
            id?: number;
            product_name?: string | null;
            quantity?: number;
            unit_price?: number | string | null;
            refund_unit_price?: number | string | null;
            total?: number | string | null;
        }>;
    }) | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!returnId) {
            toast.error("Return ID is missing");
            router.push('/dashboard/orders');
            return;
        }

        const fetchReturnDetails = async () => {
            try {
                const res = await api.get(`/returns/sales/${returnId}/`);
                setReturnData(res.data);
            } catch (error) {
                console.error(error);
                toast.error("Failed to load return details");
            } finally {
                setIsLoading(false);
            }
        };

        fetchReturnDetails();
    }, [returnId, router]);

    if (isLoading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="animate-spin text-red-500" size={40} />
            </div>
        );
    }

    if (!returnData) {
        return (
            <div className="p-8 max-w-4xl mx-auto text-center">
                <h2 className="text-2xl font-bold text-gray-700">Return record not found</h2>
                <button onClick={() => router.push('/dashboard/orders')} className="mt-4 text-primary hover:underline">
                    Back to Orders
                </button>
            </div>
        );
    }

    const lineTotal = (item: NonNullable<typeof returnData.items>[number]) => {
        if (item.total !== undefined && item.total !== null && item.total !== '') {
            return Number(item.total);
        }
        const qty = Number(item.quantity || 0);
        const price = Number(item.unit_price ?? item.refund_unit_price ?? 0);
        return qty * price;
    };

    return (
        <div className="p-8 max-w-[1200px] mx-auto font-sans min-h-screen pb-32">
            <Toaster position="top-right" />

            <div className="flex items-center gap-4 mb-8">
                <Link href="/dashboard/orders">
                    <button className="p-3 hover:bg-white rounded-2xl border border-gray-100 transition-all text-gray-400 hover:text-gray-900 shadow-sm">
                        <ChevronLeft size={24} />
                    </button>
                </Link>
                <div>
                    <h1 className="text-3xl font-black text-red-700 tracking-tight flex items-center gap-3">
                        <ArrowLeftRight className="text-red-500" /> Sale Return Details
                    </h1>
                    <p className="text-gray-500 mt-1">View items returned from a customer order and stock restore.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2 space-y-6">
                    <div className="bg-red-50/30 p-8 rounded-[2rem] border border-red-100 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-red-400 uppercase tracking-widest flex items-center gap-2">
                                <User size={14} /> Customer
                            </label>
                            <div className="text-lg font-bold text-red-900">{returnData.customer_name || '—'}</div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-red-400 uppercase tracking-widest flex items-center gap-2">
                                <Hash size={14} /> Return Number
                            </label>
                            <div className="text-lg font-bold text-red-900">{returnData.return_number || `SRET-${returnData.id}`}</div>
                            {returnData.order_number ? (
                                <div className="text-xs font-medium text-red-500">Against Order: {returnData.order_number}</div>
                            ) : null}
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-red-400 uppercase tracking-widest flex items-center gap-2">
                                <Calendar size={14} /> Return Date
                            </label>
                            <div className="text-lg font-bold text-red-900">
                                {returnData.return_date || returnData.created_at
                                    ? new Date(returnData.return_date || returnData.created_at || '').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                                    : '—'}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                            <Package className="text-gray-400" size={20} />
                            <h3 className="text-lg font-bold text-gray-900">Returned Items</h3>
                        </div>
                        <div className="flex-1 overflow-x-auto p-4">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-black border-b border-gray-50">
                                        <th className="p-4 px-6">Product</th>
                                        <th className="p-4 text-center">Qty Returned</th>
                                        <th className="p-4 text-right">Unit Price</th>
                                        <th className="p-4 text-right">Total Refund</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {returnData.items?.map((item, index) => (
                                        <tr key={item.id ?? index} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="p-4 px-6">
                                                <div className="font-bold text-gray-900">{item.product_name}</div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className="font-black text-red-600 bg-red-50 px-3 py-1 rounded-lg">
                                                    {item.quantity}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right font-medium text-gray-600">
                                                ₹{Number(item.unit_price ?? item.refund_unit_price ?? 0).toFixed(2)}
                                            </td>
                                            <td className="p-4 text-right font-black text-gray-900">
                                                ₹{lineTotal(item).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-primary/5 sticky top-8">
                        <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                            Return Summary
                        </h3>

                        <div className="space-y-4 mb-8">
                            <div className="flex justify-between text-gray-500 font-medium">
                                <span>Items Returned</span>
                                <span>{returnData.items?.reduce((sum, item) => sum + Number(item.quantity || 0), 0) || 0}</span>
                            </div>
                            <div className="flex justify-between items-end pt-4 border-t border-dashed border-gray-200">
                                <span className="text-lg font-bold text-gray-900">Total Refund</span>
                                <span className="text-4xl font-black text-red-600 tracking-tighter">
                                    ₹{Number(returnData.total_amount || 0).toFixed(2)}
                                </span>
                            </div>
                        </div>

                        <SalesReturnDetailNotes salesReturn={returnData} className="mb-8" />

                        {returnData.processed_by_name && (
                            <div className="mt-8 text-xs text-gray-400 font-medium px-1">
                                Processed by {returnData.processed_by_name}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function SalesReturnDetailPage() {
    return (
        <Suspense fallback={<div className="flex h-[80vh] items-center justify-center"><Loader2 className="animate-spin text-red-500" size={40} /></div>}>
            <SalesReturnDetailContent />
        </Suspense>
    );
}
