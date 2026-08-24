export const FCM_ORDER_UPDATE_EVENT = 'fcm_order_update';
export const LOCAL_ORDER_STATS_REFRESH_EVENT = 'order_stats_refresh';

const REFRESH_EVENTS = [FCM_ORDER_UPDATE_EVENT, LOCAL_ORDER_STATS_REFRESH_EVENT] as const;

/**
 * Subscribe to pending-order count refreshes.
 * Calls onRefresh immediately (initial load), then only on FCM new-order
 * events or local cashier status changes — never on a timer.
 */
export function subscribeOrderStatsRefresh(
    onRefresh: () => void,
    target: EventTarget | null = typeof window !== 'undefined' ? window : null,
): () => void {
    if (!target) {
        onRefresh();
        return () => undefined;
    }

    onRefresh();
    const handler = () => onRefresh();
    for (const eventName of REFRESH_EVENTS) {
        target.addEventListener(eventName, handler);
    }
    return () => {
        for (const eventName of REFRESH_EVENTS) {
            target.removeEventListener(eventName, handler);
        }
    };
}

export function dispatchOrderStatsRefresh(
    target: EventTarget | null = typeof window !== 'undefined' ? window : null,
): void {
    if (!target) return;
    target.dispatchEvent(new Event(LOCAL_ORDER_STATS_REFRESH_EVENT));
}
