import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { WriteOffDetailInspectorName } from "./WriteOffDetailInspectorName";

describe("WriteOffDetailInspectorName", () => {
    it("shows muted inspector text when BE sent inspector_name", () => {
        const markup = renderToStaticMarkup(
            <WriteOffDetailInspectorName writeOff={{ inspector_name: "Meera" }} />
        );
        expect(markup).toContain("Meera");
        expect(markup).toContain("Inspector Meera");
    });

    it("renders nothing when the field is omitted, null, or blank", () => {
        expect(renderToStaticMarkup(<WriteOffDetailInspectorName writeOff={{}} />)).toBe("");
        expect(
            renderToStaticMarkup(<WriteOffDetailInspectorName writeOff={{ inspector_name: null }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(<WriteOffDetailInspectorName writeOff={{ inspector_name: "  " }} />)
        ).toBe("");
    });

    it("does not invent inspector_name from nested inspector, id, created-by, batch, or reason", () => {
        const markup = renderToStaticMarkup(
            <WriteOffDetailInspectorName
                writeOff={{
                    inspector: { name: "Hidden Inspector" },
                    inspector_id: 12,
                    created_by: "Ravi",
                    created_by_name: "Ravi Sharma",
                    batch_number: "B-104",
                    reason: "damage",
                    product_name: "Milk 1L",
                }}
            />
        );
        expect(markup).toBe("");
    });
});
