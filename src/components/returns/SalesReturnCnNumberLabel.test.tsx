import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SalesReturnCnNumberLabel } from "./SalesReturnCnNumberLabel";

describe("SalesReturnCnNumberLabel", () => {
    it("shows muted CN text when BE sent cn_number", () => {
        const markup = renderToStaticMarkup(
            <SalesReturnCnNumberLabel salesReturn={{ cn_number: "CN-1001" }} />
        );
        expect(markup).toContain("CN CN-1001");
        expect(markup).toContain("Credit note CN-1001");
    });

    it("renders nothing when the field is omitted, null, or blank", () => {
        expect(renderToStaticMarkup(<SalesReturnCnNumberLabel salesReturn={{}} />)).toBe("");
        expect(
            renderToStaticMarkup(<SalesReturnCnNumberLabel salesReturn={{ cn_number: null }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(<SalesReturnCnNumberLabel salesReturn={{ cn_number: "" }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(<SalesReturnCnNumberLabel salesReturn={{ cn_number: "   " }} />)
        ).toBe("");
    });

    it("does not invent a label from return_number, notes, reason, or nested credit_note", () => {
        const markup = renderToStaticMarkup(
            <SalesReturnCnNumberLabel
                salesReturn={{
                    id: 99,
                    return_number: "SRET-12",
                    order_number: "OE-1001",
                    notes: "Opened pack",
                    reason: "Damaged product",
                    credit_note: { cn_number: "CN-NESTED" },
                }}
            />
        );
        expect(markup).toBe("");
    });
});
