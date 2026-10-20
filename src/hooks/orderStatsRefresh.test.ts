import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    dispatchOrderStatsRefresh,
    FCM_ORDER_UPDATE_EVENT,
    LOCAL_ORDER_STATS_REFRESH_EVENT,
    subscribeOrderStatsRefresh,
} from './orderStatsRefresh';

describe('orderStatsRefresh', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('subscribes with an immediate refresh and no timer', () => {
        const intervalSpy = vi.spyOn(globalThis, 'setInterval');
        const target = new EventTarget();
        let calls = 0;

        const unsubscribe = subscribeOrderStatsRefresh(() => {
            calls += 1;
        }, target);

        expect(calls).toBe(1);
        expect(intervalSpy).not.toHaveBeenCalled();

        unsubscribe();
    });

    it('refreshes when FCM reports a new or updated order', () => {
        const target = new EventTarget();
        let calls = 0;
        const unsubscribe = subscribeOrderStatsRefresh(() => {
            calls += 1;
        }, target);

        target.dispatchEvent(new Event(FCM_ORDER_UPDATE_EVENT));
        expect(calls).toBe(2);

        unsubscribe();
        target.dispatchEvent(new Event(FCM_ORDER_UPDATE_EVENT));
        expect(calls).toBe(2);
    });

    it('refreshes when a local cashier status change is dispatched', () => {
        const target = new EventTarget();
        let calls = 0;
        subscribeOrderStatsRefresh(() => {
            calls += 1;
        }, target);

        dispatchOrderStatsRefresh(target);
        expect(calls).toBe(2);
    });

    it('ignores unrelated events', () => {
        const target = new EventTarget();
        let calls = 0;
        subscribeOrderStatsRefresh(() => {
            calls += 1;
        }, target);

        target.dispatchEvent(new Event('fcm_chat_message'));
        target.dispatchEvent(new Event('fcm_message'));
        expect(calls).toBe(1);
        expect(LOCAL_ORDER_STATS_REFRESH_EVENT).toBe('order_stats_refresh');
    });
});
