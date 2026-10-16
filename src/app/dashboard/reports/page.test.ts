import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const src = readFileSync(path.resolve(__dirname, "page.tsx"), "utf8");

describe("reports page OE-319 wiring", () => {
    it("mounts ExpiringBatchesPanel outside the daily-summary fetch", () => {
        expect(src).toContain("ExpiringBatchesPanel");
        expect(src).toContain("/products/erp/daily-sales-summary/");
        expect(src).not.toMatch(/expiring-batches/);
        expect(src).not.toContain("pos/page");
        expect(src).not.toContain("ProductTable");
        expect(src).not.toContain("VirtualProductList");
        expect(src).not.toContain("OrderTable");
    });
});
