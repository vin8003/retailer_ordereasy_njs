'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/services/api';
import { AlertTriangle, ChevronLeft, Loader2 } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import Link from 'next/link';
import { WriteOffDetailView, type WriteOffDetailViewModel } from '@/components/inventory/WriteOffDetailView';
import { pickWriteOffDetailFromLedgerPayload } from '@/utils/writeOffDetailCostCenter';

const DUMMY_WRITE_OFF: WriteOffDetailViewModel = {
    id: 7015,
    product_name: 'Atta 10kg',
    quantity_change: '-2',
    reason: 'damage',
    log_type: 'damaged',
    cost_center: 'CC-STORE',
};

const DUMMY_WRITE_OFF_NO_COST_CENTER: WriteOffDetailViewModel = {
    id: 7015,
    product_name: 'Atta 10kg',
    quantity_change: '-2',
    reason: 'damage',
    log_type: 'damaged',
    cost_center: null,
};

function ledgerPath(productId?: string | null, reason?: string | null): string {
    const params = new URLSearchParams();
    if (productId) params.set('product_id', productId);
    if (reason) params.set('reason', reason);
    const qs = params.toString();
    return qs ? `/products/erp/inventory-ledger/?${qs}` : '/products/erp/inventory-ledger/';
}

function WriteOffDetailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const writeOffId = searchParams.get('id');
    const productId = searchParams.get('product_id');
    const reason = searchParams.get('reason');
    const useDummy = searchParams.get('dummy') === '1';
    const omitCostCenter = searchParams.get('omit_cost_center') === '1';

    const [writeOff, setWriteOff] = useState<WriteOffDetailViewModel | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (useDummy) {
            setWriteOff(omitCostCenter ? DUMMY_WRITE_OFF_NO_COST_CENTER : DUMMY_WRITE_OFF);
            setIsLoading(false);
            return;
        }

        if (!writeOffId) {
            toast.error('Write-off ID is missing');
            router.push('/dashboard/products');
            return;
        }

        const fetchWriteOff = async () => {
            try {
                const res = await api.get(ledgerPath(productId, reason));
                const row = pickWriteOffDetailFromLedgerPayload(res.data, writeOffId);
                setWriteOff(row);
            } catch (error) {
                console.error(error);
                toast.error('Failed to load write-off details');
            } finally {
                setIsLoading(false);
            }
        };

        fetchWriteOff();
    }, [writeOffId, productId, reason, router, useDummy, omitCostCenter]);

    if (isLoading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={40} />
            </div>
        );
    }

    if (!writeOff) {
        return (
            <div className="p-8 max-w-4xl mx-auto text-center">
                <h2 className="text-2xl font-bold text-gray-700">Write-off record not found</h2>
                <button onClick={() => router.push('/dashboard/products')} className="mt-4 text-primary hover:underline">
                    Back to Products
                </button>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-[800px] mx-auto font-sans min-h-screen pb-32">
            <Toaster position="top-right" />

            <div className="flex items-center gap-4 mb-8">
                <Link href="/dashboard/products">
                    <button className="p-3 hover:bg-white rounded-2xl border border-gray-100 transition-all text-gray-400 hover:text-gray-900 shadow-sm">
                        <ChevronLeft size={24} />
                    </button>
                </Link>
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <AlertTriangle className="text-amber-500" /> Write-off Details
                    </h1>
                    <p className="text-gray-500 mt-1">Damage / expiry / spoilage record.</p>
                </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                <WriteOffDetailView writeOff={writeOff} />
            </div>
        </div>
    );
}

export default function WriteOffDetailPage() {
    return (
        <Suspense fallback={<div className="flex h-[80vh] items-center justify-center"><Loader2 className="animate-spin text-primary" size={40} /></div>}>
            <WriteOffDetailContent />
        </Suspense>
    );
}
