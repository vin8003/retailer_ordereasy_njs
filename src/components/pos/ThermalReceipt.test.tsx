import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ThermalReceipt } from "./ThermalReceipt";

const dummyOrder = {
    order_number: "OE-POS101",
    created_at: "2026-09-18T10:00:00.000Z",
    retailer_name: "Dummy Kirana",
    items: [
        {
            product_name: "Milk",
            quantity: 1,
            unit_price: 50,
            total_price: 50,
        },
    ],
    subtotal: 50,
    total_amount: 50,
    payment_mode: "upi",
    payment_status: "PAID",
};

describe("ThermalReceipt upi_ref", () => {
    it("prints UPI REF on the payment/order receipt when BE sent upi_ref", () => {
        const markup = renderToStaticMarkup(
            <ThermalReceipt order={{ ...dummyOrder, upi_ref: "AXIS123456789012" }} />
        );
        expect(markup).toContain("PAYMENT: UPI");
        expect(markup).toContain("UPI REF: AXIS123456789012");
        expect(markup).toContain("UPI ref AXIS123456789012");
    });

    it("omits UPI REF when upi_ref is missing, null, or blank", () => {
        expect(renderToStaticMarkup(<ThermalReceipt order={dummyOrder} />)).not.toContain(
            "UPI REF:"
        );
        expect(
            renderToStaticMarkup(<ThermalReceipt order={{ ...dummyOrder, upi_ref: null }} />)
        ).not.toContain("UPI REF:");
        expect(
            renderToStaticMarkup(<ThermalReceipt order={{ ...dummyOrder, upi_ref: "  " }} />)
        ).not.toContain("UPI REF:");
    });

    it("does not invent UPI REF from payment_reference_id or order_number", () => {
        const markup = renderToStaticMarkup(
            <ThermalReceipt
                order={{
                    ...dummyOrder,
                    payment_reference_id: "HIDDENUTR0001",
                } as typeof dummyOrder}
            />
        );
        expect(markup).toContain("OE-POS101");
        expect(markup).not.toContain("HIDDENUTR0001");
        expect(markup).not.toContain("UPI REF:");
    });
});
