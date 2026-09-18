import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { OrderListRouteNameLabel } from "./OrderListRouteNameLabel";

describe("OrderListRouteNameLabel", () => {
    it("shows muted route text when BE sent route_name", () => {
        const markup = renderToStaticMarkup(
            <OrderListRouteNameLabel order={{ route_name: "North Zone" }} />
        );
        expect(markup).toContain("North Zone");
        expect(markup).toContain("Route North Zone");
    });

    it("renders nothing when the field is omitted, null, or blank", () => {
        expect(renderToStaticMarkup(<OrderListRouteNameLabel order={{}} />)).toBe("");
        expect(
            renderToStaticMarkup(<OrderListRouteNameLabel order={{ route_name: null }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(<OrderListRouteNameLabel order={{ route_name: "" }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(<OrderListRouteNameLabel order={{ route_name: "   " }} />)
        ).toBe("");
    });

    it("does not invent a label from nested route, route_id, beat_name, or delivery_route", () => {
        const markup = renderToStaticMarkup(
            <OrderListRouteNameLabel
                order={{
                    route: { name: "Hidden Route" },
                    route_id: 7,
                    beat_name: "Beat B",
                    delivery_route: "DR-1",
                }}
            />
        );
        expect(markup).toBe("");
    });
});
