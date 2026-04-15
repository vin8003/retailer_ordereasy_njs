'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/services/api';
import { 
    History, ChevronLeft, Loader2, Package, 
    PlusCircle, MinusCircle, ShoppingCart, 
    AlertCircle, FileText, User
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import Link from 'next/link';

interface LogEntry {
    id: number;
    log_type: string;
    quantity_change: number;
    previous_quantity: number;
    new_quantity: number;
    reason: string;
    created_at: string;
    created_by: string;
}

interface Product {
    id: number;
    name: string;
    quantity: number;
    unit: string;
}

function LedgerContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const productId = searchParams.get('id');

    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [product, setProduct] = useState<Product | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!productId) return;
            setIsLoading(true);
            try {
                const [logRes, prodRes] = await Promise.all([
                    api.get(`/products/erp/inventory-ledger/?product_id=${productId}`),
                    api.get(`/products/${productId}/`)
                ]);
                setLogs(logRes.data);
                setProduct(prodRes.data);
            } catch (error) {
                toast.error("Failed to load inventory history");
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [productId]);

    if (isLoading) return (
        <div className="flex h-[80vh] items-center justify-center">
            <Loader2 className="animate-spin text-primary" size={40} />
        </div>
    );

    if (!product) return <div className="p-20 text-center">Product not found.</div>;

    return (
        <div className="p-8 max-w-5xl mx-auto font-sans min-h-screen pb-32">
            <Toaster position="top-right" />
            
            <div className="flex items-center gap-4 mb-10">
                <Link href="/dashboard/products">
                    <button className="p-3 hover:bg-white rounded-2xl border border-gray-100 transition-all text-gray-400 hover:text-gray-900 shadow-sm">
                        <ChevronLeft size={24} />
                    </button>
                </Link>
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">{product.name}</h1>
                    <p className="text-gray-500 mt-1 font-medium flex items-center gap-2">
                        <History size={16} /> Inventory Audit Trail
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                <div className="bg-gray-900 p-8 rounded-[2.5rem] text-white shadow-xl flex flex-col justify-center border border-gray-800">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Current Stock</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-black tracking-tighter">{product.quantity}</span>
                        <span className="text-lg font-bold text-gray-500 uppercase">{product.unit || 'Units'}</span>
                    </div>
                </div>

                <div className="md:col-span-2 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center gap-8">
                    <div className="size-16 bg-primary/10 text-primary rounded-[1.5rem] flex items-center justify-center">
                        <Package size={32} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-gray-900">Total Movements</h3>
                        <p className="text-gray-400 font-medium">Tracking all inward & outward changes</p>
                    </div>
                </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-gray-100 bg-gray-50/30">
                    <h3 className="text-xl font-black text-gray-900">Transition History</h3>
                </div>

                <div className="overflow-x-auto">
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
                                    <td colSpan={5} className="p-20 text-center text-gray-400 italic">No history recorded for this product.</td>
                                </tr>
                            ) : (
                                logs.map(log => {
                                    const isPositive = log.quantity_change > 0;
                                    const logTypeColor = 
                                        log.log_type === 'added' ? 'text-green-600 bg-green-50' :
                                        log.log_type === 'sold' ? 'text-blue-600 bg-blue-50' :
                                        log.log_type === 'removed' ? 'text-red-600 bg-red-50' :
                                        'text-gray-600 bg-gray-50';

                                    return (
                                        <tr key={log.id} className="hover:bg-gray-50/30 transition-colors">
                                            <td className="p-6">
                                                <div className="font-bold text-gray-900 whitespace-nowrap">
                                                    {new Date(log.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <span className={`px-2 py-1 rounded-md font-black tracking-widest text-[9px] ${logTypeColor}`}>
                                                    {log.log_type}
                                                </span>
                                            </td>
                                            <td className="p-6">
                                                <div className={`flex items-center gap-2 text-base font-black ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
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
                                                    <div className="flex items-center gap-2 font-bold text-gray-900">
                                                        <FileText size={12} className="text-gray-400" />
                                                        {log.reason || 'N/A'}
                                                    </div>
                                                    <div className="flex items-center gap-2 font-bold text-gray-400 italic">
                                                        <User size={10} /> {log.created_by}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default function ProductLedgerPage() {
    return (
        <Suspense fallback={<div className="flex h-[80vh] items-center justify-center"><Loader2 className="animate-spin text-primary" size={40} /></div>}>
            <LedgerContent />
        </Suspense>
    );
}
