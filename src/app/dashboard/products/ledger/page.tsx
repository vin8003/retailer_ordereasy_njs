'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api, { productService } from '@/services/api';
import { 
    History, ChevronLeft, Loader2, Package, 
    PlusCircle, MinusCircle, ShoppingCart, 
    AlertCircle, FileText, User
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import Link from 'next/link';
import { orderDetailsHref, parseOrderNumberFromText } from '@/lib/orderLinks';
import { useOrgContext } from '@/hooks/useOrgContext';
import { WriteOffForm } from '@/components/products/WriteOffForm';
import { WRITE_OFF_REASONS, canWriteOffStock, ledgerReasonQuery } from '@/lib/writeOff';

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
    has_batches?: boolean;
    batches?: {
        id: number;
        batch_number?: string;
        expiry_date?: string | null;
        quantity?: number | string;
        is_active?: boolean;
    }[];
}

function LedgerContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const productId = searchParams.get('id');
    const { permissions } = useOrgContext();
    const canWriteOff = canWriteOffStock(permissions);

    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [product, setProduct] = useState<Product | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [reasonFilter, setReasonFilter] = useState('all');

    const loadLedger = async (reason = reasonFilter) => {
        if (!productId) return;
        const reasonParam = ledgerReasonQuery(reason);
        const logRes = await productService.fetchInventoryLedger({
            product_id: Number(productId),
            ...(reasonParam ? { reason: reasonParam } : {}),
        });
        const rows = Array.isArray(logRes.data) ? logRes.data : logRes.data?.results ?? [];
        setLogs(rows);
    };

    useEffect(() => {
        const fetchData = async () => {
            if (!productId) return;
            setIsLoading(true);
            try {
                const [_, prodRes] = await Promise.all([
                    loadLedger('all'),
                    api.get(`/products/${productId}/`)
                ]);
                setProduct(prodRes.data);
            } catch (error) {
                toast.error("Failed to load inventory history");
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
        // Mount / id only — reason filter reloads via onChange.
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

                <div className="md:col-span-2 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                    <WriteOffForm
                        productId={product.id}
                        hasBatches={Boolean(product.has_batches)}
                        batches={product.batches || []}
                        canWriteOff={canWriteOff}
                        onWrittenOff={async () => {
                            const prodRes = await api.get(`/products/${productId}/`);
                            setProduct(prodRes.data);
                            await loadLedger(reasonFilter);
                        }}
                    />
                </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-gray-100 bg-gray-50/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <h3 className="text-xl font-black text-gray-900">Transition History</h3>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                        Reason
                        <select
                            className="ml-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-gray-800 normal-case tracking-normal"
                            value={reasonFilter}
                            onChange={async (e) => {
                                const next = e.target.value;
                                setReasonFilter(next);
                                try {
                                    await loadLedger(next);
                                } catch {
                                    toast.error("Failed to filter ledger");
                                }
                            }}
                        >
                            <option value="all">All</option>
                            {WRITE_OFF_REASONS.map((code) => (
                                <option key={code} value={code}>{code}</option>
                            ))}
                        </select>
                    </label>
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
                                        log.log_type === 'damaged' || log.log_type === 'expired' || log.log_type === 'spoiled'
                                            ? 'text-orange-700 bg-orange-50'
                                            : 'text-gray-600 bg-gray-50';

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
                                                        {(() => {
                                                            const orderNumber = parseOrderNumberFromText(log.reason);
                                                            const href = orderDetailsHref({ orderNumber });
                                                            if (!href) return log.reason || 'N/A';
                                                            return (
                                                                <Link
                                                                    href={href}
                                                                    className="text-primary hover:underline"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    {log.reason}
                                                                </Link>
                                                            );
                                                        })()}
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
