import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SalesReturnList, type SalesReturnListItem } from "./SalesReturnList";

const withCn: SalesReturnListItem = {
    id: 12,
    return_number: "SRET-12",
    order_number: "OE-1001",
    customer_name: "Ravi",
    refund_amount: 120,
    reason: "Damaged product",
    notes: "Opened pack, customer declined",
    created_at: "2026-09-18T10:00:00.000Z",
    cn_number: "CN-1001",
};

const withoutCn: SalesReturnListItem = {
    id: 13,
    return_number: "SRET-13",
    order_number: "OE-1002",
    customer_name: "Meera",
    refund_amount: 80,
    reason: "Changed mind",
    notes: "Keep this notes text off the list",
    created_at: "2026-09-18T11:00:00.000Z",
};

describe("SalesReturnList", () => {
    it("shows cn_number on dummy rows when BE sent it", () => {
        const markup = renderToStaticMarkup(<SalesReturnList returns={[withCn]} />);
        expect(markup).toContain("hidden md:block");
        expect(markup).toContain("block md:hidden");
        expect(markup).toContain("SRET-12");
        expect((markup.match(/CN CN-1001/g) ?? []).length).toBeGreaterThanOrEqual(2);
        expect(markup).toContain("Against OE-1001");
    });

    it("hides the CN line when cn_number is missing and does not invent from notes or reason", () => {
        const markup = renderToStaticMarkup(<SalesReturnList returns={[withoutCn]} />);
        expect(markup).toContain("SRET-13");
        expect(markup).not.toContain("CN ");
        expect(markup).not.toContain("Changed mind");
        expect(markup).not.toContain("Keep this notes text off the list");
        expect(markup).not.toContain("Opened pack");
    });

    it("shows cn_number only on the dummy row that has it", () => {
        const markup = renderToStaticMarkup(
            <SalesReturnList returns={[withCn, withoutCn]} />
        );
        expect(markup).toContain("CN CN-1001");
        expect(markup).toContain("SRET-12");
        expect(markup).toContain("SRET-13");
        expect(markup).not.toContain("Keep this notes text off the list");
        expect((markup.match(/CN CN-1001/g) ?? []).length).toBeGreaterThanOrEqual(2);
    });

    it("does not invent cn_number from nested credit_note or return_number", () => {
        const markup = renderToStaticMarkup(
            <SalesReturnList
                returns={[
                    {
                        ...withoutCn,
                        return_number: "SRET-99",
                        credit_note: { cn_number: "CN-NESTED" },
                        credit_note_id: 77,
                    },
                ]}
            />
        );
        expect(markup).toContain("SRET-99");
        expect(markup).not.toContain("CN-NESTED");
        expect(markup).not.toContain("CN 77");
    });
});
