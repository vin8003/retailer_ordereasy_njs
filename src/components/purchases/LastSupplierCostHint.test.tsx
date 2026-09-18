import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LastSupplierCostHint } from "./LastSupplierCostHint";

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
        },
    ],
};

describe("LastSupplierCostHint", () => {
    it("shows a muted last-cost hint when BE sent last_cost for the picked supplier", () => {
        const markup = renderToStaticMarkup(
            <LastSupplierCostHint payload={payload} supplierId={3} />
        );
        expect(markup).toContain(`Last ${formatInr(80)}`);
        expect(markup).toContain(`Last supplier cost ${formatInr(80)}`);
    });

    it("renders nothing when last_cost is missing for the picked supplier", () => {
        expect(
            renderToStaticMarkup(<LastSupplierCostHint payload={payload} supplierId={99} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(
                <LastSupplierCostHint payload={{ suppliers: [] }} supplierId={3} />
            )
        ).toBe("");
        expect(
            renderToStaticMarkup(<LastSupplierCostHint payload={null} supplierId={3} />)
        ).toBe("");
    });

    it("renders nothing when supplier is not picked", () => {
        expect(
            renderToStaticMarkup(<LastSupplierCostHint payload={payload} supplierId="" />)
        ).toBe("");
    });

    it("does not invent a hint from purchase_price", () => {
        const markup = renderToStaticMarkup(
            <LastSupplierCostHint
                payload={{ purchase_price: 80, suppliers: [{ supplier_id: 3 }] }}
                supplierId={3}
            />
        );
        expect(markup).toBe("");
    });
});
