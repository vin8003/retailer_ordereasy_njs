import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { OrderCustomerCode } from "./OrderCustomerCode";

describe("OrderCustomerCode", () => {
    it("shows muted customer code text when BE sent customer_code", () => {
        const markup = renderToStaticMarkup(
            <OrderCustomerCode order={{ customer_code: "CUST-1042" }} />
        );
        expect(markup).toContain("CUST-1042");
        expect(markup).toContain("Customer code CUST-1042");
        expect(markup).toContain("text-muted-foreground");
    });

    it("renders nothing when the field is omitted, null, or blank", () => {
        expect(renderToStaticMarkup(<OrderCustomerCode order={{}} />)).toBe("");
        expect(
            renderToStaticMarkup(<OrderCustomerCode order={{ customer_code: null }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(<OrderCustomerCode order={{ customer_code: "  " }} />)
        ).toBe("");
    });

    it("does not invent a code from name, nested customer, or id", () => {
        const markup = renderToStaticMarkup(
            <OrderCustomerCode
                order={{
                    customer_name: "Ravi",
                    customer: { first_name: "Ravi", username: "ravi", customer_code: "NESTED" },
                    id: 99,
                }}
            />
        );
        expect(markup).toBe("");
    });
});
