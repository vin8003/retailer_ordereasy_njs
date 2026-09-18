import { describe, expect, it } from "vitest";
import { getCustomerSezFlagLabel } from "./customerDetailSezFlag";

describe("getCustomerSezFlagLabel", () => {
    it("returns SEZ when BE sent sez_flag true", () => {
        expect(getCustomerSezFlagLabel({ sez_flag: true })).toBe("SEZ");
    });

    it("returns null when sez_flag is false, absent, or null", () => {
        expect(getCustomerSezFlagLabel({})).toBeNull();
        expect(getCustomerSezFlagLabel({ sez_flag: undefined })).toBeNull();
        expect(getCustomerSezFlagLabel({ sez_flag: null })).toBeNull();
        expect(getCustomerSezFlagLabel({ sez_flag: false })).toBeNull();
    });

    it("does not invent SEZ from gstin, notes, is_sez, or other fields", () => {
        expect(
            getCustomerSezFlagLabel({
                gstin: "29ABCDE1234F1Z5",
                gst_number: "29ABCDE1234F1Z5",
                notes: "SEZ buyer",
                is_blacklisted: false,
                customer_name: "Ravi",
                phone_number: "9999999999",
                email: "shop@example.com",
                current_balance: 2500,
                is_sez: true,
                sez: true,
            })
        ).toBeNull();
    });
});
