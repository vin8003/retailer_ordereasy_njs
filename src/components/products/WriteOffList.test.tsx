import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { WriteOffList } from "./WriteOffList";

describe("WriteOffList", () => {
    it("shows muted reason on a row when BE sent it", () => {
        const markup = renderToStaticMarkup(
            <WriteOffList
                items={[
                    {
                        id: 1,
                        product_name: "Atta 10kg",
                        log_type: "damaged",
                        quantity_change: "-2",
                        reason: "damage",
                    },
                ]}
            />
        );
        expect(markup).toContain("Atta 10kg");
        expect(markup).toContain("damage");
        expect(markup).toContain("Reason damage");
        expect(markup).toContain("text-muted-foreground");
    });

    it("hides reason when it is omitted, null, or blank and does not invent it", () => {
        const blank = renderToStaticMarkup(
            <WriteOffList
                items={[
                    {
                        id: 2,
                        product_name: "Rice 5kg",
                        log_type: "spoiled",
                        quantity_change: "-1",
                        reason: null,
                    },
                    {
                        id: 3,
                        product_name: "Oil 1L",
                        log_type: "expired",
                        quantity_change: "-3",
                        reason: "   ",
                    },
                    {
                        id: 4,
                        product_name: "Sugar 1kg",
                        log_type: "damaged",
                        quantity_change: "-4",
                    },
                ]}
            />
        );
        expect(blank).toContain("Rice 5kg");
        expect(blank).toContain("Oil 1L");
        expect(blank).toContain("Sugar 1kg");
        expect(blank).not.toContain("Reason ");
    });
});
