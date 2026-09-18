import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { InventoryAdjustRackLocationLabel } from "./InventoryAdjustRackLocationLabel";

describe("InventoryAdjustRackLocationLabel", () => {
    it("shows muted rack text when BE sent rack_location", () => {
        const markup = renderToStaticMarkup(
            <InventoryAdjustRackLocationLabel row={{ rack_location: "A-12" }} />
        );
        expect(markup).toContain("Rack A-12");
        expect(markup).toContain("A-12");
    });

    it("renders nothing when the field is omitted, null, or blank", () => {
        expect(renderToStaticMarkup(<InventoryAdjustRackLocationLabel row={{}} />)).toBe("");
        expect(
            renderToStaticMarkup(<InventoryAdjustRackLocationLabel row={{ rack_location: null }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(<InventoryAdjustRackLocationLabel row={{ rack_location: "" }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(<InventoryAdjustRackLocationLabel row={{ rack_location: "   " }} />)
        ).toBe("");
    });

    it("does not invent a label from rack, bin, location, warehouse, reason, or batch", () => {
        const markup = renderToStaticMarkup(
            <InventoryAdjustRackLocationLabel
                row={{
                    rack: "A-12",
                    bin: "B1",
                    location: "Front",
                    warehouse_name: "Main",
                    warehouse_id: 3,
                    warehouse: { name: "Main", rack_location: "WH-A" },
                    reason: "Moved to A-12",
                    batch_id: 42,
                }}
            />
        );
        expect(markup).toBe("");
    });
});
