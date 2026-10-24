import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { POS_DEFAULT_RATING, customerCheckUpdate } from "./posCustomer";

const pos = () => readFileSync(path.resolve(process.cwd(), "src/app/dashboard/pos/page.tsx"), "utf8");

describe("POS rating box", () => {
    it("starts above 0 stars, which would blacklist the customer", () => {
        expect(POS_DEFAULT_RATING).toBe(5);
    });

    it("starts there on the first bill of a session too (it opened at 0 stars)", () => {
        const source = pos();

        expect(source).toContain("useState<number>(POS_DEFAULT_RATING)");
        expect(source).toContain("setSelectedRating(POS_DEFAULT_RATING)");
        expect(source).not.toContain("useState<number>(0)");
    });
});

describe("customerCheckUpdate", () => {
    it("keeps a name the cashier typed while the mobile number was checked", () => {
        expect(customerCheckUpdate("Meena", { status: "returning_guest", name: "Walk-in" })).toEqual({
            verificationStatus: "returning_guest",
            customerName: "Meena",
        });
        expect(customerCheckUpdate("Meena", { status: "new", name: null })).toEqual({
            verificationStatus: "new",
            customerName: "Meena",
        });
    });

    it("fills an empty name with the saved one", () => {
        expect(customerCheckUpdate("", { status: "verified", name: "Asha" })).toEqual({
            verificationStatus: "verified",
            customerName: "Asha",
        });
        expect(customerCheckUpdate("", { status: "new" })).toEqual({ verificationStatus: "new", customerName: "" });
    });

    it("is applied to the session as it is when the check returns, not as it was when it started", () => {
        expect(pos()).toContain("customerCheckUpdate(s.customerName, data)");
    });
});
