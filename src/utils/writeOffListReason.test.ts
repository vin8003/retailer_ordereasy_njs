import { describe, expect, it } from "vitest";
import { getWriteOffListReason, mapWriteOffListItem } from "./writeOffListReason";

describe("getWriteOffListReason", () => {
    it("returns the trimmed reason when BE sent a non-empty string", () => {
        expect(getWriteOffListReason({ reason: "damage" })).toBe("damage");
        expect(getWriteOffListReason({ reason: "  expiry leftover  " })).toBe("expiry leftover");
    });

    it("returns null when reason is omitted, null, or blank", () => {
        expect(getWriteOffListReason({})).toBeNull();
        expect(getWriteOffListReason({ reason: undefined })).toBeNull();
        expect(getWriteOffListReason({ reason: null })).toBeNull();
        expect(getWriteOffListReason({ reason: "" })).toBeNull();
        expect(getWriteOffListReason({ reason: "   " })).toBeNull();
    });

    it("does not invent reason from log_type, product_name, or quantity", () => {
        expect(
            getWriteOffListReason({
                log_type: "damaged",
                product_name: "Atta 10kg",
                quantity_change: "-2",
            })
        ).toBeNull();
        expect(
            getWriteOffListReason({
                log_type: "damaged",
                product_name: "Atta 10kg",
                quantity_change: "-2",
                reason: null,
            })
        ).toBeNull();
    });
});

describe("mapWriteOffListItem", () => {
    it("passes through optional reason without inventing from log_type", () => {
        expect(
            mapWriteOffListItem({
                id: 9,
                product_name: "Atta 10kg",
                log_type: "damaged",
                quantity_change: "-2",
                reason: "  expiry  ",
            })
        ).toEqual({
            id: 9,
            product_name: "Atta 10kg",
            log_type: "damaged",
            quantity_change: "-2",
            created_at: undefined,
            reason: "  expiry  ",
        });
        expect(
            mapWriteOffListItem({
                id: 10,
                log_type: "spoiled",
                product_name: "Rice 5kg",
                reason: null,
            }).reason
        ).toBeNull();
        expect(
            mapWriteOffListItem({
                id: 11,
                log_type: "expired",
                product_name: "Oil 1L",
            }).reason
        ).toBeUndefined();
    });
});
