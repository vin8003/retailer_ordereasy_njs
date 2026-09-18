import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { OfdVehicleTypeLabel } from "./OfdVehicleTypeLabel";

describe("OfdVehicleTypeLabel", () => {
    it("shows muted vehicle text on OFD detail when BE sent vehicle_type", () => {
        const markup = renderToStaticMarkup(
            <OfdVehicleTypeLabel
                order={{ status: "out_for_delivery", vehicle_type: "bike" }}
            />
        );
        expect(markup).toContain("Vehicle bike");
        expect(markup).toContain("bike");
    });

    it("renders nothing on OFD detail when vehicle_type is omitted, null, or blank", () => {
        expect(
            renderToStaticMarkup(
                <OfdVehicleTypeLabel order={{ status: "out_for_delivery" }} />
            )
        ).toBe("");
        expect(
            renderToStaticMarkup(
                <OfdVehicleTypeLabel
                    order={{ status: "out_for_delivery", vehicle_type: null }}
                />
            )
        ).toBe("");
        expect(
            renderToStaticMarkup(
                <OfdVehicleTypeLabel
                    order={{ status: "out_for_delivery", vehicle_type: "   " }}
                />
            )
        ).toBe("");
    });

    it("does not show vehicle_type on non-OFD statuses (close-out / packed / delivered)", () => {
        expect(
            renderToStaticMarkup(
                <OfdVehicleTypeLabel order={{ status: "packed", vehicle_type: "bike" }} />
            )
        ).toBe("");
        expect(
            renderToStaticMarkup(
                <OfdVehicleTypeLabel
                    order={{ status: "delivered", vehicle_type: "scooter" }}
                />
            )
        ).toBe("");
        expect(
            renderToStaticMarkup(
                <OfdVehicleTypeLabel order={{ status: "pending", vehicle_type: "van" }} />
            )
        ).toBe("");
    });

    it("does not invent vehicle_type from nested vehicle, delivery_info, or courier fields", () => {
        const markup = renderToStaticMarkup(
            <OfdVehicleTypeLabel
                order={{
                    status: "out_for_delivery",
                    vehicle: { type: "bike" },
                    delivery_info: { vehicle_type: "scooter" },
                    courier_vehicle: "van",
                    vehicle_name: "Honda Activa",
                    delivery_person_name: "Ravi",
                }}
            />
        );
        expect(markup).toBe("");
    });
});
