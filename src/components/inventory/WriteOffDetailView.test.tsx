import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { WriteOffDetailView } from "./WriteOffDetailView";

describe("WriteOffDetailView", () => {
    it("shows optional inspector_name when BE sent it", () => {
        const markup = renderToStaticMarkup(
            <WriteOffDetailView
                writeOff={{
                    id: 9,
                    product_name: "Milk 1L",
                    quantity_change: "-2",
                    inspector_name: "Meera",
                }}
            />
        );
        expect(markup).toContain("Milk 1L");
        expect(markup).toContain("Qty -2");
        expect(markup).toContain("Inspector Meera");
    });

    it("omits the inspector line when inspector_name is blank or absent", () => {
        const absent = renderToStaticMarkup(
            <WriteOffDetailView writeOff={{ id: 9, product_name: "Milk 1L", reason: "damage" }} />
        );
        expect(absent).toContain("Milk 1L");
        expect(absent).not.toContain("Inspector");

        const blank = renderToStaticMarkup(
            <WriteOffDetailView writeOff={{ id: 9, inspector_name: "  ", reason: "expiry" }} />
        );
        expect(blank).not.toContain("Inspector");
    });

    it("does not invent inspector_name from nested inspector or created-by", () => {
        const markup = renderToStaticMarkup(
            <WriteOffDetailView
                writeOff={{
                    id: 9,
                    inspector: { name: "Hidden Inspector" },
                    inspector_id: 12,
                    created_by_name: "Ravi",
                    batch_number: "B-104",
                    reason: "spoilage",
                }}
            />
        );
        expect(markup).not.toContain("Hidden Inspector");
        expect(markup).not.toContain("Inspector");
        expect(markup).not.toContain("Ravi");
        expect(markup).not.toContain("Batch");
    });
});
