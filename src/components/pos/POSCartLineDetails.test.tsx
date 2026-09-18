import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { POSCartLineDetails } from "./POSCartLineDetails";

describe("POSCartLineDetails", () => {
    it("shows the item name and muted brand when BE sent brand_name", () => {
        const markup = renderToStaticMarkup(
            <POSCartLineDetails item={{ name: "Full Cream Milk", brand_name: "Amul" }} />
        );
        expect(markup).toContain("Full Cream Milk");
        expect(markup).toContain("Amul");
        expect(markup).toContain("Brand Amul");
        expect(markup).toContain("text-muted-foreground");
    });

    it("hides brand when the field is omitted, null, or blank", () => {
        const omitted = renderToStaticMarkup(
            <POSCartLineDetails item={{ name: "Wheat Atta" }} />
        );
        expect(omitted).toContain("Wheat Atta");
        expect(omitted).not.toContain("Brand ");
        expect(omitted).not.toContain("text-muted-foreground");

        const empty = renderToStaticMarkup(
            <POSCartLineDetails item={{ name: "Wheat Atta", brand_name: "  " }} />
        );
        expect(empty).toContain("Wheat Atta");
        expect(empty).not.toContain("Brand ");

        const nulled = renderToStaticMarkup(
            <POSCartLineDetails item={{ name: "Wheat Atta", brand_name: null }} />
        );
        expect(nulled).not.toContain("Brand ");
    });

    it("does not invent a brand from nested brand.name", () => {
        const markup = renderToStaticMarkup(
            <POSCartLineDetails
                item={{ name: "Biscuits", brand: { name: "Hidden Brand" } }}
            />
        );
        expect(markup).toContain("Biscuits");
        expect(markup).not.toContain("Hidden Brand");
        expect(markup).not.toContain("Brand ");
    });

    it("still shows batch when present and does not require brand", () => {
        const markup = renderToStaticMarkup(
            <POSCartLineDetails
                item={{ name: "Rice", batch_name: "B-12", brand_name: null }}
            />
        );
        expect(markup).toContain("Rice");
        expect(markup).toContain("Batch: B-12");
        expect(markup).not.toContain("Brand ");
    });
});
