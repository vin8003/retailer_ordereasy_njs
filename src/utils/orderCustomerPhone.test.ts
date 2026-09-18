import { describe, expect, it } from "vitest";
import { getOrderCustomerPhoneLabel } from "./orderCustomerPhone";

describe("getOrderCustomerPhoneLabel", () => {
    it("returns the trimmed customer.phone when BE sent a non-empty string", () => {
        expect(getOrderCustomerPhoneLabel({ customer: { phone: "9876543210" } })).toBe("9876543210");
        expect(getOrderCustomerPhoneLabel({ customer: { phone: "  +91 99887 76655  " } })).toBe("+91 99887 76655");
    });

    it("returns a trimmed top-level phone when customer.phone is absent", () => {
        expect(getOrderCustomerPhoneLabel({ phone: "9000011111" })).toBe("9000011111");
        expect(getOrderCustomerPhoneLabel({ phone: "  9000011111  " })).toBe("9000011111");
    });

    it("returns existing customer_phone when customer.phone and phone are absent", () => {
        expect(getOrderCustomerPhoneLabel({ customer_phone: "8111122222" })).toBe("8111122222");
        expect(getOrderCustomerPhoneLabel({ customer_phone: "  8111122222  " })).toBe("8111122222");
    });

    it("prefers customer.phone over top-level phone and customer_phone", () => {
        expect(
            getOrderCustomerPhoneLabel({
                customer: { phone: "7000000001" },
                phone: "7000000002",
                customer_phone: "7000000003",
            })
        ).toBe("7000000001");
    });

    it("returns null when phone is omitted, null, or blank", () => {
        expect(getOrderCustomerPhoneLabel({})).toBeNull();
        expect(getOrderCustomerPhoneLabel({ customer: {} })).toBeNull();
        expect(getOrderCustomerPhoneLabel({ customer: { phone: undefined } })).toBeNull();
        expect(getOrderCustomerPhoneLabel({ customer: { phone: null } })).toBeNull();
        expect(getOrderCustomerPhoneLabel({ customer: { phone: "" } })).toBeNull();
        expect(getOrderCustomerPhoneLabel({ customer: { phone: "   " } })).toBeNull();
        expect(getOrderCustomerPhoneLabel({ phone: null, customer_phone: "" })).toBeNull();
        expect(getOrderCustomerPhoneLabel({ customer_phone: "   " })).toBeNull();
    });

    it("does not invent phone from name, email, notes, or other contact fields", () => {
        expect(
            getOrderCustomerPhoneLabel({
                customer_name: "Ravi",
                customer_email: "ravi@example.com",
                notes: "Call on arrival",
                user: { phone: "9999999999" },
                customer_mobile: "8888888888",
                guest_mobile: "7777777777",
                customer: { first_name: "Ravi", last_name: "Kumar" },
            })
        ).toBeNull();
        expect(
            getOrderCustomerPhoneLabel({
                customer_name: "Ravi",
                customer_email: "ravi@example.com",
                notes: "Call on arrival",
                user: { phone: "9999999999" },
                customer_mobile: "8888888888",
                guest_mobile: "7777777777",
                customer: { first_name: "Ravi", phone: null },
                customer_phone: null,
            })
        ).toBeNull();
    });
});
