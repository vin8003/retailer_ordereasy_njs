import assert from 'node:assert/strict';
import { afterEach, mock, test } from 'node:test';
import {
    dispatchOrderStatsRefresh,
    FCM_ORDER_UPDATE_EVENT,
    LOCAL_ORDER_STATS_REFRESH_EVENT,
    subscribeOrderStatsRefresh,
} from './orderStatsRefresh.ts';

afterEach(() => {
    mock.restoreAll();
});

test('subscribes with an immediate refresh and no timer', () => {
    const intervalSpy = mock.method(globalThis, 'setInterval', () => 0 as unknown as NodeJS.Timeout);
    const target = new EventTarget();
    let calls = 0;

    const unsubscribe = subscribeOrderStatsRefresh(() => {
        calls += 1;
    }, target);

    assert.equal(calls, 1);
    assert.equal(intervalSpy.mock.calls.length, 0);

    unsubscribe();
});

test('refreshes when FCM reports a new or updated order', () => {
    const target = new EventTarget();
    let calls = 0;
    const unsubscribe = subscribeOrderStatsRefresh(() => {
        calls += 1;
    }, target);

    target.dispatchEvent(new Event(FCM_ORDER_UPDATE_EVENT));
    assert.equal(calls, 2);

    unsubscribe();
    target.dispatchEvent(new Event(FCM_ORDER_UPDATE_EVENT));
    assert.equal(calls, 2);
});

test('refreshes when a local cashier status change is dispatched', () => {
    const target = new EventTarget();
    let calls = 0;
    subscribeOrderStatsRefresh(() => {
        calls += 1;
    }, target);

    dispatchOrderStatsRefresh(target);
    assert.equal(calls, 2);
});

test('ignores unrelated events', () => {
    const target = new EventTarget();
    let calls = 0;
    subscribeOrderStatsRefresh(() => {
        calls += 1;
    }, target);

    target.dispatchEvent(new Event('fcm_chat_message'));
    target.dispatchEvent(new Event('fcm_message'));
    assert.equal(calls, 1);
    assert.equal(LOCAL_ORDER_STATS_REFRESH_EVENT, 'order_stats_refresh');
});
