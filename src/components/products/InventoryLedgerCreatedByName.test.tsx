import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { InventoryLedgerCreatedByName } from "./InventoryLedgerCreatedByName";

describe("InventoryLedgerCreatedByName", () => {
    it("shows muted created_by_name when BE sent a non-empty string", () => {
        const markup = renderToStaticMarkup(
            <InventoryLedgerCreatedByName row={{ created_by_name: "Ravi Kumar" }} />
        );
        expect(markup).toContain("Ravi Kumar");
        expect(markup).toContain("Created by Ravi Kumar");
    });

    it("renders nothing when created_by_name is omitted, null, or blank", () => {
        expect(renderToStaticMarkup(<InventoryLedgerCreatedByName row={{}} />)).toBe("");
        expect(
            renderToStaticMarkup(
                <InventoryLedgerCreatedByName row={{ created_by_name: null }} />
            )
        ).toBe("");
        expect(
            renderToStaticMarkup(
                <InventoryLedgerCreatedByName row={{ created_by_name: "  " }} />
            )
        ).toBe("");
    });

    it("does not invent a name from created_by, reason, or product_name", () => {
        const markup = renderToStaticMarkup(
            <InventoryLedgerCreatedByName
                row={{
                    created_by: "user-44",
                    reason: "damage",
                    product_name: "Atta 10kg",
                    log_type: "damaged",
                }}
            />
        );
        expect(markup).toBe("");
    });
});
