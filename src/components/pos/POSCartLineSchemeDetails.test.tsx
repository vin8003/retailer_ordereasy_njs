import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { POSCartLineSchemeDetails } from "./POSCartLineSchemeDetails";

describe("POSCartLineSchemeDetails", () => {
    it("shows the item name and muted scheme when BE sent scheme_name", () => {
        const markup = renderToStaticMarkup(
            <POSCartLineSchemeDetails
                item={{ name: "Full Cream Milk", scheme_name: "Buy 1 Get 1" }}
            />
        );
        expect(markup).toContain("Full Cream Milk");
        expect(markup).toContain("Buy 1 Get 1");
        expect(markup).toContain("Scheme Buy 1 Get 1");
        expect(markup).toContain("text-muted-foreground");
    });

    it("hides scheme when the field is omitted, null, or blank", () => {
        const omitted = renderToStaticMarkup(
            <POSCartLineSchemeDetails item={{ name: "Wheat Atta" }} />
        );
        expect(omitted).toContain("Wheat Atta");
        expect(omitted).not.toContain("Scheme ");
        expect(omitted).not.toContain("text-muted-foreground");

        const empty = renderToStaticMarkup(
            <POSCartLineSchemeDetails item={{ name: "Wheat Atta", scheme_name: "  " }} />
        );
        expect(empty).toContain("Wheat Atta");
        expect(empty).not.toContain("Scheme ");

        const nulled = renderToStaticMarkup(
            <POSCartLineSchemeDetails item={{ name: "Wheat Atta", scheme_name: null }} />
        );
        expect(nulled).not.toContain("Scheme ");
    });

    it("does not invent a scheme from nested scheme.name, offer_name, or brand", () => {
        const markup = renderToStaticMarkup(
            <POSCartLineSchemeDetails
                item={{
                    name: "Biscuits",
                    brand_name: "Hidden Brand",
                    offer_name: "Hidden Offer",
                    scheme: { name: "Hidden Scheme" },
                }}
            />
        );
        expect(markup).toContain("Biscuits");
        expect(markup).not.toContain("Hidden Scheme");
        expect(markup).not.toContain("Hidden Offer");
        expect(markup).not.toContain("Hidden Brand");
        expect(markup).not.toContain("Scheme ");
    });

    it("still shows batch when present and does not require scheme", () => {
        const markup = renderToStaticMarkup(
            <POSCartLineSchemeDetails
                item={{ name: "Rice", batch_name: "B-12", scheme_name: null }}
            />
        );
        expect(markup).toContain("Rice");
        expect(markup).toContain("Batch: B-12");
        expect(markup).not.toContain("Scheme ");
    });
});
