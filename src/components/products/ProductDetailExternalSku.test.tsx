import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ProductDetailExternalSku } from "./ProductDetailExternalSku";

describe("ProductDetailExternalSku", () => {
    it("shows muted External SKU text when BE sent external_sku", () => {
        const markup = renderToStaticMarkup(
            <ProductDetailExternalSku product={{ external_sku: "AMZ-TOOR-1KG" }} />
        );
        expect(markup).toContain("AMZ-TOOR-1KG");
        expect(markup).toContain("External SKU AMZ-TOOR-1KG");
    });

    it("renders nothing when the field is omitted, null, or blank", () => {
        expect(renderToStaticMarkup(<ProductDetailExternalSku product={{}} />)).toBe("");
        expect(
            renderToStaticMarkup(<ProductDetailExternalSku product={{ external_sku: null }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(<ProductDetailExternalSku product={{ external_sku: "  " }} />)
        ).toBe("");
    });

    it("does not invent or render asin when BE sent only asin (noop)", () => {
        const markup = renderToStaticMarkup(
            <ProductDetailExternalSku
                product={{ asin: "B0DUMMYASIN1", barcode: "8901234567890", name: "Toor Dal 1kg" }}
            />
        );
        expect(markup).toBe("");
        expect(markup).not.toContain("B0DUMMYASIN1");
        expect(markup).not.toContain("asin");
    });

    it("still omits asin when both asin and external_sku are present", () => {
        const markup = renderToStaticMarkup(
            <ProductDetailExternalSku
                product={{ external_sku: "AMZ-TOOR-1KG", asin: "B0DUMMYASIN1" }}
            />
        );
        expect(markup).toContain("AMZ-TOOR-1KG");
        expect(markup).not.toContain("B0DUMMYASIN1");
        expect(markup).not.toContain("ASIN");
    });
});
