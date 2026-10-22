import { describe, expect, it } from "vitest";
import { parseSalesReturnListPage, salesReturnUnitCount } from "./salesReturnList";

describe("parseSalesReturnListPage (OE-336)", () => {
    it("reads the paginated shape and reports more pages", () => {
        const page = parseSalesReturnListPage({
            count: 21,
            next: "http://x/api/returns/sales/?page=2",
            results: [{ id: 1, notes: "Refunded at counter" }, { id: 2 }],
        });
        expect(page.rows.map((r) => r.id)).toEqual([1, 2]);
        expect(page.hasMore).toBe(true);
    });

    it("reads a bare array with no more pages", () => {
        expect(parseSalesReturnListPage([{ id: 3 }])).toEqual({ rows: [{ id: 3 }], hasMore: false });
    });

    it("drops rows without a numeric id and survives odd payloads", () => {
        expect(parseSalesReturnListPage({ results: [{ id: "4" }, null, { id: 5 }], next: null }).rows).toEqual([{ id: 5 }]);
        expect(parseSalesReturnListPage(null)).toEqual({ rows: [], hasMore: false });
        expect(parseSalesReturnListPage({ detail: "Not found." })).toEqual({ rows: [], hasMore: false });
    });
});

describe("salesReturnUnitCount", () => {
    it("sums decimal quantities and ignores junk", () => {
        expect(salesReturnUnitCount({ id: 1, items: [{ quantity: "1.5" }, { quantity: 2 }, { quantity: null }] })).toBe(3.5);
        expect(salesReturnUnitCount({ id: 1 })).toBe(0);
    });
});
