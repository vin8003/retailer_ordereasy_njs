import { describe, expect, it } from "vitest";
import { getSalesReturnTransporterName } from "./salesReturnTransporter";

describe("getSalesReturnTransporterName", () => {
    it("returns the trimmed transporter_name when BE sent a non-empty string", () => {
        expect(
            getSalesReturnTransporterName({ transporter_name: "Dummy Express Logistics" })
        ).toBe("Dummy Express Logistics");
        expect(
            getSalesReturnTransporterName({ transporter_name: "  Local Pickup Co  " })
        ).toBe("Local Pickup Co");
    });

    it("returns null when transporter_name is omitted, null, or blank", () => {
        expect(getSalesReturnTransporterName({})).toBeNull();
        expect(getSalesReturnTransporterName({ transporter_name: undefined })).toBeNull();
        expect(getSalesReturnTransporterName({ transporter_name: null })).toBeNull();
        expect(getSalesReturnTransporterName({ transporter_name: "" })).toBeNull();
        expect(getSalesReturnTransporterName({ transporter_name: "   " })).toBeNull();
    });

    it("does not invent transporter_name from nested transporter, driver, courier, notes, or reason", () => {
        expect(
            getSalesReturnTransporterName({
                transporter: { name: "Hidden Fleet" },
                driver_name: "Ravi",
                courier_name: "Dummy Courier",
                courier: { name: "Nested Courier" },
                vehicle_number: "MH-01-AB-1234",
                notes: "Pickup after 4pm",
                reason: "Damaged product",
                order_number: "OE-1001",
                customer_name: "Asha",
                return_number: "SRET-12",
            })
        ).toBeNull();
        expect(
            getSalesReturnTransporterName({
                transporter: { name: "Hidden Fleet" },
                notes: "Pickup after 4pm",
                reason: "Damaged product",
                transporter_name: null,
            })
        ).toBeNull();
    });
});
