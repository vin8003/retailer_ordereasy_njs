import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { InventoryAdjustReasonNote } from "./InventoryAdjustReasonNote";

describe("InventoryAdjustReasonNote", () => {
    it("shows the reason once and never a note (logs have no note field)", () => {
        const markup = renderToStaticMarkup(
            <InventoryAdjustReasonNote
                row={{ reason: "Count correction", note: "Shelf 3 recount" }}
            />
        );
        expect(markup.match(/Count correction/g)).toHaveLength(2); // text + aria-label
        expect(markup).not.toContain("Shelf 3 recount");
        expect(
            renderToStaticMarkup(<InventoryAdjustReasonNote row={{ note: "Found 2 extra" }} />)
        ).toBe("");
    });

    it("renders nothing when reason/note are omitted, null, or blank", () => {
        expect(renderToStaticMarkup(<InventoryAdjustReasonNote row={{}} />)).toBe("");
        expect(
            renderToStaticMarkup(
                <InventoryAdjustReasonNote row={{ reason: null, note: null }} />
            )
        ).toBe("");
        expect(
            renderToStaticMarkup(
                <InventoryAdjustReasonNote row={{ reason: "  ", note: "   " }} />
            )
        ).toBe("");
    });

    it("links a present reason that contains an order number", () => {
        const markup = renderToStaticMarkup(
            <InventoryAdjustReasonNote row={{ reason: "POS Sale: Order #OE-1001" }} />
        );
        expect(markup).toContain("POS Sale: Order #OE-1001");
        expect(markup).toContain("/dashboard/orders/details?number=OE-1001");
    });

    it("does not invent reason or note from notes, log_type, or created_by", () => {
        const markup = renderToStaticMarkup(
            <InventoryAdjustReasonNote
                row={{
                    notes: "Internal memo",
                    log_type: "removed",
                    created_by: "Asha",
                    quantity_change: -2,
                }}
            />
        );
        expect(markup).toBe("");
    });
});
