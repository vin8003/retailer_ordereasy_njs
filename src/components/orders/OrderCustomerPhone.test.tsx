import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { OrderCustomerPhone } from "./OrderCustomerPhone";

describe("OrderCustomerPhone", () => {
    it("shows customer.phone when BE sent a non-empty value", () => {
        const markup = renderToStaticMarkup(
            <OrderCustomerPhone order={{ customer: { phone: "9876543210" } }} />
        );
        expect(markup).toContain("9876543210");
        expect(markup).toContain("Phone 9876543210");
    });

    it("shows existing customer_phone when customer.phone is absent", () => {
        const markup = renderToStaticMarkup(
            <OrderCustomerPhone order={{ customer_phone: "8111122222" }} />
        );
        expect(markup).toContain("8111122222");
        expect(markup).toContain("Phone 8111122222");
    });

    it("renders nothing when phone is omitted, null, or blank", () => {
        expect(renderToStaticMarkup(<OrderCustomerPhone order={{}} />)).toBe("");
        expect(
            renderToStaticMarkup(<OrderCustomerPhone order={{ customer: { phone: null } }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(<OrderCustomerPhone order={{ customer: { phone: "  " }, customer_phone: "" }} />)
        ).toBe("");
    });

    it("does not invent phone from name, email, notes, or other contact fields", () => {
        const markup = renderToStaticMarkup(
            <OrderCustomerPhone
                order={{
                    customer_name: "Ravi",
                    customer_email: "ravi@example.com",
                    notes: "Call on arrival",
                    user: { phone: "9999999999" },
                    customer_mobile: "8888888888",
                    guest_mobile: "7777777777",
                    customer: { first_name: "Ravi" },
                }}
            />
        );
        expect(markup).toBe("");
        expect(markup).not.toContain("9999999999");
        expect(markup).not.toContain("Call on arrival");
    });
});
