import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CustomerListAreaName } from "./CustomerListAreaName";

describe("CustomerListAreaName", () => {
    it("shows muted area text when BE sent area_name", () => {
        const markup = renderToStaticMarkup(
            <CustomerListAreaName customer={{ area_name: "Sector 21" }} />
        );
        expect(markup).toContain("Sector 21");
        expect(markup).toContain("Area Sector 21");
        expect(markup).not.toContain("ordereasy.win");
    });

    it("renders nothing when the field is omitted, null, or blank", () => {
        expect(renderToStaticMarkup(<CustomerListAreaName customer={{}} />)).toBe("");
        expect(
            renderToStaticMarkup(<CustomerListAreaName customer={{ area_name: null }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(<CustomerListAreaName customer={{ area_name: "" }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(<CustomerListAreaName customer={{ area_name: "   " }} />)
        ).toBe("");
    });

    it("does not invent a label from address, city, locality, area, or area_id", () => {
        const markup = renderToStaticMarkup(
            <CustomerListAreaName
                customer={{
                    address: "12 Dummy Street",
                    city: "Mumbai",
                    locality: "Bandra",
                    area: { name: "Hidden Area" },
                    area_id: 99,
                }}
            />
        );
        expect(markup).toBe("");
    });

    it("does not invent a label from OE-306 email or credit scalars", () => {
        const markup = renderToStaticMarkup(
            <CustomerListAreaName
                customer={{
                    email: "shop@example.com",
                    credit_limit: 10000,
                    credit_due_days: 15,
                }}
            />
        );
        expect(markup).toBe("");
    });
});
