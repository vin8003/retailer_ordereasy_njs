import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { OrderDetailNotes } from "./OrderDetailNotes";

describe("OrderDetailNotes", () => {
    it("shows muted notes text when BE sent notes", () => {
        const markup = renderToStaticMarkup(
            <OrderDetailNotes order={{ notes: "Leave at the back gate" }} />
        );
        expect(markup).toContain("Leave at the back gate");
        expect(markup).toContain("Notes Leave at the back gate");
    });

    it("renders nothing when notes is omitted, null, or blank", () => {
        expect(renderToStaticMarkup(<OrderDetailNotes order={{}} />)).toBe("");
        expect(
            renderToStaticMarkup(<OrderDetailNotes order={{ notes: null }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(<OrderDetailNotes order={{ notes: "  " }} />)
        ).toBe("");
    });

    it("does not invent notes from special_instructions, remark, or feedback", () => {
        const markup = renderToStaticMarkup(
            <OrderDetailNotes
                order={{
                    special_instructions: "Ring the bell",
                    remark: "VIP",
                    feedback: { comment: "Great shop" },
                    order_number: "OE-1001",
                }}
            />
        );
        expect(markup).toBe("");
    });
});
