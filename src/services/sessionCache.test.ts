import { beforeEach, describe, expect, it, vi } from "vitest";
import {
    authProfileCache,
    clearAllSessionCaches,
    createSessionCache,
    invalidateAfterMutation,
    posProductsCache,
    profileCache,
} from "./sessionCache";

describe("createSessionCache", () => {
    it("loads once and shares one request between concurrent callers", async () => {
        const cache = createSessionCache<number>();
        const loader = vi.fn().mockResolvedValue(7);
        const [a, b] = await Promise.all([cache.load(loader), cache.load(loader)]);
        expect([a, b, await cache.load(loader)]).toEqual([7, 7, 7]);
        expect(loader).toHaveBeenCalledTimes(1);
    });

    it("does not keep a failed load", async () => {
        const cache = createSessionCache<number>();
        await expect(cache.load(() => Promise.reject(new Error("timeout")))).rejects.toThrow("timeout");
        expect(cache.peek()).toBeUndefined();
        expect(await cache.load(() => Promise.resolve(2))).toBe(2);
    });

    it("refresh always loads, and set replaces the value", async () => {
        const cache = createSessionCache<number>();
        await cache.load(() => Promise.resolve(1));
        expect(await cache.refresh(() => Promise.resolve(2))).toBe(2);
        cache.set(3);
        expect(await cache.load(() => Promise.resolve(4))).toBe(3);
    });

    it("drops a request that was in flight when the cache was cleared", async () => {
        const cache = createSessionCache<string>();
        let finish: (v: string) => void = () => {};
        const stale = cache.load(() => new Promise((resolve) => { finish = resolve; }));
        cache.clear();
        finish("old account");
        await stale;
        expect(cache.peek()).toBeUndefined();
    });
});

describe("invalidateAfterMutation", () => {
    beforeEach(() => {
        profileCache.set({ data: { shop_name: "A" } } as never);
        authProfileCache.set({ data: { is_admin: false } } as never);
        posProductsCache.set([{ id: 1 }]);
    });

    it("ignores reads", () => {
        invalidateAfterMutation("get", "retailer/profile/");
        invalidateAfterMutation(undefined, "products/1/update/");
        expect(profileCache.peek()).toBeDefined();
        expect(posProductsCache.peek()).toBeDefined();
    });

    it("drops the profiles after a profile or verification write", () => {
        invalidateAfterMutation("patch", "retailer/profile/update/");
        expect(profileCache.peek()).toBeUndefined();
        expect(authProfileCache.peek()).toBeUndefined();
        expect(posProductsCache.peek()).toBeDefined();
    });

    it("keeps the profiles for a device token register", () => {
        invalidateAfterMutation("post", "auth/device/register/");
        expect(profileCache.peek()).toBeDefined();
    });

    it("clears everything on login and signup", () => {
        invalidateAfterMutation("post", "auth/retailer/login/");
        expect(profileCache.peek()).toBeUndefined();
        expect(posProductsCache.peek()).toBeUndefined();
    });

    it.each([
        ["put", "/products/12/update/"],
        ["post", "products/create/"],
        ["post", "/products/erp/purchase-invoices/"],
        ["post", "/returns/sales/"],
        ["post", "orders/inbox/5/actions/"],
        ["patch", "https://api.ordereasy.win/api/orders/5/status/"],
    ])("drops the POS products after %s %s", (method, url) => {
        invalidateAfterMutation(method, url);
        expect(posProductsCache.peek()).toBeUndefined();
    });

    it.each([
        ["post", "/products/erp/pos-checkout/"],
        ["post", "/products/erp/suppliers/"],
        ["post", "orders/5/rate-customer/"],
        ["post", "orders/5/chat/send/"],
        ["post", "offers/calculate/"],
    ])("keeps the POS products after %s %s", (method, url) => {
        invalidateAfterMutation(method, url);
        expect(posProductsCache.peek()).toBeDefined();
    });

    it("clearAllSessionCaches empties every cache", () => {
        clearAllSessionCaches();
        expect([profileCache.peek(), authProfileCache.peek(), posProductsCache.peek()]).toEqual([
            undefined,
            undefined,
            undefined,
        ]);
    });
});
