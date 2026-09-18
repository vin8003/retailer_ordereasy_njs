import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PurchaseReturnListIdentity } from "./PurchaseReturnListIdentity";

const baseReturn = {
    id: 77,
    return_number: "RET-77",
    invoice_number: "INV-44",
};

describe("PurchaseReturnListIdentity", () => {
    it("shows return number, against-invoice, and lr_number when BE sent it", () => {
        const markup = renderToStaticMarkup(
            <PurchaseReturnListIdentity item={{ ...baseReturn, lr_number: "LR-DUMMY-1001" }} />
        );
        expect(markup).toContain("RET-77");
        expect(markup).toContain("Against INV-44");
        expect(markup).toContain("LR-DUMMY-1001");
        expect(markup).toContain("LR LR-DUMMY-1001");
    });

    it("omits LR text when lr_number is missing, null, or blank", () => {
        const omitted = renderToStaticMarkup(<PurchaseReturnListIdentity item={baseReturn} />);
        expect(omitted).toContain("RET-77");
        expect(omitted).not.toContain("LR ");
        expect(omitted).not.toContain("lr_number");

        const blank = renderToStaticMarkup(
            <PurchaseReturnListIdentity item={{ ...baseReturn, lr_number: "   " }} />
        );
        expect(blank).not.toContain("LR ");

        const nulled = renderToStaticMarkup(
            <PurchaseReturnListIdentity item={{ ...baseReturn, lr_number: null }} />
        );
        expect(nulled).not.toContain("LR ");
    });

    it("does not invent lr_number from other return fields", () => {
        const markup = renderToStaticMarkup(
            <PurchaseReturnListIdentity
                item={{
                    ...baseReturn,
                    notes: "send via transporter",
                    tracking_number: "TRK-9",
                    supplier_name: "Dummy Distributors",
                }}
            />
        );
        expect(markup).toContain("RET-77");
        expect(markup).not.toContain("TRK-9");
        expect(markup).not.toContain("send via transporter");
        expect(markup).not.toContain("LR ");
    });
});
