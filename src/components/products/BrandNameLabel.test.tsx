import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BrandNameLabel } from "./BrandNameLabel";

describe("BrandNameLabel", () => {
    it("shows muted brand text when BE sent brand_name", () => {
        const markup = renderToStaticMarkup(
            <BrandNameLabel product={{ brand_name: "Amul" }} />
        );
        expect(markup).toContain("Amul");
        expect(markup).toContain("Brand Amul");
    });

    it("renders nothing when the field is omitted, null, or blank", () => {
        expect(renderToStaticMarkup(<BrandNameLabel product={{}} />)).toBe("");
        expect(
            renderToStaticMarkup(<BrandNameLabel product={{ brand_name: null }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(<BrandNameLabel product={{ brand_name: "  " }} />)
        ).toBe("");
    });

    it("does not invent a label from nested brand.name", () => {
        const markup = renderToStaticMarkup(
            <BrandNameLabel product={{ brand: { name: "Hidden Brand" } }} />
        );
        expect(markup).toBe("");
    });
});
