import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { OfdGatePassLabel } from "./OfdGatePassLabel";

describe("OfdGatePassLabel", () => {
    it("shows muted gate pass text on an OFD row when BE sent gate_pass", () => {
        const markup = renderToStaticMarkup(
            <OfdGatePassLabel
                row={{ status: "out_for_delivery", gate_pass: "GP-1042" }}
            />
        );
        expect(markup).toContain("Gate pass GP-1042");
        expect(markup).toContain("GP-1042");
    });

    it("renders nothing on an OFD row when the field is omitted, null, or blank", () => {
        expect(
            renderToStaticMarkup(<OfdGatePassLabel row={{ status: "out_for_delivery" }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(
                <OfdGatePassLabel row={{ status: "out_for_delivery", gate_pass: null }} />
            )
        ).toBe("");
        expect(
            renderToStaticMarkup(
                <OfdGatePassLabel row={{ status: "out_for_delivery", gate_pass: "" }} />
            )
        ).toBe("");
        expect(
            renderToStaticMarkup(
                <OfdGatePassLabel row={{ status: "out_for_delivery", gate_pass: "   " }} />
            )
        ).toBe("");
    });

    it("does not show gate_pass on non-OFD rows even when the field is present", () => {
        expect(
            renderToStaticMarkup(
                <OfdGatePassLabel row={{ status: "pending", gate_pass: "GP-1042" }} />
            )
        ).toBe("");
        expect(
            renderToStaticMarkup(
                <OfdGatePassLabel row={{ status: "delivered", gate_pass: "GP-1042" }} />
            )
        ).toBe("");
    });

    it("does not invent a label from aliases or nested delivery objects", () => {
        const markup = renderToStaticMarkup(
            <OfdGatePassLabel
                row={{
                    status: "out_for_delivery",
                    gate_pass_number: "GP-HIDDEN",
                    gatepass: "GP-ALIAS",
                    pass_number: "PASS-9",
                    challan_no: "CH-1",
                    vehicle_number: "MH12AB1234",
                    driver_name: "Ravi Kumar",
                    delivery_info: { gate_pass: "NESTED-GP" },
                    special_instructions: "Show gate pass at booth",
                    order_number: "OE-1001",
                }}
            />
        );
        expect(markup).toBe("");
    });
});
