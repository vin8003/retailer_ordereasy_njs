import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { WriteOffDetailView } from "./WriteOffDetailView";

const dummyWriteOff = {
    id: 7015,
    product_name: "Atta 10kg",
    quantity_change: "-2",
    reason: "damage",
};

describe("WriteOffDetailView", () => {
    it("shows optional cost_center when BE sent it", () => {
        const markup = renderToStaticMarkup(
            <WriteOffDetailView writeOff={{ ...dummyWriteOff, cost_center: "CC-STORE" }} />
        );
        expect(markup).toContain("Atta 10kg");
        expect(markup).toContain("Qty -2");
        expect(markup).toContain("Cost center CC-STORE");
    });

    it("omits the cost center line when cost_center is blank or absent", () => {
        const absent = renderToStaticMarkup(
            <WriteOffDetailView writeOff={dummyWriteOff} />
        );
        expect(absent).toContain("Atta 10kg");
        expect(absent).not.toContain("Cost center");

        const blank = renderToStaticMarkup(
            <WriteOffDetailView writeOff={{ ...dummyWriteOff, cost_center: "  " }} />
        );
        expect(blank).not.toContain("Cost center");

        const nulled = renderToStaticMarkup(
            <WriteOffDetailView writeOff={{ ...dummyWriteOff, cost_center: null }} />
        );
        expect(nulled).not.toContain("Cost center");
    });

    it("does not invent cost_center from aliases, nested objects, or created-by", () => {
        const markup = renderToStaticMarkup(
            <WriteOffDetailView
                writeOff={{
                    id: 9,
                    reason: "spoilage",
                    department: "Warehouse",
                    cost_centre: "CC-UK",
                    cost_center_name: "Store desk",
                    cost_center_obj: { id: 3, name: "Nested CC" },
                    created_by_name: "Ravi",
                }}
            />
        );
        expect(markup).not.toContain("CC-UK");
        expect(markup).not.toContain("Store desk");
        expect(markup).not.toContain("Nested CC");
        expect(markup).not.toContain("Cost center");
        expect(markup).not.toContain("Ravi");
    });
});
