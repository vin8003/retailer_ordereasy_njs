import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const src = readFileSync(path.resolve(__dirname, "page.tsx"), "utf8");

describe("reports page low-stock count wiring", () => {
    it("shows ReportsLowStockCountLabel from daily-summary and does not fetch expiring-batches", () => {
        expect(src).toContain("ReportsLowStockCountLabel");
        expect(src).toContain("low_stock_count");
        expect(src).toContain("/products/erp/daily-sales-summary/");
        expect(src).not.toContain("expiring-batches");
        expect(src).not.toContain("pos/page");
        expect(src).not.toContain("ProductTable");
    });
});
