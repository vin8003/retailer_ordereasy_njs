import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { StockTransferList } from "./StockTransferList";

describe("StockTransferList", () => {
    it("shows muted godown_name on table and card surfaces when BE sent it", () => {
        const markup = renderToStaticMarkup(
            <StockTransferList
                items={[
                    {
                        id: 1,
                        product_name: "Atta 10kg",
                        quantity: 4,
                        status: "in_transit",
                        godown_name: "Main Godown",
                    },
                ]}
            />
        );
        expect(markup).toContain("hidden md:block");
        expect(markup).toContain("md:hidden");
        expect(markup).toContain("Atta 10kg");
        expect((markup.match(/Godown Main Godown/g) ?? []).length).toBeGreaterThanOrEqual(2);
        expect(markup).toContain("text-muted-foreground");
    });

    it("hides godown text when it is omitted, null, or blank and does not invent it", () => {
        const blank = renderToStaticMarkup(
            <StockTransferList
                items={[
                    {
                        id: 2,
                        product_name: "Rice 5kg",
                        quantity: 1,
                        status: "received",
                        godown_name: null,
                    },
                    {
                        id: 3,
                        product_name: "Oil 1L",
                        quantity: 3,
                        status: "shipped",
                        godown_name: "   ",
                    },
                    {
                        id: 4,
                        product_name: "Sugar 1kg",
                        quantity: 2,
                        status: "in_transit",
                        from_godown_name: "From A",
                        to_godown_name: "To B",
                        godown: { name: "Nested Store" },
                    },
                ]}
            />
        );
        expect(blank).toContain("Rice 5kg");
        expect(blank).toContain("Oil 1L");
        expect(blank).toContain("Sugar 1kg");
        expect(blank).not.toContain("Godown ");
        expect(blank).not.toContain("From A");
        expect(blank).not.toContain("To B");
        expect(blank).not.toContain("Nested Store");
    });
});
