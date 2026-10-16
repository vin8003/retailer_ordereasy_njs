'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import api, { productService } from '@/services/api';
import { History, ChevronLeft, Loader2 } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import Link from 'next/link';
import { InventoryLedgerHistory, type InventoryLedgerLog } from '@/components/products/InventoryLedgerHistory';
import { useOrgContext } from '@/hooks/useOrgContext';
import { WriteOffForm } from '@/components/products/WriteOffForm';
import { WRITE_OFF_REASONS, canWriteOffStock, ledgerReasonQuery } from '@/lib/writeOff';

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
    const productId = searchParams.get('id');
    const { permissions } = useOrgContext();
    const canWriteOff = canWriteOffStock(permissions);

    const [logs, setLogs] = useState<InventoryLedgerLog[]>([]);
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
                // The product must load even if the ledger request fails, so the write-off
                // form stays usable; the ledger error is reported separately.
                const [ledgerResult, prodResult] = await Promise.allSettled([
                    loadLedger('all'),
                    api.get(`/products/${productId}/`)
                ]);
                if (prodResult.status === 'rejected') throw prodResult.reason;
                setProduct(prodResult.value.data);
                if (ledgerResult.status === 'rejected') {
                    toast.error("Could not load the movement history. You can still record a write-off.");
                }
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
                <InventoryLedgerHistory logs={logs} />
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
