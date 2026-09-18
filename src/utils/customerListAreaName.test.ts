import { describe, expect, it } from "vitest";
import { getCustomerAreaNameLabel } from "./customerListAreaName";

describe("getCustomerAreaNameLabel", () => {
    it("returns the trimmed area_name when BE sent a non-empty string", () => {
        expect(getCustomerAreaNameLabel({ area_name: "Sector 21" })).toBe("Sector 21");
        expect(getCustomerAreaNameLabel({ area_name: "  Andheri West  " })).toBe("Andheri West");
    });

    it("returns null when area_name is omitted, null, or blank", () => {
        expect(getCustomerAreaNameLabel({})).toBeNull();
        expect(getCustomerAreaNameLabel({ area_name: undefined })).toBeNull();
        expect(getCustomerAreaNameLabel({ area_name: null })).toBeNull();
        expect(getCustomerAreaNameLabel({ area_name: "" })).toBeNull();
        expect(getCustomerAreaNameLabel({ area_name: "   " })).toBeNull();
    });

    it("does not invent area_name from address, city, locality, area, or area_id", () => {
        expect(
            getCustomerAreaNameLabel({
                address: "12 Dummy Street",
                city: "Mumbai",
                locality: "Bandra",
                area: { name: "Hidden Area" },
                area_id: 99,
                area_name: null,
            })
        ).toBeNull();
    });

    it("does not invent area_name from OE-306 email or credit scalars", () => {
        expect(
            getCustomerAreaNameLabel({
                email: "shop@example.com",
                credit_limit: 10000,
                credit_due_days: 15,
                area_name: null,
            })
        ).toBeNull();
    });
});
