import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { InventoryLedgerBatchLabel } from "./InventoryLedgerBatchLabel";

describe("InventoryLedgerBatchLabel", () => {
    it("shows muted batch text when BE sent batch_id", () => {
        const markup = renderToStaticMarkup(
            <InventoryLedgerBatchLabel row={{ batch_id: 42 }} />
        );
        expect(markup).toContain("Batch 42");
        expect(markup).toContain("42");
    });

    it("renders nothing when the field is omitted, null, or blank", () => {
        expect(renderToStaticMarkup(<InventoryLedgerBatchLabel row={{}} />)).toBe("");
        expect(
            renderToStaticMarkup(<InventoryLedgerBatchLabel row={{ batch_id: null }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(<InventoryLedgerBatchLabel row={{ batch_id: "" }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(<InventoryLedgerBatchLabel row={{ batch_id: "   " }} />)
        ).toBe("");
    });

    it("does not invent a label from row id, product_id, batch_number, or nested batch", () => {
        const markup = renderToStaticMarkup(
            <InventoryLedgerBatchLabel
                row={{
                    id: 99,
                    product_id: 12,
                    batch_number: "LOT-A",
                    batch: { id: 55 },
                }}
            />
        );
        expect(markup).toBe("");
    });
});
