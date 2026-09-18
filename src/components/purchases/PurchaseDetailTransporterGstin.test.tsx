import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PurchaseDetailTransporterGstin } from "./PurchaseDetailTransporterGstin";

describe("PurchaseDetailTransporterGstin", () => {
    it("shows transporter GSTIN when BE sent transporter_gstin", () => {
        const markup = renderToStaticMarkup(
            <PurchaseDetailTransporterGstin invoice={{ transporter_gstin: "27AAPFU0939F1ZV" }} />
        );
        expect(markup).toContain("27AAPFU0939F1ZV");
        expect(markup).toContain("Transporter GSTIN 27AAPFU0939F1ZV");
    });

    it("renders nothing when transporter_gstin is omitted, null, or blank", () => {
        expect(renderToStaticMarkup(<PurchaseDetailTransporterGstin invoice={{}} />)).toBe("");
        expect(
            renderToStaticMarkup(
                <PurchaseDetailTransporterGstin invoice={{ transporter_gstin: null }} />
            )
        ).toBe("");
        expect(
            renderToStaticMarkup(
                <PurchaseDetailTransporterGstin invoice={{ transporter_gstin: "  " }} />
            )
        ).toBe("");
    });

    it("does not invent transporter GSTIN from invoice_number, notes, supplier, or other transport fields", () => {
        const markup = renderToStaticMarkup(
            <PurchaseDetailTransporterGstin
                invoice={{
                    invoice_number: "INV-44",
                    notes: "Express delivery",
                    supplier_name: "ABC Foods",
                    gst_number: "27AAPFU0939F1ZV",
                    vehicle_number: "MH12AB1234",
                    transporter_name: "Blue Dart",
                    transporter_id: "TR-9",
                }}
            />
        );
        expect(markup).toBe("");
    });
});
