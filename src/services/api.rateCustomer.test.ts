import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import api, { customerService } from "./api";

describe("rating a customer", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("posts to the backend's orders/<id>/rate-customer/ route", async () => {
        const post = vi.spyOn(api, "post").mockResolvedValue({ data: {} });

        await customerService.rateCustomer(41, 4, "Paid on time");

        expect(post).toHaveBeenCalledWith("orders/41/rate-customer/", { rating: 4, comment: "Paid on time" });
    });

    it("is how the POS rates the customer after a bill (it used a route that does not exist)", () => {
        const pos = readFileSync(path.resolve(process.cwd(), "src/app/dashboard/pos/page.tsx"), "utf8");

        expect(pos).toContain("customerService.rateCustomer(activeSession.completedOrder.id, selectedRating, ratingComment)");
        expect(pos).not.toContain("retailer-rating");
    });
});
