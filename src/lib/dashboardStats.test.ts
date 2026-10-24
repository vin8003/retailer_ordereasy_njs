import { describe, expect, it } from "vitest";
import { cashPercent, formatRupees, normalizeStats } from "./dashboardStats";

describe("normalizeStats", () => {
    it("turns the decimal strings of a fresh shop into numbers", () => {
        const stats = normalizeStats({ total_revenue: "0.00", cash_sales: "0.00", average_order_value: "0.00", recent_orders: [] });
        expect(stats.total_revenue).toBe(0);
        expect(stats.cash_sales).toBe(0);
        expect(stats.recent_reviews).toEqual([]);
    });
    it("copes with a missing or odd response", () => {
        expect(normalizeStats(undefined).total_orders).toBe(0);
        expect(normalizeStats({ total_orders: null, recent_orders: null }).recent_orders).toEqual([]);
    });
});

describe("cashPercent", () => {
    it("is 0 when nothing was sold, instead of a half-and-half bar", () => {
        expect(cashPercent({ cash_sales: 0, total_revenue: 0 })).toBe(0);
    });
    it("is the cash share of revenue", () => {
        expect(cashPercent({ cash_sales: 250, total_revenue: 1000 })).toBe(25);
    });
});

describe("formatRupees", () => {
    it("groups digits the Indian way", () => {
        expect(formatRupees(1234567)).toBe("₹12,34,567");
    });
});
