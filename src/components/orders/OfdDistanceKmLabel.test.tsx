import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { OfdDistanceKmLabel } from "./OfdDistanceKmLabel";

describe("OfdDistanceKmLabel", () => {
    it("shows muted km text on an OFD row when BE sent distance_km", () => {
        const markup = renderToStaticMarkup(
            <OfdDistanceKmLabel
                row={{ status: "out_for_delivery", distance_km: 2.4 }}
            />
        );
        expect(markup).toContain("2.4 km");
        expect(markup).toContain("Distance 2.4 km");
    });

    it("renders nothing on an OFD row when the field is omitted, null, or blank", () => {
        expect(
            renderToStaticMarkup(<OfdDistanceKmLabel row={{ status: "out_for_delivery" }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(
                <OfdDistanceKmLabel row={{ status: "out_for_delivery", distance_km: null }} />
            )
        ).toBe("");
        expect(
            renderToStaticMarkup(
                <OfdDistanceKmLabel row={{ status: "out_for_delivery", distance_km: "" }} />
            )
        ).toBe("");
        expect(
            renderToStaticMarkup(
                <OfdDistanceKmLabel row={{ status: "out_for_delivery", distance_km: "   " }} />
            )
        ).toBe("");
    });

    it("does not show distance_km on non-OFD rows even when the field is present", () => {
        expect(
            renderToStaticMarkup(
                <OfdDistanceKmLabel row={{ status: "pending", distance_km: 2.4 }} />
            )
        ).toBe("");
        expect(
            renderToStaticMarkup(
                <OfdDistanceKmLabel row={{ status: "delivered", distance_km: 2.4 }} />
            )
        ).toBe("");
    });

    it("does not invent a label from other distance, eta, or nested delivery fields", () => {
        const markup = renderToStaticMarkup(
            <OfdDistanceKmLabel
                row={{
                    status: "out_for_delivery",
                    distance: 4.2,
                    distance_m: 4200,
                    eta_minutes: 18,
                    delivery_radius: 5,
                    latitude: 28.61,
                    longitude: 77.21,
                    delivery_info: { distance_km: 9.9, distance: 9.9 },
                }}
            />
        );
        expect(markup).toBe("");
    });
});
