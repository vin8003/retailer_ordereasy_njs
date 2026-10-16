import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { WriteOffListReason } from "./WriteOffListReason";

describe("WriteOffListReason", () => {
    it("shows muted reason text when BE sent a non-empty reason", () => {
        const markup = renderToStaticMarkup(
            <WriteOffListReason row={{ reason: "damage" }} />
        );
        expect(markup).toContain("damage");
        expect(markup).toContain("Reason damage");
        expect(markup).toContain("text-muted-foreground");
    });

    it("renders nothing when reason is omitted, null, or blank", () => {
        expect(renderToStaticMarkup(<WriteOffListReason row={{}} />)).toBe("");
        expect(
            renderToStaticMarkup(<WriteOffListReason row={{ reason: null }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(<WriteOffListReason row={{ reason: "  " }} />)
        ).toBe("");
    });

    it("does not invent reason from log_type, product_name, or quantity", () => {
        const markup = renderToStaticMarkup(
            <WriteOffListReason
                row={{
                    log_type: "damaged",
                    product_name: "Atta 10kg",
                    quantity_change: "-2",
                }}
            />
        );
        expect(markup).toBe("");
    });
});
