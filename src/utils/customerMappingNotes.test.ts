import { describe, expect, it } from "vitest";
import { getCustomerMappingNotes } from "./customerMappingNotes";

describe("getCustomerMappingNotes", () => {
    it("returns the trimmed mapping notes when BE sent a non-empty string", () => {
        expect(getCustomerMappingNotes({ notes: "Prefers morning delivery" })).toBe(
            "Prefers morning delivery"
        );
        expect(getCustomerMappingNotes({ notes: "  COD leftover  " })).toBe("COD leftover");
    });

    it("returns null when notes is omitted, null, or blank", () => {
        expect(getCustomerMappingNotes({})).toBeNull();
        expect(getCustomerMappingNotes({ notes: undefined })).toBeNull();
        expect(getCustomerMappingNotes({ notes: null })).toBeNull();
        expect(getCustomerMappingNotes({ notes: "" })).toBeNull();
        expect(getCustomerMappingNotes({ notes: "   " })).toBeNull();
    });

    it("does not invent notes from nickname, name, phone, email, or balance", () => {
        expect(
            getCustomerMappingNotes({
                nickname: "Sharma Ji",
                customer_name: "Ravi",
                phone_number: "9999999999",
                email: "ravi@example.com",
                current_balance: 2500,
            })
        ).toBeNull();
        expect(
            getCustomerMappingNotes({
                nickname: "Sharma Ji",
                customer_name: "Ravi",
                phone_number: "9999999999",
                email: "ravi@example.com",
                current_balance: 2500,
                notes: null,
            })
        ).toBeNull();
    });
});
