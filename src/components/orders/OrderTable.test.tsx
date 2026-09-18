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
    customer_name: "Ravi",
    total_amount: 250,
    status: "pending",
    created_at: "2026-09-18T10:00:00.000Z",
    refund_amount: 0,
    net_amount: 250,
    is_returned: false,
};

describe("OrderTable beat_name", () => {
    it("shows beat_name on table and card surfaces when BE sent it", () => {
        const markup = renderToStaticMarkup(
            <OrderTable
                orders={[{ ...baseOrder, beat_name: "Najafgarh" }]}
                isLoading={false}
            />
        );
        expect(markup).toContain("hidden md:block");
        expect(markup).toContain("block md:hidden");
        expect((markup.match(/Beat Najafgarh/g) ?? []).length).toBeGreaterThanOrEqual(2);
        expect(markup).toContain("OE-1001");
    });

    it("omits beat text when beat_name is missing, null, or blank", () => {
        const omitted = renderToStaticMarkup(
            <OrderTable orders={[baseOrder]} isLoading={false} />
        );
        expect(omitted).not.toContain("Beat");

        const blank = renderToStaticMarkup(
            <OrderTable
                orders={[{ ...baseOrder, beat_name: "   " }]}
                isLoading={false}
            />
        );
        expect(blank).not.toContain("Beat");

        const nulled = renderToStaticMarkup(
            <OrderTable
                orders={[{ ...baseOrder, beat_name: null }]}
                isLoading={false}
            />
        );
        expect(nulled).not.toContain("Beat");
    });

    it("does not invent beat_name from nested beat or route fields", () => {
        const markup = renderToStaticMarkup(
            <OrderTable
                orders={[
                    {
                        ...baseOrder,
                        beat: { name: "Hidden Beat" },
                        beat_id: 12,
                        route_name: "Route A",
                    } as typeof baseOrder,
                ]}
                isLoading={false}
            />
        );
        expect(markup).not.toContain("Beat");
        expect(markup).not.toContain("Hidden Beat");
        expect(markup).not.toContain("Route A");
    });
});
