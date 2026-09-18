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
    payment_mode: "cheque",
    payment_status: "PAID",
};

describe("ThermalReceipt cheque_number", () => {
    it("prints CHEQUE NO on the payment receipt when BE sent cheque_number", () => {
        const markup = renderToStaticMarkup(
            <ThermalReceipt order={{ ...dummyOrder, cheque_number: "CHQ-90210" }} />
        );
        expect(markup).toContain("PAYMENT: CHEQUE");
        expect(markup).toContain("CHEQUE NO: CHQ-90210");
        expect(markup).toContain("Cheque number CHQ-90210");
    });

    it("omits CHEQUE NO when cheque_number is missing, null, or blank", () => {
        expect(renderToStaticMarkup(<ThermalReceipt order={dummyOrder} />)).not.toContain(
            "CHEQUE NO:"
        );
        expect(
            renderToStaticMarkup(<ThermalReceipt order={{ ...dummyOrder, cheque_number: null }} />)
        ).not.toContain("CHEQUE NO:");
        expect(
            renderToStaticMarkup(<ThermalReceipt order={{ ...dummyOrder, cheque_number: "  " }} />)
        ).not.toContain("CHEQUE NO:");
    });

    it("does not invent CHEQUE NO from cheque aliases, payment_reference_id, or notes", () => {
        const markup = renderToStaticMarkup(
            <ThermalReceipt
                order={{
                    ...dummyOrder,
                    payment_reference_id: "HIDDENREF0001",
                    notes: "Cheque CHQ-90210",
                    cheque_no: "ALIAS-88",
                } as typeof dummyOrder}
            />
        );
        expect(markup).toContain("OE-POS101");
        expect(markup).not.toContain("HIDDENREF0001");
        expect(markup).not.toContain("ALIAS-88");
        expect(markup).not.toContain("CHQ-90210");
        expect(markup).not.toContain("CHEQUE NO:");
    });
});
