import { describe, expect, it } from "vitest";
import {
    collectWriteOffListRows,
    getWriteOffListReason,
    mapWriteOffListItem,
    parseWriteOffListItemProductId,
} from "./writeOffListReason";

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
            product_id: undefined,
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

    it("passes through product_id and never invents it from ledger-row id", () => {
        expect(
            mapWriteOffListItem({
                id: 9,
                product_id: 44,
                product_name: "Atta 10kg",
                reason: "damage",
            }).product_id
        ).toBe(44);
        expect(
            mapWriteOffListItem({
                id: 9,
                product_name: "Atta 10kg",
                reason: "damage",
            }).product_id
        ).toBeUndefined();
        expect(
            mapWriteOffListItem({
                id: 9,
                product_id: null,
                product_name: "Atta 10kg",
                reason: "damage",
            }).product_id
        ).toBeNull();
        expect(
            mapWriteOffListItem({
                id: 9,
                product_id: "abc",
                product_name: "Atta 10kg",
                reason: "damage",
            }).product_id
        ).toBeNull();
    });
});

describe("parseWriteOffListItemProductId", () => {
    it("echoes a positive integer product_id", () => {
        expect(parseWriteOffListItemProductId(44)).toBe(44);
        expect(parseWriteOffListItemProductId("44")).toBe(44);
    });

    it("returns null when missing, blank, or invalid and does not invent", () => {
        expect(parseWriteOffListItemProductId(undefined)).toBeNull();
        expect(parseWriteOffListItemProductId(null)).toBeNull();
        expect(parseWriteOffListItemProductId("")).toBeNull();
        expect(parseWriteOffListItemProductId(0)).toBeNull();
        expect(parseWriteOffListItemProductId(-4)).toBeNull();
        expect(parseWriteOffListItemProductId("sold")).toBeNull();
    });
});

describe("collectWriteOffListRows", () => {
    it("keeps write-off/damage reason rows and drops other ledger rows", () => {
        const items = collectWriteOffListRows([
            [
                {
                    id: 1,
                    product_id: 44,
                    product_name: "Atta 10kg",
                    reason: "damage",
                    log_type: "removed",
                },
                {
                    id: 2,
                    product_id: 44,
                    product_name: "Atta 10kg",
                    reason: "POS Sale: Order #9",
                    log_type: "sold",
                },
            ],
            { results: [{ id: 3, product_id: 51, reason: "expiry" }] },
        ]);
        expect(items.map((row) => row.id)).toEqual([1, 3]);
        expect(items[0].product_id).toBe(44);
        expect(items[1].reason).toBe("expiry");
    });

    it("does not invent product_id from ledger-row id on kept rows", () => {
        const items = collectWriteOffListRows([
            [{ id: 9, reason: "spoilage", product_name: "Rice 5kg" }],
        ]);
        expect(items).toHaveLength(1);
        expect(items[0].id).toBe(9);
        expect(items[0].product_id).toBeUndefined();
    });
});
