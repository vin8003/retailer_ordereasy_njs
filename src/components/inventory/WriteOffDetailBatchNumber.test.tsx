import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { WriteOffDetailBatchNumber } from "./WriteOffDetailBatchNumber";

describe("WriteOffDetailBatchNumber", () => {
    it("shows muted batch text when BE sent batch_number", () => {
        const markup = renderToStaticMarkup(
            <WriteOffDetailBatchNumber writeOff={{ batch_number: "B-104" }} />
        );
        expect(markup).toContain("Batch B-104");
        expect(markup).toContain('aria-label="Batch B-104"');
        expect(markup).toContain("text-muted-foreground");
    });

    it("renders nothing when batch_number is omitted, null, or blank", () => {
        expect(renderToStaticMarkup(<WriteOffDetailBatchNumber writeOff={{}} />)).toBe("");
        expect(
            renderToStaticMarkup(<WriteOffDetailBatchNumber writeOff={{ batch_number: null }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(<WriteOffDetailBatchNumber writeOff={{ batch_number: "  " }} />)
        ).toBe("");
    });

    it("does not invent batch_number from batch_id, nested batch, reason, or created-by", () => {
        const markup = renderToStaticMarkup(
            <WriteOffDetailBatchNumber
                writeOff={{
                    batch_id: 77,
                    batch: { batch_number: "NESTED-B1" },
                    reason: "damage",
                    product_name: "Milk 1L",
                    created_by: "Ravi",
                    created_by_name: "Ravi Sharma",
                }}
            />
        );
        expect(markup).toBe("");
    });
});
