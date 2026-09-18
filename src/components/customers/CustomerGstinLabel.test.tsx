import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CustomerGstinLabel } from "./CustomerGstinLabel";

describe("CustomerGstinLabel", () => {
    it("shows muted GSTIN text when BE sent gstin", () => {
        const markup = renderToStaticMarkup(
            <CustomerGstinLabel customer={{ gstin: "27AAPFU0939F1ZV" }} />
        );
        expect(markup).toContain("GSTIN 27AAPFU0939F1ZV");
        expect(markup).toContain("27AAPFU0939F1ZV");
    });

    it("renders nothing when gstin is omitted, null, or blank", () => {
        expect(renderToStaticMarkup(<CustomerGstinLabel customer={{}} />)).toBe("");
        expect(
            renderToStaticMarkup(<CustomerGstinLabel customer={{ gstin: null }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(<CustomerGstinLabel customer={{ gstin: "  " }} />)
        ).toBe("");
    });

    it("does not invent GSTIN from notes, gst_number, name, phone, email, or balance", () => {
        const markup = renderToStaticMarkup(
            <CustomerGstinLabel
                customer={{
                    notes: "Prefers morning delivery",
                    gst_number: "27AAPFU0939F1ZV",
                    customer_name: "Ravi",
                    phone_number: "9999999999",
                    email: "ravi@example.com",
                    current_balance: 2500,
                }}
            />
        );
        expect(markup).toBe("");
        expect(markup).not.toContain("Prefers morning delivery");
        expect(markup).not.toContain("27AAPFU0939F1ZV");
    });
});
