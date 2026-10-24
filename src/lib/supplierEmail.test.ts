import { describe, expect, it } from "vitest";
import { supplierEmailError } from "./supplierEmail";

describe("supplierEmailError", () => {
    it("surfaces the backend's email message", () => {
        const error = { response: { data: { email: ["Enter a valid email address."] } } };
        expect(supplierEmailError(error)).toBe("Email: Enter a valid email address.");
        expect(supplierEmailError({ response: { data: { email: "Bad email" } } })).toBe("Email: Bad email");
    });

    it("falls back to a generic message for an unreadable email error", () => {
        expect(supplierEmailError({ response: { data: { email: [] } } })).toBe("Enter a valid supplier email");
    });

    it("returns null when the error is not about email", () => {
        expect(supplierEmailError({ response: { data: { company_name: ["Required"] } } })).toBeNull();
        expect(supplierEmailError(new Error("Network"))).toBeNull();
        expect(supplierEmailError(null)).toBeNull();
    });
});
