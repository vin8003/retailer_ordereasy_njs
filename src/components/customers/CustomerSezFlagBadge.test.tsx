import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CustomerSezFlagBadge } from "./CustomerSezFlagBadge";

describe("CustomerSezFlagBadge", () => {
    it("shows SEZ text when BE sent sez_flag true", () => {
        const markup = renderToStaticMarkup(
            <CustomerSezFlagBadge customer={{ sez_flag: true }} />
        );
        expect(markup).toContain("SEZ");
        expect(markup).toContain("SEZ customer");
    });

    it("renders nothing when sez_flag is false, absent, or null", () => {
        expect(renderToStaticMarkup(<CustomerSezFlagBadge customer={{}} />)).toBe("");
        expect(
            renderToStaticMarkup(<CustomerSezFlagBadge customer={{ sez_flag: false }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(<CustomerSezFlagBadge customer={{ sez_flag: null }} />)
        ).toBe("");
    });

    it("does not invent a badge from gstin, notes, is_sez, or other fields", () => {
        const markup = renderToStaticMarkup(
            <CustomerSezFlagBadge
                customer={{
                    gstin: "29ABCDE1234F1Z5",
                    gst_number: "29ABCDE1234F1Z5",
                    notes: "SEZ buyer",
                    is_blacklisted: false,
                    customer_name: "Ravi",
                    is_sez: true,
                    sez: true,
                }}
            />
        );
        expect(markup).toBe("");
    });
});
