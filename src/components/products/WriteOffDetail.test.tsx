import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { WriteOffDetail } from "./WriteOffDetail";

describe("WriteOffDetail", () => {
    it("shows muted created_by_name when BE sent it", () => {
        const markup = renderToStaticMarkup(
            <WriteOffDetail
                detail={{
                    id: 1,
                    product_name: "Atta 10kg",
                    log_type: "damaged",
                    quantity_change: "-2",
                    created_by_name: "Ravi Kumar",
                }}
            />
        );
        expect(markup).toContain("Atta 10kg");
        expect(markup).toContain("Ravi Kumar");
        expect(markup).toContain("Created by Ravi Kumar");
    });

    it("hides created_by_name when omitted, null, or blank and does not invent it", () => {
        const omitted = renderToStaticMarkup(
            <WriteOffDetail
                detail={{
                    id: 2,
                    product_name: "Rice 5kg",
                    created_by: "user-44",
                    reason: "spoilage",
                    log_type: "spoiled",
                }}
            />
        );
        expect(omitted).toContain("Rice 5kg");
        expect(omitted).not.toContain("Created by user-44");
        expect(omitted).not.toContain("aria-label=\"Created by");

        const blank = renderToStaticMarkup(
            <WriteOffDetail
                detail={{
                    id: 3,
                    product_name: "Oil 1L",
                    created_by_name: "   ",
                    created_by: "staff",
                }}
            />
        );
        expect(blank).toContain("Oil 1L");
        expect(blank).not.toContain("aria-label=\"Created by");
    });
});
