import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CustomerTerritoryLabel } from "./CustomerTerritoryLabel";

describe("CustomerTerritoryLabel", () => {
    it("shows muted territory text when BE sent territory", () => {
        const markup = renderToStaticMarkup(
            <CustomerTerritoryLabel customer={{ territory: "Jaipur West" }} />
        );
        expect(markup).toContain("Jaipur West");
        expect(markup).toContain("Territory Jaipur West");
    });

    it("renders nothing when territory is omitted, null, or blank", () => {
        expect(renderToStaticMarkup(<CustomerTerritoryLabel customer={{}} />)).toBe("");
        expect(
            renderToStaticMarkup(<CustomerTerritoryLabel customer={{ territory: null }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(<CustomerTerritoryLabel customer={{ territory: "  " }} />)
        ).toBe("");
    });

    it("does not invent territory from notes, nickname, name, phone, or email", () => {
        const markup = renderToStaticMarkup(
            <CustomerTerritoryLabel
                customer={{
                    notes: "Prefers morning delivery",
                    nickname: "Sharma Ji",
                    customer_name: "Ravi",
                    phone_number: "9999999999",
                    email: "ravi@example.com",
                }}
            />
        );
        expect(markup).toBe("");
        expect(markup).not.toContain("Prefers morning delivery");
    });
});
