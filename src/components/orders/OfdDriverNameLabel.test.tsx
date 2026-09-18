import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { OfdDriverNameLabel } from "./OfdDriverNameLabel";

describe("OfdDriverNameLabel", () => {
    it("shows muted driver text on an OFD row when BE sent driver_name", () => {
        const markup = renderToStaticMarkup(
            <OfdDriverNameLabel
                row={{ status: "out_for_delivery", driver_name: "Ravi Kumar" }}
            />
        );
        expect(markup).toContain("Driver Ravi Kumar");
        expect(markup).toContain("Ravi Kumar");
    });

    it("renders nothing on an OFD row when the field is omitted, null, or blank", () => {
        expect(
            renderToStaticMarkup(<OfdDriverNameLabel row={{ status: "out_for_delivery" }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(
                <OfdDriverNameLabel row={{ status: "out_for_delivery", driver_name: null }} />
            )
        ).toBe("");
        expect(
            renderToStaticMarkup(
                <OfdDriverNameLabel row={{ status: "out_for_delivery", driver_name: "" }} />
            )
        ).toBe("");
        expect(
            renderToStaticMarkup(
                <OfdDriverNameLabel row={{ status: "out_for_delivery", driver_name: "   " }} />
            )
        ).toBe("");
    });

    it("does not show driver_name on non-OFD rows even when the field is present", () => {
        expect(
            renderToStaticMarkup(
                <OfdDriverNameLabel row={{ status: "pending", driver_name: "Ravi Kumar" }} />
            )
        ).toBe("");
        expect(
            renderToStaticMarkup(
                <OfdDriverNameLabel row={{ status: "delivered", driver_name: "Ravi Kumar" }} />
            )
        ).toBe("");
    });

    it("does not invent a label from delivery_person_name or nested courier objects", () => {
        const markup = renderToStaticMarkup(
            <OfdDriverNameLabel
                row={{
                    status: "out_for_delivery",
                    delivery_person_name: "Hidden Courier",
                    delivery_info: { delivery_person_name: "Nested Courier", driver_name: "Nested Driver" },
                    driver: { name: "Nested Driver" },
                    courier: { name: "Nested Courier" },
                }}
            />
        );
        expect(markup).toBe("");
    });
});
