import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CustomerMappingNotes } from "./CustomerMappingNotes";

describe("CustomerMappingNotes", () => {
    it("shows muted mapping notes when BE sent notes", () => {
        const markup = renderToStaticMarkup(
            <CustomerMappingNotes customer={{ notes: "Prefers morning delivery" }} />
        );
        expect(markup).toContain("Prefers morning delivery");
        expect(markup).toContain("Notes Prefers morning delivery");
    });

    it("renders nothing when notes is omitted, null, or blank", () => {
        expect(renderToStaticMarkup(<CustomerMappingNotes customer={{}} />)).toBe("");
        expect(
            renderToStaticMarkup(<CustomerMappingNotes customer={{ notes: null }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(<CustomerMappingNotes customer={{ notes: "  " }} />)
        ).toBe("");
    });

    it("does not invent notes from nickname, name, phone, email, or balance", () => {
        const markup = renderToStaticMarkup(
            <CustomerMappingNotes
                customer={{
                    nickname: "Sharma Ji",
                    customer_name: "Ravi",
                    phone_number: "9999999999",
                    email: "ravi@example.com",
                    current_balance: 2500,
                }}
            />
        );
        expect(markup).toBe("");
    });
});
