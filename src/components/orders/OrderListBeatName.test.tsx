import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { OrderListBeatName } from "./OrderListBeatName";

describe("OrderListBeatName", () => {
    it("shows muted beat text when BE sent beat_name", () => {
        const markup = renderToStaticMarkup(
            <OrderListBeatName order={{ beat_name: "Najafgarh" }} />
        );
        expect(markup).toContain("Beat Najafgarh");
        expect(markup).toContain("Najafgarh");
    });

    it("trims whitespace before showing the BE value", () => {
        const markup = renderToStaticMarkup(
            <OrderListBeatName order={{ beat_name: "  South Beat  " }} />
        );
        expect(markup).toContain("Beat South Beat");
        expect(markup).not.toContain("  South Beat  ");
    });

    it("renders nothing when beat_name is omitted, null, or blank", () => {
        expect(renderToStaticMarkup(<OrderListBeatName order={{}} />)).toBe("");
        expect(
            renderToStaticMarkup(<OrderListBeatName order={{ beat_name: null }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(<OrderListBeatName order={{ beat_name: "   " }} />)
        ).toBe("");
    });

    it("does not invent beat_name from nested beat, beat_id, or route fields", () => {
        const markup = renderToStaticMarkup(
            <OrderListBeatName
                order={{
                    beat: { name: "Hidden Beat" },
                    beat_id: 12,
                    route_name: "Route A",
                    route: "R1",
                    area: "South",
                }}
            />
        );
        expect(markup).toBe("");
        expect(markup).not.toContain("Hidden Beat");
        expect(markup).not.toContain("Route A");
        expect(markup).not.toContain("Beat");
    });
});
