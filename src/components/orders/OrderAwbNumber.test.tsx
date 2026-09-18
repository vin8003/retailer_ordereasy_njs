import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { OrderAwbNumber } from "./OrderAwbNumber";

describe("OrderAwbNumber", () => {
    it("shows awb_number when BE sent a non-empty value", () => {
        const markup = renderToStaticMarkup(
            <OrderAwbNumber order={{ awb_number: "AWB123456789" }} />
        );
        expect(markup).toContain("AWB123456789");
        expect(markup).toContain("AWB AWB123456789");
    });

    it("renders nothing when awb_number is omitted, null, or blank", () => {
        expect(renderToStaticMarkup(<OrderAwbNumber order={{}} />)).toBe("");
        expect(
            renderToStaticMarkup(<OrderAwbNumber order={{ awb_number: null }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(<OrderAwbNumber order={{ awb_number: "  " }} />)
        ).toBe("");
    });

    it("does not invent awb_number from tracking, nested delivery_info, or other shipment fields", () => {
        const markup = renderToStaticMarkup(
            <OrderAwbNumber
                order={{
                    tracking_number: "TRK-999",
                    tracking_id: "TID-888",
                    awb: "NESTED-AWB",
                    waybill: "WB-777",
                    waybill_number: "WB-666",
                    consignment_number: "CN-555",
                    courier_awb: "COURIER-444",
                    order_number: "OE-1001",
                    vehicle_number: "MH12AB1234",
                    driver_name: "Ravi",
                    status: "out_for_delivery",
                    delivery_info: { awb_number: "NESTED-INFO-AWB" },
                }}
            />
        );
        expect(markup).toBe("");
        expect(markup).not.toContain("TRK-999");
        expect(markup).not.toContain("NESTED-AWB");
        expect(markup).not.toContain("NESTED-INFO-AWB");
        expect(markup).not.toContain("MH12AB1234");
        expect(markup).not.toContain("Ravi");
    });
});
