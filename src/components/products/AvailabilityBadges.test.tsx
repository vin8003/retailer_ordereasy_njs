import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AvailabilityBadges } from "./AvailabilityBadges";

describe("AvailabilityBadges", () => {
    it("shows Unavailable when BE sent is_available false", () => {
        const markup = renderToStaticMarkup(
            <AvailabilityBadges product={{ is_available: false }} />
        );
        expect(markup).toContain("Unavailable");
        expect(markup).toContain("Unavailable product");
        expect(markup).not.toContain("Out of stock");
    });

    it("shows Out of stock when BE sent is_in_stock false", () => {
        const markup = renderToStaticMarkup(
            <AvailabilityBadges product={{ is_in_stock: false }} />
        );
        expect(markup).toContain("Out of stock");
        expect(markup).toContain("Out of stock product");
        expect(markup).not.toContain("Unavailable");
    });

    it("shows both badges when both flags are false", () => {
        const markup = renderToStaticMarkup(
            <AvailabilityBadges product={{ is_available: false, is_in_stock: false }} />
        );
        expect(markup).toContain("Unavailable");
        expect(markup).toContain("Out of stock");
    });

    it("renders nothing when flags are true, absent, or null", () => {
        expect(renderToStaticMarkup(<AvailabilityBadges product={{}} />)).toBe("");
        expect(
            renderToStaticMarkup(<AvailabilityBadges product={{ is_available: true, is_in_stock: true }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(
                <AvailabilityBadges product={{ is_available: null, is_in_stock: null }} />
            )
        ).toBe("");
    });
});
