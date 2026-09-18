import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PurchaseReturnDetailNotes } from "./PurchaseReturnDetailNotes";

describe("PurchaseReturnDetailNotes", () => {
    it("shows notes text when BE sent notes", () => {
        const markup = renderToStaticMarkup(
            <PurchaseReturnDetailNotes purchaseReturn={{ notes: "Damaged carton" }} />
        );
        expect(markup).toContain("Damaged carton");
        expect(markup).toContain("Notes Damaged carton");
    });

    it("renders nothing when notes is omitted, null, or blank", () => {
        expect(renderToStaticMarkup(<PurchaseReturnDetailNotes purchaseReturn={{}} />)).toBe("");
        expect(
            renderToStaticMarkup(<PurchaseReturnDetailNotes purchaseReturn={{ notes: null }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(<PurchaseReturnDetailNotes purchaseReturn={{ notes: "  " }} />)
        ).toBe("");
    });

    it("does not invent notes from return_number, invoice_number, or supplier_name", () => {
        const markup = renderToStaticMarkup(
            <PurchaseReturnDetailNotes
                purchaseReturn={{
                    return_number: "RET-12",
                    invoice_number: "INV-44",
                    supplier_name: "ABC Foods",
                }}
            />
        );
        expect(markup).toBe("");
    });
});
