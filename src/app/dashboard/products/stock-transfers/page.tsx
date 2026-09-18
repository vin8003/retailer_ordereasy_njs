'use client';

import { useCallback, useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '@/services/api';
import { Loader2, AlertTriangle } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import { StockTransferList } from '@/components/products/StockTransferList';
import { mapStockTransferListItem, type StockTransferListItem } from '@/utils/stockTransferGodown';

function StockTransfersContent() {
    const searchParams = useSearchParams();
    const productId = searchParams.get('product_id') || searchParams.get('id');

    const [items, setItems] = useState<StockTransferListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchList = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const params: Record<string, string | number> = {};
            if (productId) params.product_id = productId;
            const res = await api.get('/products/erp/stock-transfers/', { params });
            const rows = Array.isArray(res.data) ? res.data : res.data?.results ?? [];
            setItems(rows.map(mapStockTransferListItem));
        } catch (err: unknown) {
            const status = (err as { response?: { status?: number } })?.response?.status;
            setItems([]);
            if (status === 401 || status === 403) {
                setError("You don't have access to stock transfers.");
            } else {
                setError("Failed to load stock transfers.");
                toast.error("Failed to load stock transfers");
            }
        } finally {
            setIsLoading(false);
        }
    }, [productId]);

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
                    Stock transfers
                </h1>
                <p className="text-gray-500 mt-1 font-medium">
                    Transfer rows. Godown is shown only when the API sent godown_name.
                </p>
            </div>

            {error ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-white border border-gray-100 rounded-2xl p-6">
                    <AlertTriangle size={16} />
                    {error}
                </div>
            ) : (
                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                    <StockTransferList items={items} />
                </div>
            )}
        </div>
    );
}

export default function StockTransfersPage() {
    return (
        <Suspense
            fallback={
                <div className="flex h-[80vh] items-center justify-center">
                    <Loader2 className="animate-spin text-primary" size={40} />
                </div>
            }
        >
            <StockTransfersContent />
        </Suspense>
    );
}
