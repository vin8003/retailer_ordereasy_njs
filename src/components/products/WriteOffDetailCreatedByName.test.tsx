import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { WriteOffDetailCreatedByName } from "./WriteOffDetailCreatedByName";

describe("WriteOffDetailCreatedByName", () => {
    it("shows created_by_name when BE sent a non-empty string", () => {
        const markup = renderToStaticMarkup(
            <WriteOffDetailCreatedByName detail={{ created_by_name: "Ravi Kumar" }} />
        );
        expect(markup).toContain("Ravi Kumar");
        expect(markup).toContain("Created by Ravi Kumar");
        expect(markup).toContain("Created by");
    });

    it("renders nothing when created_by_name is omitted, null, or blank", () => {
        expect(renderToStaticMarkup(<WriteOffDetailCreatedByName detail={{}} />)).toBe("");
        expect(
            renderToStaticMarkup(
                <WriteOffDetailCreatedByName detail={{ created_by_name: null }} />
            )
        ).toBe("");
        expect(
            renderToStaticMarkup(
                <WriteOffDetailCreatedByName detail={{ created_by_name: "  " }} />
            )
        ).toBe("");
    });

    it("does not invent a name from created_by, reason, or product_name", () => {
        const markup = renderToStaticMarkup(
            <WriteOffDetailCreatedByName
                detail={{
                    created_by: "user-44",
                    reason: "damage",
                    product_name: "Atta 10kg",
                    log_type: "damaged",
                    quantity_change: "-2",
                }}
            />
        );
        expect(markup).toBe("");
    });
});
