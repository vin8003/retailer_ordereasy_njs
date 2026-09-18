import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { OfdVehicleNumberLabel } from "./OfdVehicleNumberLabel";

describe("OfdVehicleNumberLabel", () => {
    it("shows muted vehicle text when BE sent vehicle_number", () => {
        const markup = renderToStaticMarkup(
            <OfdVehicleNumberLabel order={{ vehicle_number: "MH12AB1234" }} />
        );
        expect(markup).toContain("Vehicle MH12AB1234");
        expect(markup).toContain("MH12AB1234");
    });

    it("renders nothing when the field is omitted, null, or blank", () => {
        expect(renderToStaticMarkup(<OfdVehicleNumberLabel order={{}} />)).toBe("");
        expect(
            renderToStaticMarkup(<OfdVehicleNumberLabel order={{ vehicle_number: null }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(<OfdVehicleNumberLabel order={{ vehicle_number: "" }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(<OfdVehicleNumberLabel order={{ vehicle_number: "   " }} />)
        ).toBe("");
    });

    it("does not invent a label from vehicle, vehicle_no, driver, nested delivery, or plate", () => {
        const markup = renderToStaticMarkup(
            <OfdVehicleNumberLabel
                order={{
                    vehicle: "MH00XX0000",
                    vehicle_no: "KA01AA1111",
                    driver: "Ravi",
                    delivery: { vehicle_number: "TN09ZZ9999", plate: "WB02YY2222" },
                    plate: "GJ03TT3333",
                }}
            />
        );
        expect(markup).toBe("");
    });
});
