import { describe, expect, it } from "vitest";
import {
    DEFAULT_EXPIRING_BATCH_DAYS,
    buildExpiringBatchesRequest,
    getExpiringBatchesErrorStatus,
    getExpiredBadgeLabel,
    isExpiringBatchesAuthDenied,
    parseExpiringBatchesPayload,
    resolveExpiringBatchesView,
} from "./expiringBatches";

describe("buildExpiringBatchesRequest", () => {
    it("requests the OE-210 list with default N=30", () => {
        const request = buildExpiringBatchesRequest();
        expect(request.url).toBe("/products/erp/expiring-batches/");
        expect(request.params).toEqual({ days: 30 });
        expect(DEFAULT_EXPIRING_BATCH_DAYS).toBe(30);
        expect(request.url).not.toContain("ordereasy.win");
    });

    it("forwards a custom days window without inventing a host", () => {
        const request = buildExpiringBatchesRequest(7);
        expect(request.params).toEqual({ days: 7 });
        expect(request.url).toBe("/products/erp/expiring-batches/");
    });
});

describe("parseExpiringBatchesPayload", () => {
    it("returns BE rows when the payload is an array", () => {
        const rows = parseExpiringBatchesPayload([
            {
                product_name: "Milk",
                batch_number: "B1",
                expiry_date: "2026-09-20",
                quantity: "3.000",
                is_expired: false,
            },
        ]);
        expect(rows).toHaveLength(1);
        expect(rows[0]).toMatchObject({
            product_name: "Milk",
            batch_number: "B1",
            expiry_date: "2026-09-20",
            quantity: "3.000",
            is_expired: false,
        });
    });

    it("treats [] as an empty list", () => {
        expect(parseExpiringBatchesPayload([])).toEqual([]);
    });

    it("does not invent rows from a non-array payload", () => {
        expect(parseExpiringBatchesPayload(undefined)).toEqual([]);
        expect(parseExpiringBatchesPayload(null)).toEqual([]);
        expect(parseExpiringBatchesPayload({ results: [{ product_name: "Nope" }] })).toEqual([]);
    });
});

describe("getExpiredBadgeLabel", () => {
    it("returns Expired only when is_expired === true", () => {
        expect(getExpiredBadgeLabel({ is_expired: true })).toBe("Expired");
    });

    it("does not invent a badge from expiry_date or other fields", () => {
        expect(getExpiredBadgeLabel({})).toBeNull();
        expect(getExpiredBadgeLabel({ is_expired: false })).toBeNull();
        expect(getExpiredBadgeLabel({ is_expired: null })).toBeNull();
        expect(getExpiredBadgeLabel({ expiry_date: "2000-01-01", quantity: 4 })).toBeNull();
    });
});

describe("auth-denied handling", () => {
    it("classifies 401 and 403 as hide-without-crash", () => {
        expect(isExpiringBatchesAuthDenied(401)).toBe(true);
        expect(isExpiringBatchesAuthDenied(403)).toBe(true);
        expect(isExpiringBatchesAuthDenied(404)).toBe(false);
        expect(isExpiringBatchesAuthDenied(500)).toBe(false);
        expect(isExpiringBatchesAuthDenied(undefined)).toBe(false);
    });

    it("reads axios-style response.status", () => {
        expect(getExpiringBatchesErrorStatus({ response: { status: 401 } })).toBe(401);
        expect(getExpiringBatchesErrorStatus({ response: { status: 403 } })).toBe(403);
        expect(getExpiringBatchesErrorStatus(new Error("network"))).toBeUndefined();
    });

    it("hides the panel on 401/403 instead of showing empty or rows", () => {
        const rows = [{ product_name: "Milk", batch_number: "B1" }];
        expect(resolveExpiringBatchesView({ errorStatus: 401, batches: rows })).toBe("hidden");
        expect(resolveExpiringBatchesView({ errorStatus: 403, batches: [] })).toBe("hidden");
        expect(resolveExpiringBatchesView({ errorStatus: 500, batches: rows })).toBe("hidden");
        expect(resolveExpiringBatchesView({ batches: [] })).toBe("empty");
        expect(resolveExpiringBatchesView({ batches: rows })).toBe("rows");
    });
});
