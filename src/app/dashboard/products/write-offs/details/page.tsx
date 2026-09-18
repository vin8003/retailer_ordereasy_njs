'use client';

import { useCallback, useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/services/api';
import { Loader2, AlertTriangle, ChevronLeft } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import { WriteOffDetail } from '@/components/products/WriteOffDetail';
import { unwrapWriteOffDetail, type WriteOffDetailItem } from '@/utils/writeOffDetailCreatedBy';

function WriteOffDetailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const rawId = searchParams.get('id');
    const id = rawId ? Number(rawId) : NaN;

    const [detail, setDetail] = useState<WriteOffDetailItem | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDetail = useCallback(async () => {
        if (!Number.isFinite(id) || id <= 0) {
            setDetail(null);
            setError('Write-off ID is missing.');
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const res = await api.get('/products/erp/inventory-ledger/', { params: { id } });
            const mapped = unwrapWriteOffDetail(res.data, id);
            setDetail(mapped);
            if (!mapped) setError('Write-off record not found.');
        } catch (err: unknown) {
            const status = (err as { response?: { status?: number } })?.response?.status;
            setDetail(null);
            if (status === 401 || status === 403) {
                setError("You don't have access to this write-off.");
            } else if (status === 404) {
                setError('Write-off record not found.');
            } else {
                setError('Failed to load write-off.');
                toast.error('Failed to load write-off');
            }
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchDetail();
    }, [fetchDetail]);

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
            <div className="flex items-center gap-4 mb-8">
                <Link href="/dashboard/products">
                    <button
                        type="button"
                        className="p-3 hover:bg-white rounded-2xl border border-gray-100 transition-all text-gray-400 hover:text-gray-900 shadow-sm"
                    >
                        <ChevronLeft size={24} />
                    </button>
                </Link>
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Write-off detail</h1>
                    <p className="text-gray-500 mt-1 font-medium">
                        Creator name is shown only when the API sent created_by_name.
                    </p>
                </div>
            </div>

            {error ? (
                <div className="flex flex-col gap-3 text-sm text-muted-foreground bg-white border border-gray-100 rounded-2xl p-6">
                    <div className="flex items-center gap-2">
                        <AlertTriangle size={16} />
                        {error}
                    </div>
                    <button
                        type="button"
                        onClick={() => router.push('/dashboard/products')}
                        className="text-primary hover:underline text-left"
                    >
                        Back to Products
                    </button>
                </div>
            ) : detail ? (
                <WriteOffDetail detail={detail} />
            ) : null}
        </div>
    );
}

export default function WriteOffDetailPage() {
    return (
        <Suspense
            fallback={
                <div className="flex h-[80vh] items-center justify-center">
                    <Loader2 className="animate-spin text-primary" size={40} />
                </div>
            }
        >
            <WriteOffDetailContent />
        </Suspense>
    );
}
