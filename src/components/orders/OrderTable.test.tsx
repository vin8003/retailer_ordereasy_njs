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
    total_amount: 100,
    status: "out_for_delivery",
    created_at: "2026-09-18T10:00:00.000Z",
    refund_amount: 0,
    net_amount: 100,
    is_returned: false,
};

describe("OrderTable OFD vehicle_number", () => {
    it("shows vehicle_number on desktop and mobile when BE sent it", () => {
        const markup = renderToStaticMarkup(
            <OrderTable
                orders={[{ ...baseOrder, vehicle_number: "MH12AB1234" }]}
                isLoading={false}
            />
        );
        expect(markup).toContain("hidden md:block");
        expect(markup).toContain("block md:hidden");
        expect((markup.match(/Vehicle MH12AB1234/g) ?? []).length).toBeGreaterThanOrEqual(2);
        expect(markup).toContain("OE-1001");
    });

    it("omits vehicle text when vehicle_number is missing, null, or blank", () => {
        const omitted = renderToStaticMarkup(
            <OrderTable orders={[baseOrder]} isLoading={false} />
        );
        expect(omitted).not.toContain("Vehicle");

        const blank = renderToStaticMarkup(
            <OrderTable
                orders={[{ ...baseOrder, vehicle_number: "   " }]}
                isLoading={false}
            />
        );
        expect(blank).not.toContain("Vehicle");

        const nulled = renderToStaticMarkup(
            <OrderTable
                orders={[{ ...baseOrder, vehicle_number: null }]}
                isLoading={false}
            />
        );
        expect(nulled).not.toContain("Vehicle");
    });

    it("does not invent vehicle_number from other order fields", () => {
        const markup = renderToStaticMarkup(
            <OrderTable
                orders={[
                    {
                        ...baseOrder,
                        vehicle: "MH00XX0000",
                        vehicle_no: "KA01AA1111",
                        driver: "Ravi",
                        delivery: { vehicle_number: "TN09ZZ9999", plate: "WB02YY2222" },
                        plate: "GJ03TT3333",
                    } as typeof baseOrder,
                ]}
                isLoading={false}
            />
        );
        expect(markup).not.toContain("Vehicle");
        expect(markup).not.toContain("MH00XX0000");
        expect(markup).not.toContain("KA01AA1111");
        expect(markup).not.toContain("TN09ZZ9999");
        expect(markup).not.toContain("GJ03TT3333");
    });
});
