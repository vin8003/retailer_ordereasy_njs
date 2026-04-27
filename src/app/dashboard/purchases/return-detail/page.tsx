'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/services/api';
import { 
    ChevronLeft, Loader2, Truck, Calendar, Hash, ArrowLeftRight, Package
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import Link from 'next/link';

function ReturnDetailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const returnId = searchParams.get('id');

    const [returnData, setReturnData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!returnId) {
            toast.error("Return ID is missing");
            router.push('/dashboard/purchases');
            return;
        }

        const fetchReturnDetails = async () => {
            try {
                const res = await api.get(`/returns/purchase/${returnId}/`);
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
                <button onClick={() => router.push('/dashboard/purchases')} className="mt-4 text-primary hover:underline">
                    Back to Purchases
                </button>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-[1200px] mx-auto font-sans min-h-screen pb-32">
            <Toaster position="top-right" />
            
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/dashboard/purchases">
                    <button className="p-3 hover:bg-white rounded-2xl border border-gray-100 transition-all text-gray-400 hover:text-gray-900 shadow-sm">
                        <ChevronLeft size={24} />
                    </button>
                </Link>
                <div>
                    <h1 className="text-3xl font-black text-red-700 tracking-tight flex items-center gap-3">
                        <ArrowLeftRight className="text-red-500" /> Return Details
                    </h1>
                    <p className="text-gray-500 mt-1">View items returned to distributor and ledger impact.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                
                {/* Left: Meta & Items */}
                <div className="xl:col-span-2 space-y-6">
                    
                    {/* Return Meta */}
                    <div className="bg-red-50/30 p-8 rounded-[2rem] border border-red-100 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-red-400 uppercase tracking-widest flex items-center gap-2">
                                <Truck size={14} /> Distributor
                            </label>
                            <div className="text-lg font-bold text-red-900">{returnData.supplier_name || 'Unknown'}</div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-red-400 uppercase tracking-widest flex items-center gap-2">
                                <Hash size={14} /> Return Number
                            </label>
                            <div className="text-lg font-bold text-red-900">{returnData.return_number || `RET-${returnData.id}`}</div>
                            <div className="text-xs font-medium text-red-500">Against Bill: {returnData.invoice_number}</div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-red-400 uppercase tracking-widest flex items-center gap-2">
                                <Calendar size={14} /> Return Date
                            </label>
                            <div className="text-lg font-bold text-red-900">
                                {new Date(returnData.return_date || returnData.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </div>
                        </div>
                    </div>

                    {/* Returned Items Table */}
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
                                        <th className="p-4 text-center">Batch</th>
                                        <th className="p-4 text-center">Qty Returned</th>
                                        <th className="p-4 text-right">Inward Price</th>
                                        <th className="p-4 text-right">Total Refund</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {returnData.items?.map((item: any) => (
                                        <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="p-4 px-6">
                                                <div className="font-bold text-gray-900">{item.product_name}</div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className="text-xs font-mono text-gray-500 bg-gray-100 inline-block px-2 py-1 rounded">
                                                    {item.batch_number || '-'}
                                                </div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className="font-black text-red-600 bg-red-50 px-3 py-1 rounded-lg">
                                                    {item.quantity}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right font-medium text-gray-600">
                                                ₹{Number(item.purchase_price).toFixed(2)}
                                            </td>
                                            <td className="p-4 text-right font-black text-gray-900">
                                                ₹{Number(item.total).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right: Summary */}
                <div className="space-y-6">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-primary/5 sticky top-8">
                        <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                            Return Summary
                        </h3>
                        
                        <div className="space-y-4 mb-8">
                            <div className="flex justify-between text-gray-500 font-medium">
                                <span>Items Returned</span>
                                <span>{returnData.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0}</span>
                            </div>
                            <div className="flex justify-between items-end pt-4 border-t border-dashed border-gray-200">
                                <span className="text-lg font-bold text-gray-900">Total Refund</span>
                                <span className="text-4xl font-black text-red-600 tracking-tighter">₹{Number(returnData.total_amount).toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="bg-green-50 rounded-[2rem] p-6 mb-8 border border-green-100">
                            <p className="text-sm font-medium text-green-800 leading-relaxed">
                                A DEBIT entry of <span className="font-black">₹{Number(returnData.total_amount).toFixed(2)}</span> has been automatically recorded in {returnData.supplier_name}'s ledger. 
                                Inventory has also been deducted accordingly.
                            </p>
                        </div>

                        {returnData.notes && (
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">
                                    Notes
                                </label>
                                <div className="bg-gray-50 rounded-2xl py-4 px-5 text-gray-700 text-sm italic border border-gray-100">
                                    "{returnData.notes}"
                                </div>
                            </div>
                        )}
                        
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

export default function ReturnDetailPage() {
    return (
        <Suspense fallback={<div className="flex h-[80vh] items-center justify-center"><Loader2 className="animate-spin text-red-500" size={40} /></div>}>
            <ReturnDetailContent />
        </Suspense>
    );
}
