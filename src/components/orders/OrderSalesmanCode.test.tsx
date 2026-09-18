import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { OrderSalesmanCode } from "./OrderSalesmanCode";

describe("OrderSalesmanCode", () => {
    it("shows muted salesman code text when BE sent salesman_code", () => {
        const markup = renderToStaticMarkup(
            <OrderSalesmanCode order={{ salesman_code: "SM-1042" }} />
        );
        expect(markup).toContain("SM-1042");
        expect(markup).toContain("Salesman code SM-1042");
        expect(markup).toContain("text-muted-foreground");
    });

    it("renders nothing when the field is omitted, null, or blank", () => {
        expect(renderToStaticMarkup(<OrderSalesmanCode order={{}} />)).toBe("");
        expect(
            renderToStaticMarkup(<OrderSalesmanCode order={{ salesman_code: null }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(<OrderSalesmanCode order={{ salesman_code: "" }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(<OrderSalesmanCode order={{ salesman_code: "   " }} />)
        ).toBe("");
    });

    it("does not invent a code from name, nested salesman, salesman_id, or id", () => {
        const markup = renderToStaticMarkup(
            <OrderSalesmanCode
                order={{
                    salesman_name: "Ravi",
                    salesman_id: 55,
                    salesman: { id: 55, code: "NESTED", name: "Ravi" },
                    customer_name: "Anita",
                    notes: "SM-999",
                    id: 99,
                }}
            />
        );
        expect(markup).toBe("");
    });
});
