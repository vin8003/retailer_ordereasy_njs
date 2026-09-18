import { describe, expect, it } from "vitest";
import { getInventoryLedgerCreatedByName } from "./inventoryLedgerCreatedBy";

describe("getInventoryLedgerCreatedByName", () => {
    it("returns the trimmed created_by_name when BE sent a non-empty string", () => {
        expect(getInventoryLedgerCreatedByName({ created_by_name: "Ravi Kumar" })).toBe(
            "Ravi Kumar"
        );
        expect(getInventoryLedgerCreatedByName({ created_by_name: "  Priya  " })).toBe("Priya");
    });

    it("returns null when created_by_name is omitted, null, or blank", () => {
        expect(getInventoryLedgerCreatedByName({})).toBeNull();
        expect(getInventoryLedgerCreatedByName({ created_by_name: undefined })).toBeNull();
        expect(getInventoryLedgerCreatedByName({ created_by_name: null })).toBeNull();
        expect(getInventoryLedgerCreatedByName({ created_by_name: "" })).toBeNull();
        expect(getInventoryLedgerCreatedByName({ created_by_name: "   " })).toBeNull();
    });

    it("does not invent created_by_name from created_by, reason, or product_name", () => {
        expect(
            getInventoryLedgerCreatedByName({
                created_by: "user-44",
                reason: "damage",
                product_name: "Atta 10kg",
                log_type: "damaged",
            })
        ).toBeNull();
        expect(
            getInventoryLedgerCreatedByName({
                created_by: "user-44",
                reason: "damage",
                created_by_name: null,
            })
        ).toBeNull();
    });
});
