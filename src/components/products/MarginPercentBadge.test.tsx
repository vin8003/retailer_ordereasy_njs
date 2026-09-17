import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MarginPercentBadge } from "./MarginPercentBadge";

describe("MarginPercentBadge", () => {
    it("shows compact percent text when BE sent margin_percent", () => {
        const markup = renderToStaticMarkup(
            <MarginPercentBadge product={{ margin_percent: 12.5 }} />
        );
        expect(markup).toContain("12.5%");
        expect(markup).toContain("Margin 12.5%");
    });

    it("renders nothing when the field is omitted (cashier / public)", () => {
        expect(renderToStaticMarkup(<MarginPercentBadge product={{}} />)).toBe("");
        expect(
            renderToStaticMarkup(<MarginPercentBadge product={{ margin_percent: null }} />)
        ).toBe("");
    });

    it("does not invent a badge from purchase_price alone", () => {
        const markup = renderToStaticMarkup(
            <MarginPercentBadge product={{ purchase_price: 80 }} />
        );
        expect(markup).toBe("");
    });
});
