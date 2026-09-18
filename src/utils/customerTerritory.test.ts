import { describe, expect, it } from "vitest";
import { getCustomerTerritoryLabel } from "./customerTerritory";

describe("getCustomerTerritoryLabel", () => {
    it("returns the trimmed territory when BE sent a non-empty string", () => {
        expect(getCustomerTerritoryLabel({ territory: "Jaipur West" })).toBe("Jaipur West");
        expect(getCustomerTerritoryLabel({ territory: "  North Zone  " })).toBe("North Zone");
    });

    it("returns null when territory is omitted, null, or blank", () => {
        expect(getCustomerTerritoryLabel({})).toBeNull();
        expect(getCustomerTerritoryLabel({ territory: undefined })).toBeNull();
        expect(getCustomerTerritoryLabel({ territory: null })).toBeNull();
        expect(getCustomerTerritoryLabel({ territory: "" })).toBeNull();
        expect(getCustomerTerritoryLabel({ territory: "   " })).toBeNull();
    });

    it("does not invent territory from notes, nickname, name, phone, email, or nested territory", () => {
        expect(
            getCustomerTerritoryLabel({
                notes: "Prefers morning delivery",
                nickname: "Sharma Ji",
                customer_name: "Ravi",
                phone_number: "9999999999",
                email: "ravi@example.com",
                address: "Bharatpur",
                territory_name: "Hidden Zone",
                territory_id: 7,
                territory: null,
            })
        ).toBeNull();
        expect(
            getCustomerTerritoryLabel({
                notes: "Prefers morning delivery",
                nickname: "Sharma Ji",
                customer_name: "Ravi",
                phone_number: "9999999999",
                email: "ravi@example.com",
            })
        ).toBeNull();
    });
});
