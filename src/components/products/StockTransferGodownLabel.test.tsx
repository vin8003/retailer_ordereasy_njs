import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { StockTransferGodownLabel } from "./StockTransferGodownLabel";

describe("StockTransferGodownLabel", () => {
    it("shows muted godown text when BE sent godown_name", () => {
        const markup = renderToStaticMarkup(
            <StockTransferGodownLabel row={{ godown_name: "Main Godown" }} />
        );
        expect(markup).toContain("Godown Main Godown");
        expect(markup).toContain("Main Godown");
        expect(markup).toContain("text-muted-foreground");
    });

    it("renders nothing when the field is omitted, null, or blank", () => {
        expect(renderToStaticMarkup(<StockTransferGodownLabel row={{}} />)).toBe("");
        expect(
            renderToStaticMarkup(<StockTransferGodownLabel row={{ godown_name: null }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(<StockTransferGodownLabel row={{ godown_name: "" }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(<StockTransferGodownLabel row={{ godown_name: "   " }} />)
        ).toBe("");
    });

    it("does not invent a label from nested godown, ids, or other location fields", () => {
        const markup = renderToStaticMarkup(
            <StockTransferGodownLabel
                row={{
                    godown: { id: 7, name: "Nested Store" },
                    godown_id: 7,
                    location_name: "Front Shop",
                    warehouse_name: "WH-A",
                    from_godown_name: "From A",
                    to_godown_name: "To B",
                }}
            />
        );
        expect(markup).toBe("");
    });
});
