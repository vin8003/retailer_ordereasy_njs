import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SalesReturnTransporterName } from "./SalesReturnTransporterName";

describe("SalesReturnTransporterName", () => {
    it("shows transporter text when BE sent transporter_name", () => {
        const markup = renderToStaticMarkup(
            <SalesReturnTransporterName
                salesReturn={{ transporter_name: "Dummy Express Logistics" }}
            />
        );
        expect(markup).toContain("Dummy Express Logistics");
        expect(markup).toContain("Transporter Dummy Express Logistics");
    });

    it("renders nothing when transporter_name is omitted, null, or blank", () => {
        expect(renderToStaticMarkup(<SalesReturnTransporterName salesReturn={{}} />)).toBe(
            ""
        );
        expect(
            renderToStaticMarkup(
                <SalesReturnTransporterName salesReturn={{ transporter_name: null }} />
            )
        ).toBe("");
        expect(
            renderToStaticMarkup(
                <SalesReturnTransporterName salesReturn={{ transporter_name: "  " }} />
            )
        ).toBe("");
    });

    it("does not invent transporter_name from nested transporter, notes, or reason", () => {
        const markup = renderToStaticMarkup(
            <SalesReturnTransporterName
                salesReturn={{
                    transporter: { name: "Hidden Fleet" },
                    driver_name: "Ravi",
                    courier_name: "Dummy Courier",
                    notes: "Pickup after 4pm",
                    reason: "Damaged product",
                    order_number: "OE-1001",
                    customer_name: "Asha",
                    return_number: "SRET-12",
                }}
            />
        );
        expect(markup).toBe("");
        expect(markup).not.toContain("Pickup after 4pm");
        expect(markup).not.toContain("Notes");
    });
});
