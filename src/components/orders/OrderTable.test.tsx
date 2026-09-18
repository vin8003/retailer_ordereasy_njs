import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: vi.fn() }),
}));

import { OrderTable } from "./OrderTable";

const baseOrder = {
    id: 1,
    order_number: "ORD-100",
    customer_name: "Asha",
    total_amount: 120,
    status: "pending",
    created_at: "2026-09-18T10:00:00.000Z",
    refund_amount: 0,
    net_amount: 120,
    is_returned: false,
};

describe("OrderTable route_name", () => {
    it("shows route_name on table and card surfaces when BE sent it", () => {
        const markup = renderToStaticMarkup(
            <OrderTable
                orders={[{ ...baseOrder, route_name: "North Zone" }]}
                isLoading={false}
            />
        );
        expect(markup).toContain("hidden md:block");
        expect(markup).toContain("block md:hidden");
        expect((markup.match(/North Zone/g) ?? []).length).toBeGreaterThanOrEqual(2);
        expect(markup).toContain("ORD-100");
    });

    it("omits route text when route_name is missing, null, or blank", () => {
        const omitted = renderToStaticMarkup(
            <OrderTable orders={[baseOrder]} isLoading={false} />
        );
        expect(omitted).not.toContain("North Zone");
        expect(omitted).not.toContain("Route ");

        const blank = renderToStaticMarkup(
            <OrderTable
                orders={[{ ...baseOrder, route_name: "   " }]}
                isLoading={false}
            />
        );
        expect(blank).not.toContain("Route ");

        const nulled = renderToStaticMarkup(
            <OrderTable
                orders={[{ ...baseOrder, route_name: null }]}
                isLoading={false}
            />
        );
        expect(nulled).not.toContain("Route ");
    });

    it("does not invent route_name from other row fields", () => {
        const markup = renderToStaticMarkup(
            <OrderTable
                orders={[
                    {
                        ...baseOrder,
                        route: { name: "Hidden Route" },
                        route_id: 7,
                        beat_name: "Beat B",
                        delivery_route: "DR-1",
                    } as typeof baseOrder,
                ]}
                isLoading={false}
            />
        );
        expect(markup).not.toContain("Hidden Route");
        expect(markup).not.toContain("Beat B");
        expect(markup).not.toContain("DR-1");
        expect(markup).not.toContain("Route ");
    });
});
