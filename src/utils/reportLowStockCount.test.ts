import { describe, expect, it } from "vitest";
import { getLowStockCountLabel } from "./reportLowStockCount";

describe("getLowStockCountLabel", () => {
    it("returns a compact label when BE sent low_stock_count, including 0", () => {
        expect(getLowStockCountLabel({ low_stock_count: 4 })).toBe("4 low-stock");
        expect(getLowStockCountLabel({ low_stock_count: "7" })).toBe("7 low-stock");
        expect(getLowStockCountLabel({ low_stock_count: 1 })).toBe("1 low-stock");
        expect(getLowStockCountLabel({ low_stock_count: 0 })).toBe("0 low-stock");
        expect(getLowStockCountLabel({ low_stock_count: "0" })).toBe("0 low-stock");
        expect(getLowStockCountLabel({ low_stock_count: 2.5 })).toBe("2.5 low-stock");
    });

    it("returns null when low_stock_count is omitted, null, or blank", () => {
        expect(getLowStockCountLabel({})).toBeNull();
        expect(getLowStockCountLabel({ low_stock_count: undefined })).toBeNull();
        expect(getLowStockCountLabel({ low_stock_count: null })).toBeNull();
        expect(getLowStockCountLabel({ low_stock_count: "" })).toBeNull();
        expect(getLowStockCountLabel({ low_stock_count: "   " })).toBeNull();
    });

    it("does not invent low_stock_count from order_count or total_sales", () => {
        expect(
            getLowStockCountLabel({
                order_count: 12,
                total_sales: 5400,
                low_stock_count: null,
            })
        ).toBeNull();
    });

    it("returns null for non-numeric present values", () => {
        expect(getLowStockCountLabel({ low_stock_count: "n/a" })).toBeNull();
    });
});
