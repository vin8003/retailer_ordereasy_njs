import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: () => undefined }),
}));

import { OrderTable } from "./OrderTable";

const baseOrder = {
    id: 1,
    order_number: "OE-1001",
    customer_name: "Anita",
    total_amount: 100,
    status: "pending",
    created_at: "2026-09-18T10:00:00.000Z",
    refund_amount: 0,
    net_amount: 100,
    is_returned: false,
};

describe("OrderTable salesman_code", () => {
    it("shows salesman_code on table and card surfaces when BE sent it", () => {
        const markup = renderToStaticMarkup(
            <OrderTable orders={[{ ...baseOrder, salesman_code: "SM-1042" }]} isLoading={false} />
        );
        expect(markup).toContain("hidden md:block");
        expect(markup).toContain("block md:hidden");
        expect((markup.match(/SM-1042/g) ?? []).length).toBeGreaterThanOrEqual(2);
        expect((markup.match(/Salesman code SM-1042/g) ?? []).length).toBeGreaterThanOrEqual(2);
        expect(markup).toContain("OE-1001");
    });

    it("omits salesman text when salesman_code is missing, null, or blank", () => {
        const omitted = renderToStaticMarkup(
            <OrderTable orders={[baseOrder]} isLoading={false} />
        );
        expect(omitted).not.toContain("SM-1042");
        expect(omitted).not.toContain("Salesman code");

        const blank = renderToStaticMarkup(
            <OrderTable orders={[{ ...baseOrder, salesman_code: "   " }]} isLoading={false} />
        );
        expect(blank).not.toContain("Salesman code");

        const nulled = renderToStaticMarkup(
            <OrderTable orders={[{ ...baseOrder, salesman_code: null }]} isLoading={false} />
        );
        expect(nulled).not.toContain("Salesman code");
    });

    it("does not invent salesman_code from other row fields", () => {
        const markup = renderToStaticMarkup(
            <OrderTable
                orders={[
                    {
                        ...baseOrder,
                        salesman_name: "Ravi",
                        salesman_id: 55,
                        salesman: { id: 55, code: "NESTED", name: "Ravi" },
                        notes: "SM-999",
                    } as typeof baseOrder,
                ]}
                isLoading={false}
            />
        );
        expect(markup).not.toContain("Salesman code");
        expect(markup).not.toContain("NESTED");
        expect(markup).not.toContain("SM-999");
    });
});
