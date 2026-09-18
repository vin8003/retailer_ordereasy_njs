import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { OrderVehicleNumber } from "./OrderVehicleNumber";

describe("OrderVehicleNumber", () => {
    it("shows vehicle_number when BE sent a non-empty value", () => {
        const markup = renderToStaticMarkup(
            <OrderVehicleNumber order={{ vehicle_number: "MH12AB1234" }} />
        );
        expect(markup).toContain("MH12AB1234");
        expect(markup).toContain("Vehicle MH12AB1234");
    });

    it("renders nothing when vehicle_number is omitted, null, or blank", () => {
        expect(renderToStaticMarkup(<OrderVehicleNumber order={{}} />)).toBe("");
        expect(
            renderToStaticMarkup(<OrderVehicleNumber order={{ vehicle_number: null }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(<OrderVehicleNumber order={{ vehicle_number: "  " }} />)
        ).toBe("");
    });

    it("does not invent vehicle_number from driver, route, or other vehicle-like fields", () => {
        const markup = renderToStaticMarkup(
            <OrderVehicleNumber
                order={{
                    driver_name: "Ravi",
                    route_name: "North-1",
                    vehicle: "MH12AB1234",
                    registration_number: "KA03D9999",
                    vehicle_no: "TN09X1001",
                    order_number: "OE-1001",
                    status: "out_for_delivery",
                    special_instructions: "Use the van",
                }}
            />
        );
        expect(markup).toBe("");
        expect(markup).not.toContain("MH12AB1234");
        expect(markup).not.toContain("Ravi");
        expect(markup).not.toContain("North-1");
    });
});
