import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SALES_RETURN_NOTES_SNIPPET_MAX } from "@/utils/salesReturnListNotes";
import { SalesReturnList, type SalesReturnListItem } from "./SalesReturnList";

const withNotes: SalesReturnListItem = {
    id: 12,
    return_number: "SRET-12",
    order_number: "OE-1001",
    customer_name: "Ravi",
    refund_amount: 150,
    notes: "Opened pack, customer declined",
    created_at: "2026-09-18T10:00:00.000Z",
};

const withoutNotes: SalesReturnListItem = {
    id: 13,
    return_number: "SRET-13",
    order_number: "OE-1002",
    customer_name: "Meera",
    refund_amount: 80,
    reason: "Changed mind",
    created_at: "2026-09-18T11:00:00.000Z",
};

describe("SalesReturnList", () => {
    it("shows a notes snippet on dummy rows when BE sent notes", () => {
        const markup = renderToStaticMarkup(<SalesReturnList returns={[withNotes]} />);
        expect(markup).toContain("SRET-12");
        expect(markup).toContain("Opened pack, customer declined");
        expect(markup).toContain("Notes Opened pack, customer declined");
        expect(markup).toContain("Against OE-1001");
    });

    it("hides the notes line when notes is missing and does not invent from reason", () => {
        const markup = renderToStaticMarkup(<SalesReturnList returns={[withoutNotes]} />);
        expect(markup).toContain("SRET-13");
        expect(markup).not.toContain("Changed mind");
        expect(markup).not.toContain("Notes ");
    });

    it("clips a long dummy notes value to the list snippet", () => {
        const long = "z".repeat(SALES_RETURN_NOTES_SNIPPET_MAX + 20);
        const markup = renderToStaticMarkup(
            <SalesReturnList returns={[{ ...withNotes, notes: long }]} />
        );
        expect(markup).toContain(`${"z".repeat(SALES_RETURN_NOTES_SNIPPET_MAX)}…`);
        expect(markup).not.toContain(long);
    });

    it("shows notes only on the dummy row that has them", () => {
        const markup = renderToStaticMarkup(
            <SalesReturnList returns={[withNotes, withoutNotes]} />
        );
        expect(markup).toContain("Opened pack, customer declined");
        expect(markup).not.toContain("Changed mind");
        expect(markup).toContain("SRET-12");
        expect(markup).toContain("SRET-13");
    });
});
