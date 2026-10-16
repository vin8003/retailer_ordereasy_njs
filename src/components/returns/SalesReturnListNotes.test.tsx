import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SALES_RETURN_NOTES_SNIPPET_MAX } from "@/utils/salesReturnListNotes";
import { SalesReturnListNotes } from "./SalesReturnListNotes";

describe("SalesReturnListNotes", () => {
    it("shows muted notes snippet when BE sent notes", () => {
        const markup = renderToStaticMarkup(
            <SalesReturnListNotes salesReturn={{ notes: "Wrong size" }} />
        );
        expect(markup).toContain("Wrong size");
        expect(markup).toContain("Notes Wrong size");
    });

    it("clips long notes in the list snippet", () => {
        const long = "y".repeat(SALES_RETURN_NOTES_SNIPPET_MAX + 8);
        const markup = renderToStaticMarkup(
            <SalesReturnListNotes salesReturn={{ notes: long }} />
        );
        expect(markup).toContain(`${"y".repeat(SALES_RETURN_NOTES_SNIPPET_MAX)}…`);
        expect(markup).not.toContain(long);
    });

    it("renders nothing when notes is omitted, null, or blank", () => {
        expect(renderToStaticMarkup(<SalesReturnListNotes salesReturn={{}} />)).toBe("");
        expect(
            renderToStaticMarkup(<SalesReturnListNotes salesReturn={{ notes: null }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(<SalesReturnListNotes salesReturn={{ notes: "  " }} />)
        ).toBe("");
    });

    it("does not invent notes from reason, order_number, or customer_name", () => {
        const markup = renderToStaticMarkup(
            <SalesReturnListNotes
                salesReturn={{
                    reason: "Damaged product",
                    order_number: "OE-1001",
                    customer_name: "Ravi",
                    return_number: "SRET-12",
                    refund_payment_mode: "upi",
                }}
            />
        );
        expect(markup).toBe("");
    });
});
