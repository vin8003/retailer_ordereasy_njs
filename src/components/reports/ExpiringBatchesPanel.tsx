'use client';

import React, { useEffect, useState } from 'react';
import { Calendar, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/services/api';
import { Badge } from '@/components/ui/badge';
import {
    buildExpiringBatchesRequest,
    getExpiredBadgeLabel,
    getExpiringBatchesErrorStatus,
    isExpiringBatchesAuthDenied,
    parseExpiringBatchesPayload,
    resolveExpiringBatchesView,
    type ExpiringBatchRow,
} from '@/utils/expiringBatches';

type ExpiringBatchesPanelProps = {
    /** Controlled rows for tests. Omit to fetch GET expiring-batches (default N=30). */
    batches?: ExpiringBatchRow[];
    /** Controlled axios-style status. 401/403 hide the panel. */
    errorStatus?: number;
};

function cellText(value: string | number | null | undefined): string {
    if (value === undefined || value === null) return '';
    return String(value);
}

/** Reports-only expiry list. Auth errors hide this card and never throw to the parent. */
export function ExpiringBatchesPanel({ batches, errorStatus }: ExpiringBatchesPanelProps = {}) {
    const isControlled = batches !== undefined || errorStatus !== undefined;
    const [remoteBatches, setRemoteBatches] = useState<ExpiringBatchRow[]>([]);
    const [remoteError, setRemoteError] = useState<number | undefined>(undefined);
    const [loading, setLoading] = useState(!isControlled);

    useEffect(() => {
        if (isControlled) return;
        let cancelled = false;
        const { url, params } = buildExpiringBatchesRequest();
        api
            .get(url, { params })
            .then((res) => {
                if (cancelled) return;
                setRemoteBatches(parseExpiringBatchesPayload(res.data));
            })
            .catch((error) => {
                if (cancelled) return;
                const status = getExpiringBatchesErrorStatus(error);
                setRemoteError(status);
                if (isExpiringBatchesAuthDenied(status)) {
                    toast.error('Failed to load expiring batches');
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [isControlled]);

    const viewBatches = isControlled ? batches ?? [] : remoteBatches;
    const viewError = isControlled ? errorStatus : remoteError;
    const view = resolveExpiringBatchesView({ errorStatus: viewError, batches: viewBatches });

    if (!isControlled && loading) {
        return (
            <div
                data-testid="expiring-batches-loading"
                className="bg-white p-5 sm:p-10 rounded-[2rem] sm:rounded-[3rem] border border-gray-100 shadow-sm mb-6 md:mb-10 flex justify-center"
            >
                <Loader2 className="animate-spin text-primary" size={24} />
            </div>
        );
    }

    if (view === 'hidden') return null;

    return (
        <section
            data-testid="expiring-batches-panel"
            className="bg-white p-5 sm:p-10 rounded-[2rem] sm:rounded-[3rem] border border-gray-100 shadow-sm mb-6 md:mb-10"
        >
            <h3 className="text-base sm:text-lg font-black text-gray-900 mb-4 sm:mb-6 border-b border-gray-50 pb-4 flex items-center gap-2">
                <Calendar size={18} className="text-primary" />
                Expiring Batches
            </h3>

            {view === 'empty' ? (
                <p
                    data-testid="expiring-batches-empty"
                    className="text-sm text-gray-500 font-medium text-center py-6"
                >
                    No expiring batches in the next 30 days.
                </p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">
                                <th className="pb-3 pr-3 font-bold">Product</th>
                                <th className="pb-3 pr-3 font-bold">Batch</th>
                                <th className="pb-3 pr-3 font-bold">Expiry</th>
                                <th className="pb-3 pr-3 font-bold">Qty</th>
                                <th className="pb-3 font-bold" />
                            </tr>
                        </thead>
                        <tbody>
                            {viewBatches.map((row, index) => {
                                const expiredLabel = getExpiredBadgeLabel(row);
                                return (
                                    <tr key={`${row.batch_number ?? 'batch'}-${row.expiry_date ?? index}`} className="border-t border-gray-50">
                                        <td className="py-3 pr-3 font-bold text-gray-900">{cellText(row.product_name)}</td>
                                        <td className="py-3 pr-3 font-medium text-gray-700">{cellText(row.batch_number)}</td>
                                        <td className="py-3 pr-3 font-medium text-gray-700">{cellText(row.expiry_date)}</td>
                                        <td className="py-3 pr-3 font-medium text-gray-700">{cellText(row.quantity)}</td>
                                        <td className="py-3">
                                            {expiredLabel ? (
                                                <Badge
                                                    variant="destructive"
                                                    aria-label="Expired batch"
                                                    className="text-[10px] px-1.5 py-0 h-4 font-medium"
                                                >
                                                    {expiredLabel}
                                                </Badge>
                                            ) : null}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}
