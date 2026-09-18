import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { InventoryLedgerBinLabel } from "./InventoryLedgerBinLabel";

describe("InventoryLedgerBinLabel", () => {
    it("shows muted bin text when BE sent bin_code", () => {
        const markup = renderToStaticMarkup(
            <InventoryLedgerBinLabel row={{ bin_code: "A-12" }} />
        );
        expect(markup).toContain("Bin A-12");
        expect(markup).toContain("A-12");
    });

    it("renders nothing when the field is omitted, null, or blank", () => {
        expect(renderToStaticMarkup(<InventoryLedgerBinLabel row={{}} />)).toBe("");
        expect(
            renderToStaticMarkup(<InventoryLedgerBinLabel row={{ bin_code: null }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(<InventoryLedgerBinLabel row={{ bin_code: "" }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(<InventoryLedgerBinLabel row={{ bin_code: "   " }} />)
        ).toBe("");
    });

    it("does not invent a label from row id, product_id, batch_id, bin, or nested bin", () => {
        const markup = renderToStaticMarkup(
            <InventoryLedgerBinLabel
                row={{
                    id: 99,
                    product_id: 12,
                    batch_id: 42,
                    bin: "SHELF-9",
                }}
            />
        );
        expect(markup).toBe("");
    });
});
