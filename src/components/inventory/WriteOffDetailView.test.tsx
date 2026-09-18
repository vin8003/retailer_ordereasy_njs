import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { WriteOffDetailView } from "./WriteOffDetailView";

describe("WriteOffDetailView", () => {
    it("shows optional batch_number when BE sent it", () => {
        const markup = renderToStaticMarkup(
            <WriteOffDetailView
                writeOff={{
                    id: 9,
                    product_name: "Milk 1L",
                    quantity_change: "-2",
                    batch_number: "B-104",
                }}
            />
        );
        expect(markup).toContain("Milk 1L");
        expect(markup).toContain("Qty -2");
        expect(markup).toContain("Batch B-104");
    });

    it("omits the batch line when batch_number is blank or absent", () => {
        const absent = renderToStaticMarkup(
            <WriteOffDetailView writeOff={{ id: 9, product_name: "Milk 1L", reason: "damage" }} />
        );
        expect(absent).toContain("Milk 1L");
        expect(absent).not.toContain("Batch");

        const blank = renderToStaticMarkup(
            <WriteOffDetailView writeOff={{ id: 9, batch_number: "  ", reason: "expiry" }} />
        );
        expect(blank).not.toContain("Batch");
    });

    it("does not invent batch_number from batch_id or nested batch", () => {
        const markup = renderToStaticMarkup(
            <WriteOffDetailView
                writeOff={{
                    id: 9,
                    batch_id: 77,
                    batch: { batch_number: "NESTED-B1" },
                    reason: "spoilage",
                    created_by_name: "Ravi",
                }}
            />
        );
        expect(markup).not.toContain("NESTED-B1");
        expect(markup).not.toContain("Batch");
        expect(markup).not.toContain("Ravi");
    });
});
