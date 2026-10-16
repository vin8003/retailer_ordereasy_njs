import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ProductGroupLabel } from "./ProductGroupLabel";

describe("ProductGroupLabel", () => {
    it("shows muted product group text when BE sent product_group", () => {
        const markup = renderToStaticMarkup(
            <ProductGroupLabel product={{ product_group: "Dairy" }} />
        );
        expect(markup).toContain("Dairy");
        expect(markup).toContain("Product group Dairy");
    });

    it("renders nothing when the field is omitted, null, or blank", () => {
        expect(renderToStaticMarkup(<ProductGroupLabel product={{}} />)).toBe("");
        expect(
            renderToStaticMarkup(<ProductGroupLabel product={{ product_group: null }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(<ProductGroupLabel product={{ product_group: "  " }} />)
        ).toBe("");
    });

    it("does not invent a label from brand_name or barcode", () => {
        const markup = renderToStaticMarkup(
            <ProductGroupLabel product={{ brand_name: "Amul", barcode: "8901234567890" }} />
        );
        expect(markup).toBe("");
    });
});
