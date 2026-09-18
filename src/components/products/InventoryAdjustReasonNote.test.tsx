import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { InventoryAdjustReasonNote } from "./InventoryAdjustReasonNote";

describe("InventoryAdjustReasonNote", () => {
    it("shows reason and note when BE sent them", () => {
        const markup = renderToStaticMarkup(
            <InventoryAdjustReasonNote
                row={{ reason: "Count correction", note: "Shelf 3 recount" }}
            />
        );
        expect(markup).toContain("Count correction");
        expect(markup).toContain("Reason Count correction");
        expect(markup).toContain("Shelf 3 recount");
        expect(markup).toContain("Note Shelf 3 recount");
    });

    it("shows only the fields BE actually sent", () => {
        const reasonOnly = renderToStaticMarkup(
            <InventoryAdjustReasonNote row={{ reason: "Damaged case" }} />
        );
        expect(reasonOnly).toContain("Damaged case");
        expect(reasonOnly).not.toContain("Note ");

        const noteOnly = renderToStaticMarkup(
            <InventoryAdjustReasonNote row={{ note: "Found 2 extra" }} />
        );
        expect(noteOnly).toContain("Found 2 extra");
        expect(noteOnly).toContain("Note Found 2 extra");
        expect(noteOnly).not.toContain("Reason ");
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
