import { describe, expect, it } from "vitest";
import {
    getLastSupplierCostHint,
    lastSupplierCostsFromHttp,
    lastSupplierCostsPath,
    parseLastSupplierCostsPayload,
} from "./lastSupplierCost";

const formatInr = (value: number) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
        maximumFractionDigits: 2,
    }).format(value);

const payload = {
    product_id: 9,
    suppliers: [
        {
            supplier_id: 3,
            supplier_name: "ABC Foods",
            last_cost: 80,
            invoice_id: 11,
            invoice_date: "2026-09-01",
        },
        {
            supplier_id: 4,
            supplier_name: "Other Dist",
            last_cost: "12.50",
            invoice_id: 12,
            invoice_date: "2026-09-02",
        },
    ],
};

describe("parseLastSupplierCostsPayload", () => {
    it("keeps BE last-supplier rows when the payload is well-formed", () => {
        expect(parseLastSupplierCostsPayload(payload)).toEqual(payload);
        expect(parseLastSupplierCostsPayload({ product_id: 9, suppliers: [] })).toEqual({
            product_id: 9,
            suppliers: [],
        });
    });

    it("returns null for missing or non-object payloads", () => {
        expect(parseLastSupplierCostsPayload(undefined)).toBeNull();
        expect(parseLastSupplierCostsPayload(null)).toBeNull();
        expect(parseLastSupplierCostsPayload("nope")).toBeNull();
        expect(parseLastSupplierCostsPayload([])).toBeNull();
    });

    it("returns null when suppliers is missing or not a list — never invent rows", () => {
        expect(parseLastSupplierCostsPayload({ product_id: 9 })).toBeNull();
        expect(parseLastSupplierCostsPayload({ product_id: 9, suppliers: null })).toBeNull();
        expect(parseLastSupplierCostsPayload({ product_id: 9, suppliers: {} })).toBeNull();
    });
});

describe("getLastSupplierCostHint", () => {
    it("formats last_cost for the picked supplier, including 0", () => {
        expect(getLastSupplierCostHint(payload, 3)).toBe(`Last ${formatInr(80)}`);
        expect(getLastSupplierCostHint(payload, "4")).toBe(`Last ${formatInr(12.5)}`);
        expect(
            getLastSupplierCostHint(
                {
                    suppliers: [{ supplier_id: 3, last_cost: 0 }],
                },
                3
            )
        ).toBe(`Last ${formatInr(0)}`);
        expect(
            getLastSupplierCostHint(
                {
                    suppliers: [{ supplier_id: 3, last_cost: "0" }],
                },
                "3"
            )
        ).toBe(`Last ${formatInr(0)}`);
    });

    it("returns null when the picked supplier has no last_cost row", () => {
        expect(getLastSupplierCostHint(payload, 99)).toBeNull();
        expect(getLastSupplierCostHint({ suppliers: [] }, 3)).toBeNull();
        expect(getLastSupplierCostHint(null, 3)).toBeNull();
        expect(getLastSupplierCostHint(undefined, 3)).toBeNull();
    });

    it("returns null when product or supplier is not picked", () => {
        expect(getLastSupplierCostHint(payload, "")).toBeNull();
        expect(getLastSupplierCostHint(payload, null)).toBeNull();
        expect(getLastSupplierCostHint(payload, undefined)).toBeNull();
    });

    it("returns null when last_cost is omitted, null, blank, or non-numeric", () => {
        expect(
            getLastSupplierCostHint({ suppliers: [{ supplier_id: 3 }] }, 3)
        ).toBeNull();
        expect(
            getLastSupplierCostHint({ suppliers: [{ supplier_id: 3, last_cost: null }] }, 3)
        ).toBeNull();
        expect(
            getLastSupplierCostHint({ suppliers: [{ supplier_id: 3, last_cost: "" }] }, 3)
        ).toBeNull();
        expect(
            getLastSupplierCostHint({ suppliers: [{ supplier_id: 3, last_cost: "   " }] }, 3)
        ).toBeNull();
        expect(
            getLastSupplierCostHint({ suppliers: [{ supplier_id: 3, last_cost: "n/a" }] }, 3)
        ).toBeNull();
    });

    it("does not invent last_cost from purchase_price or selling price", () => {
        expect(
            getLastSupplierCostHint(
                {
                    purchase_price: 80,
                    price: 100,
                    suppliers: [{ supplier_id: 3, purchase_price: 80 }],
                },
                3
            )
        ).toBeNull();
    });
});

describe("lastSupplierCostsFromHttp", () => {
    it("parses a 200 payload and omits 403/404 — never invent from error bodies", () => {
        expect(lastSupplierCostsFromHttp(200, payload)).toEqual(payload);
        expect(lastSupplierCostsFromHttp(403, payload)).toBeNull();
        expect(lastSupplierCostsFromHttp(404, payload)).toBeNull();
        expect(lastSupplierCostsFromHttp(200, { purchase_price: 80 })).toBeNull();
    });
});

describe("lastSupplierCostsPath", () => {
    it("targets the OE-112 last-supplier-costs read", () => {
        expect(lastSupplierCostsPath(9)).toBe("/products/erp/products/9/last-supplier-costs/");
    });
});
