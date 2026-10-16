import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ExpiringBatchesPanel } from "./ExpiringBatchesPanel";

function render(props: React.ComponentProps<typeof ExpiringBatchesPanel>) {
    return renderToStaticMarkup(<ExpiringBatchesPanel {...props} />);
}

describe("ExpiringBatchesPanel", () => {
    it("renders product_name, batch_number, expiry_date, and quantity", () => {
        const markup = render({
            batches: [
                {
                    product_name: "Milk",
                    batch_number: "B1",
                    expiry_date: "2026-09-20",
                    quantity: "3.000",
                    is_expired: false,
                },
            ],
        });
        expect(markup).toContain("Milk");
        expect(markup).toContain("B1");
        expect(markup).toContain("2026-09-20");
        expect(markup).toContain("3.000");
        expect(markup).not.toContain("Expired");
        expect(markup).toContain("expiring-batches-panel");
    });

    it("shows an Expired badge only when is_expired === true", () => {
        const expired = render({
            batches: [
                {
                    product_name: "Bread",
                    batch_number: "STALE",
                    expiry_date: "2026-09-01",
                    quantity: "8.000",
                    is_expired: true,
                },
            ],
        });
        expect(expired).toContain("Expired");
        expect(expired).toContain("Bread");

        const notExpired = render({
            batches: [
                {
                    product_name: "Curd",
                    batch_number: "SOON",
                    expiry_date: "2000-01-01",
                    quantity: "1",
                    is_expired: false,
                },
            ],
        });
        expect(notExpired).toContain("Curd");
        expect(notExpired).not.toContain("Expired");
    });

    it("shows an empty state for []", () => {
        const markup = render({ batches: [] });
        expect(markup).toContain("expiring-batches-empty");
        expect(markup).toContain("No expiring batches");
        expect(markup).not.toContain("<td");
    });

    it("hides on 401/403 so daily summary is not replaced", () => {
        expect(render({ errorStatus: 401, batches: [{ product_name: "Milk" }] })).toBe("");
        expect(render({ errorStatus: 403, batches: [] })).toBe("");
        expect(render({ errorStatus: 500, batches: [{ product_name: "Milk" }] })).toBe("");
    });
});
