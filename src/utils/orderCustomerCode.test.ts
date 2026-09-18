import { describe, expect, it } from "vitest";
import { getCustomerCodeLabel } from "./orderCustomerCode";

describe("getCustomerCodeLabel", () => {
    it("returns the trimmed customer_code when BE sent a non-empty string", () => {
        expect(getCustomerCodeLabel({ customer_code: "CUST-1042" })).toBe("CUST-1042");
        expect(getCustomerCodeLabel({ customer_code: "  WALK-12  " })).toBe("WALK-12");
    });

    it("returns null when customer_code is omitted, null, or blank", () => {
        expect(getCustomerCodeLabel({})).toBeNull();
        expect(getCustomerCodeLabel({ customer_code: undefined })).toBeNull();
        expect(getCustomerCodeLabel({ customer_code: null })).toBeNull();
        expect(getCustomerCodeLabel({ customer_code: "" })).toBeNull();
        expect(getCustomerCodeLabel({ customer_code: "   " })).toBeNull();
    });

    it("does not invent customer_code from name, nested customer, or id", () => {
        expect(
            getCustomerCodeLabel({
                customer_name: "Ravi",
                customer: { first_name: "Ravi", last_name: "K", username: "ravi", customer_code: "NESTED" },
                id: 99,
                customer_code: null,
            })
        ).toBeNull();
    });
});
