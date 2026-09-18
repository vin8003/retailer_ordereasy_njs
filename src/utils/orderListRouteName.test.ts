import { describe, expect, it } from "vitest";
import { getOrderListRouteNameLabel } from "./orderListRouteName";

describe("getOrderListRouteNameLabel", () => {
    it("returns the trimmed route_name when BE sent a non-empty string", () => {
        expect(getOrderListRouteNameLabel({ route_name: "North Zone" })).toBe("North Zone");
        expect(getOrderListRouteNameLabel({ route_name: "  Beat A  " })).toBe("Beat A");
    });

    it("returns null when route_name is omitted, null, or blank", () => {
        expect(getOrderListRouteNameLabel({})).toBeNull();
        expect(getOrderListRouteNameLabel({ route_name: undefined })).toBeNull();
        expect(getOrderListRouteNameLabel({ route_name: null })).toBeNull();
        expect(getOrderListRouteNameLabel({ route_name: "" })).toBeNull();
        expect(getOrderListRouteNameLabel({ route_name: "   " })).toBeNull();
    });

    it("does not invent route_name from nested route, route_id, beat_name, or delivery_route", () => {
        expect(
            getOrderListRouteNameLabel({
                route: { name: "Hidden Route" },
                route_id: 7,
                beat_name: "Beat B",
                delivery_route: "DR-1",
            })
        ).toBeNull();
        expect(
            getOrderListRouteNameLabel({
                route: { name: "Hidden Route" },
                route_id: 7,
                beat_name: "Beat B",
                delivery_route: "DR-1",
                route_name: null,
            })
        ).toBeNull();
    });
});
