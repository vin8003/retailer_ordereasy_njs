'use client';

import { useCallback, useEffect, useState } from 'react';
import { authService } from '@/services/api';
import { subscribeOrderStatsRefresh } from './orderStatsRefresh';

export function usePendingOrderCount(): number {
    const [pendingCount, setPendingCount] = useState(0);

    const fetchPendingCount = useCallback(async () => {
        try {
            const response = await authService.fetchStats();
            setPendingCount(response.data.pending_orders || 0);
        } catch (error) {
            console.error('Failed to fetch pending orders count:', error);
        }
    }, []);

    useEffect(() => subscribeOrderStatsRefresh(fetchPendingCount), [fetchPendingCount]);

    return pendingCount;
}
