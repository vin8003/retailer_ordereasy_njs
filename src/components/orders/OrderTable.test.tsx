import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: () => undefined }),
}));

import { OrderTable } from "./OrderTable";

const dummyOfdRow = {
    id: 1,
    order_number: "OE-1001",
    total_amount: 120,
    status: "out_for_delivery",
    created_at: "2026-09-18T10:00:00.000Z",
    refund_amount: 0,
    net_amount: 120,
    is_returned: false,
    gate_pass: "GP-1042",
};

describe("OrderTable OFD gate_pass (dummy rows)", () => {
    it("shows Gate pass on desktop and mobile OFD rows when BE sent gate_pass", () => {
        const markup = renderToStaticMarkup(
            <OrderTable orders={[dummyOfdRow]} isLoading={false} />
        );
        const matches = markup.match(/Gate pass GP-1042/g) ?? [];
        expect(matches.length).toBeGreaterThanOrEqual(2);
        expect(markup).not.toContain("ordereasy.win");
    });

    it("omits Gate pass on pending rows and on OFD rows without a present value", () => {
        const markup = renderToStaticMarkup(
            <OrderTable
                orders={[
                    { ...dummyOfdRow, id: 2, status: "pending", gate_pass: "GP-1042" },
                    { ...dummyOfdRow, id: 3, order_number: "OE-1003", gate_pass: null },
                    {
                        ...dummyOfdRow,
                        id: 4,
                        order_number: "OE-1004",
                        gate_pass: undefined,
                        gate_pass_number: "GP-HIDDEN",
                    } as typeof dummyOfdRow & { gate_pass_number: string },
                ]}
                isLoading={false}
            />
        );
        expect(markup).not.toContain("Gate pass");
        expect(markup).not.toContain("GP-HIDDEN");
    });
});
