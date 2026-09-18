import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BarcodeLabel } from "./BarcodeLabel";

describe("BarcodeLabel", () => {
    it("shows compact barcode text when BE sent barcode", () => {
        const markup = renderToStaticMarkup(
            <BarcodeLabel product={{ barcode: "8901234567890" }} />
        );
        expect(markup).toContain("8901234567890");
        expect(markup).toContain("Barcode 8901234567890");
    });

    it("renders nothing when the field is omitted, null, or blank", () => {
        expect(renderToStaticMarkup(<BarcodeLabel product={{}} />)).toBe("");
        expect(
            renderToStaticMarkup(<BarcodeLabel product={{ barcode: null }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(<BarcodeLabel product={{ barcode: "" }} />)
        ).toBe("");
    });
});
