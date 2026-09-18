'use client';

import { useCallback, useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '@/services/api';
import { Loader2, AlertTriangle } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import { WriteOffList } from '@/components/products/WriteOffList';
import { collectWriteOffListRows, type WriteOffListItem } from '@/utils/writeOffListReason';
import {
    buildWriteOffListLedgerQueries,
    parseWriteOffListProductId,
    parseWriteOffListReason,
} from '@/utils/writeOffListQuery';

function WriteOffsContent() {
    const searchParams = useSearchParams();
    const productId = parseWriteOffListProductId(searchParams.get('product_id'));
    const reason = parseWriteOffListReason(searchParams.get('reason'));

    const [items, setItems] = useState<WriteOffListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchList = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const queries = buildWriteOffListLedgerQueries({ productId, reason });
            const responses = await Promise.all(
                queries.map((params) => api.get('/products/erp/inventory-ledger/', { params }))
            );
            setItems(collectWriteOffListRows(responses.map((res) => res.data)));
        } catch (err: unknown) {
            const status = (err as { response?: { status?: number } })?.response?.status;
            setItems([]);
            if (status === 401 || status === 403) {
                setError("You don't have access to write-offs.");
            } else {
                setError("Failed to load write-offs.");
                toast.error("Failed to load write-offs");
            }
        } finally {
            setIsLoading(false);
        }
    }, [productId, reason]);

    useEffect(() => {
        fetchList();
    }, [fetchList]);

    if (isLoading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={40} />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-5xl mx-auto font-sans min-h-screen pb-32">
            <Toaster position="top-right" />
            <div className="mb-8">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                    Write-offs / Damage
                </h1>
                <p className="text-gray-500 mt-1 font-medium">
                    Inventory write-off and damage rows. Reason is shown only when the API sent it.
                </p>
            </div>

            {error ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-white border border-gray-100 rounded-2xl p-6">
                    <AlertTriangle size={16} />
                    {error}
                </div>
            ) : (
                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                    <WriteOffList items={items} />
                </div>
            )}
        </div>
    );
}

export default function WriteOffsPage() {
    return (
        <Suspense
            fallback={
                <div className="flex h-[80vh] items-center justify-center">
                    <Loader2 className="animate-spin text-primary" size={40} />
                </div>
            }
        >
            <WriteOffsContent />
        </Suspense>
    );
}
