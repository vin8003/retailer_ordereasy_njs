import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SalesReturnDetailNotes } from "./SalesReturnDetailNotes";

describe("SalesReturnDetailNotes", () => {
    it("shows notes text when BE sent notes", () => {
        const markup = renderToStaticMarkup(
            <SalesReturnDetailNotes salesReturn={{ notes: "Damaged on delivery" }} />
        );
        expect(markup).toContain("Damaged on delivery");
        expect(markup).toContain("Notes Damaged on delivery");
    });

    it("renders nothing when notes is omitted, null, or blank", () => {
        expect(renderToStaticMarkup(<SalesReturnDetailNotes salesReturn={{}} />)).toBe("");
        expect(
            renderToStaticMarkup(<SalesReturnDetailNotes salesReturn={{ notes: null }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(<SalesReturnDetailNotes salesReturn={{ notes: "  " }} />)
        ).toBe("");
    });

    it("does not invent notes from reason, order_number, or customer_name", () => {
        const markup = renderToStaticMarkup(
            <SalesReturnDetailNotes
                salesReturn={{
                    reason: "Damaged product",
                    order_number: "OE-1001",
                    customer_name: "Ravi",
                    return_number: "SRET-12",
                    refund_payment_mode: "cash",
                }}
            />
        );
        expect(markup).toBe("");
    });
});
