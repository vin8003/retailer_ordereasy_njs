import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SeasonalBadge } from "./SeasonalBadge";

describe("SeasonalBadge", () => {
    it("shows Seasonal text when BE sent is_seasonal true", () => {
        const markup = renderToStaticMarkup(
            <SeasonalBadge product={{ is_seasonal: true }} />
        );
        expect(markup).toContain("Seasonal");
        expect(markup).toContain("Seasonal product");
    });

    it("renders nothing when is_seasonal is false, absent, or null", () => {
        expect(renderToStaticMarkup(<SeasonalBadge product={{}} />)).toBe("");
        expect(
            renderToStaticMarkup(<SeasonalBadge product={{ is_seasonal: false }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(<SeasonalBadge product={{ is_seasonal: null }} />)
        ).toBe("");
    });
});
