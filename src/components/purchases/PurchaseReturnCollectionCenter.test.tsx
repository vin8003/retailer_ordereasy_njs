import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PurchaseReturnCollectionCenter } from "./PurchaseReturnCollectionCenter";

describe("PurchaseReturnCollectionCenter", () => {
    it("shows collection center text when BE sent collection_center", () => {
        const markup = renderToStaticMarkup(
            <PurchaseReturnCollectionCenter returnRecord={{ collection_center: "North Hub" }} />
        );
        expect(markup).toContain("North Hub");
        expect(markup).toContain("Collection center North Hub");
    });

    it("renders nothing when the field is omitted, null, or blank", () => {
        expect(renderToStaticMarkup(<PurchaseReturnCollectionCenter returnRecord={{}} />)).toBe("");
        expect(
            renderToStaticMarkup(
                <PurchaseReturnCollectionCenter returnRecord={{ collection_center: null }} />
            )
        ).toBe("");
        expect(
            renderToStaticMarkup(
                <PurchaseReturnCollectionCenter returnRecord={{ collection_center: "" }} />
            )
        ).toBe("");
        expect(
            renderToStaticMarkup(
                <PurchaseReturnCollectionCenter returnRecord={{ collection_center: "   " }} />
            )
        ).toBe("");
    });

    it("does not invent a label from notes, warehouse, or nested collection", () => {
        const markup = renderToStaticMarkup(
            <PurchaseReturnCollectionCenter
                returnRecord={{
                    notes: "Damaged carton",
                    warehouse: "Main Depot",
                    warehouse_name: "Main Depot",
                    depot: "West",
                    collection_center_name: "Hidden Hub",
                    collection: { name: "Nested Hub" },
                    supplier_name: "ABC Foods",
                    invoice_number: "INV-44",
                    return_number: "RET-9",
                }}
            />
        );
        expect(markup).toBe("");
        expect(markup).not.toContain("Damaged carton");
        expect(markup).not.toContain("Hidden Hub");
    });
});
