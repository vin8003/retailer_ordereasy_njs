import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { OrderDetailSalesmanName } from "./OrderDetailSalesmanName";

describe("OrderDetailSalesmanName", () => {
    it("shows muted salesman text when BE sent salesman_name", () => {
        const markup = renderToStaticMarkup(
            <OrderDetailSalesmanName order={{ salesman_name: "Rahul" }} />
        );
        expect(markup).toContain("Rahul");
        expect(markup).toContain("Salesman Rahul");
    });

    it("renders nothing when the field is omitted, null, or blank", () => {
        expect(renderToStaticMarkup(<OrderDetailSalesmanName order={{}} />)).toBe("");
        expect(
            renderToStaticMarkup(<OrderDetailSalesmanName order={{ salesman_name: null }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(<OrderDetailSalesmanName order={{ salesman_name: "  " }} />)
        ).toBe("");
    });

    it("does not invent a label from nested salesman, id, customer, notes, or phone", () => {
        const markup = renderToStaticMarkup(
            <OrderDetailSalesmanName
                order={{
                    salesman: { name: "Hidden Salesman" },
                    salesman_id: 12,
                    customer_name: "Ravi",
                    notes: "internal remark",
                    customer_phone: "9999999999",
                }}
            />
        );
        expect(markup).toBe("");
    });
});
