import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PurchaseDetailTdsAmount } from "./PurchaseDetailTdsAmount";

const formatInr = (value: number) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
        maximumFractionDigits: 2,
    }).format(value);

describe("PurchaseDetailTdsAmount", () => {
    it("shows TDS text when BE sent tds_amount", () => {
        const label = formatInr(250);
        const markup = renderToStaticMarkup(
            <PurchaseDetailTdsAmount invoice={{ tds_amount: 250 }} />
        );
        expect(markup).toContain(label);
        expect(markup).toContain(`TDS ${label}`);
    });

    it("renders nothing when tds_amount is omitted, null, or blank", () => {
        expect(renderToStaticMarkup(<PurchaseDetailTdsAmount invoice={{}} />)).toBe("");
        expect(
            renderToStaticMarkup(<PurchaseDetailTdsAmount invoice={{ tds_amount: null }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(<PurchaseDetailTdsAmount invoice={{ tds_amount: "  " }} />)
        ).toBe("");
    });

    it("does not invent TDS from totals, tax, or tds_percent", () => {
        const markup = renderToStaticMarkup(
            <PurchaseDetailTdsAmount
                invoice={{
                    total_amount: 10000,
                    paid_amount: 9000,
                    tax_amount: 1800,
                    gst_amount: 1800,
                    tds: 250,
                    tds_percent: 2,
                }}
            />
        );
        expect(markup).toBe("");
    });
});
