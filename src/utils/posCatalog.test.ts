import { describe, expect, it } from "vitest";
import {
    POS_SEARCH_MAX,
    POS_SEARCH_STEP,
    isUnknownBarcodeCandidate,
    nextSearchLimit,
    parseScanInput,
    readPage,
    rowsWithBarcode,
} from "./posCatalog";

describe("parseScanInput", () => {
    it("reads a plain code", () => {
        expect(parseScanInput(" 8901234567890 ")).toEqual({ code: "8901234567890", multiplier: 1 });
    });

    it("reads barcode*qty", () => {
        expect(parseScanInput("8901*12")).toEqual({ code: "8901", multiplier: 12 });
    });

    it("keeps the multiplier between 1 and 999", () => {
        expect(parseScanInput("8901*0").multiplier).toBe(1);
        expect(parseScanInput("8901*abc").multiplier).toBe(1);
        expect(parseScanInput("8901*5000").multiplier).toBe(999);
    });
});

describe("rowsWithBarcode", () => {
    const rows = [
        { id: 1, barcode: "111" },
        { id: 2, barcode: "222", batches: [{ barcode: "333" }, { barcode: null }] },
        { id: 3, barcode: null, batches: null },
    ];

    it("matches the product barcode exactly", () => {
        expect(rowsWithBarcode(rows, "111").map((r) => r.id)).toEqual([1]);
        expect(rowsWithBarcode(rows, "11")).toEqual([]);
    });

    it("matches a batch barcode", () => {
        expect(rowsWithBarcode(rows, "333").map((r) => r.id)).toEqual([2]);
    });

    it("matches nothing for an empty code", () => {
        expect(rowsWithBarcode(rows, "")).toEqual([]);
    });
});

describe("nextSearchLimit", () => {
    it("asks for another step while the last answer was full", () => {
        expect(nextSearchLimit(POS_SEARCH_STEP, POS_SEARCH_STEP)).toBe(POS_SEARCH_STEP * 2);
    });

    it("stops when the server returned fewer rows than asked", () => {
        expect(nextSearchLimit(POS_SEARCH_STEP, POS_SEARCH_STEP - 1)).toBeNull();
    });

    it("never asks past the server cap", () => {
        expect(nextSearchLimit(POS_SEARCH_MAX - 10, POS_SEARCH_MAX - 10)).toBe(POS_SEARCH_MAX);
        expect(nextSearchLimit(POS_SEARCH_MAX, POS_SEARCH_MAX)).toBeNull();
    });
});

describe("isUnknownBarcodeCandidate", () => {
    it("opens Quick Add for numbers and long codes, not short words", () => {
        expect(isUnknownBarcodeCandidate("12")).toBe(true);
        expect(isUnknownBarcodeCandidate("ABCDEFG")).toBe(true);
        expect(isUnknownBarcodeCandidate("atta")).toBe(false);
    });
});

describe("readPage", () => {
    it("reads a DRF page and whether another follows", () => {
        expect(readPage({ results: [{ id: 1 }], next: "http://x/?page=2" })).toEqual({ rows: [{ id: 1 }], hasMore: true });
        expect(readPage({ results: [], next: null })).toEqual({ rows: [], hasMore: false });
    });

    it("reads a flat list as one page", () => {
        expect(readPage([{ id: 1 }])).toEqual({ rows: [{ id: 1 }], hasMore: false });
    });

    it("survives an unexpected body", () => {
        expect(readPage(undefined)).toEqual({ rows: [], hasMore: false });
    });
});
