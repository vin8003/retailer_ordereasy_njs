import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { OrderTable } from "./OrderTable";

vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: vi.fn() }),
}));

const dummyOrder = {
    id: 11,
    order_number: "OE-DUMMY-11",
    customer_name: "Dummy Customer",
    total_amount: 250,
    status: "pending",
    created_at: "2026-09-18T10:00:00.000Z",
    refund_amount: 0,
    net_amount: 250,
    is_returned: false,
};

describe("OrderTable priority_flag", () => {
    it("shows Priority on table and card surfaces when BE sent priority_flag true", () => {
        const markup = renderToStaticMarkup(
            <OrderTable orders={[{ ...dummyOrder, priority_flag: true }]} isLoading={false} />
        );
        expect(markup).toContain("hidden md:block");
        expect(markup).toContain("block md:hidden");
        expect((markup.match(/Priority/g) ?? []).length).toBeGreaterThanOrEqual(2);
        expect(markup).toContain("OE-DUMMY-11");
    });

    it("omits Priority when priority_flag is missing, false, or null", () => {
        const omitted = renderToStaticMarkup(
            <OrderTable orders={[dummyOrder]} isLoading={false} />
        );
        expect(omitted).not.toContain("Priority");

        const falsy = renderToStaticMarkup(
            <OrderTable
                orders={[{ ...dummyOrder, priority_flag: false }]}
                isLoading={false}
            />
        );
        expect(falsy).not.toContain("Priority");

        const nulled = renderToStaticMarkup(
            <OrderTable
                orders={[{ ...dummyOrder, priority_flag: null }]}
                isLoading={false}
            />
        );
        expect(nulled).not.toContain("Priority");
    });

    it("does not invent Priority from sibling urgency fields", () => {
        const markup = renderToStaticMarkup(
            <OrderTable
                orders={[
                    {
                        ...dummyOrder,
                        priority: true,
                        is_priority: true,
                        urgent: true,
                    } as typeof dummyOrder,
                ]}
                isLoading={false}
            />
        );
        expect(markup).not.toContain("Priority");
    });

    it("shows loading and empty states without a Priority badge", () => {
        expect(renderToStaticMarkup(<OrderTable orders={[]} isLoading={true} />)).toContain(
            "Loading orders..."
        );
        expect(renderToStaticMarkup(<OrderTable orders={[]} isLoading={true} />)).not.toContain(
            "Priority"
        );
        expect(renderToStaticMarkup(<OrderTable orders={[]} isLoading={false} />)).toContain(
            "No orders found."
        );
        expect(renderToStaticMarkup(<OrderTable orders={[]} isLoading={false} />)).not.toContain(
            "Priority"
        );
    });
});
