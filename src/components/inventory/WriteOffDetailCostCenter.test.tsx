import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { WriteOffDetailCostCenter } from "./WriteOffDetailCostCenter";

describe("WriteOffDetailCostCenter", () => {
    it("shows muted cost center text when BE sent cost_center", () => {
        const markup = renderToStaticMarkup(
            <WriteOffDetailCostCenter writeOff={{ cost_center: "CC-STORE" }} />
        );
        expect(markup).toContain("Cost center CC-STORE");
        expect(markup).toContain('aria-label="Cost center CC-STORE"');
        expect(markup).toContain("text-muted-foreground");
    });

    it("renders nothing when cost_center is omitted, null, or blank", () => {
        expect(renderToStaticMarkup(<WriteOffDetailCostCenter writeOff={{}} />)).toBe("");
        expect(
            renderToStaticMarkup(<WriteOffDetailCostCenter writeOff={{ cost_center: null }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(<WriteOffDetailCostCenter writeOff={{ cost_center: "  " }} />)
        ).toBe("");
    });

    it("does not invent cost_center from aliases, nested objects, reason, or ids", () => {
        const markup = renderToStaticMarkup(
            <WriteOffDetailCostCenter
                writeOff={{
                    id: 9,
                    product_id: 44,
                    reason: "damage",
                    department: "Warehouse",
                    cost_centre: "CC-UK",
                    costCenter: "CC-CAMEL",
                    cost_center_name: "Store desk",
                    cost_center_id: 55,
                    gl_code: "GL-400",
                    cost_center_obj: { id: 3, name: "Nested CC" },
                    created_by: "Ravi",
                }}
            />
        );
        expect(markup).toBe("");
    });
});
