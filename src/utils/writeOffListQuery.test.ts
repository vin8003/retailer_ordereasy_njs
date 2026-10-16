import { describe, expect, it } from "vitest";
import {
    WRITE_OFF_LIST_REASONS,
    buildWriteOffListLedgerQuery,
    isWriteOffListRow,
    parseWriteOffListProductId,
    parseWriteOffListReason,
} from "./writeOffListQuery";

describe("parseWriteOffListProductId", () => {
    it("accepts an explicit positive integer product_id", () => {
        expect(parseWriteOffListProductId("44")).toBe(44);
        expect(parseWriteOffListProductId(" 7 ")).toBe(7);
    });

    it("returns null for missing, blank, or non-integer values", () => {
        expect(parseWriteOffListProductId(null)).toBeNull();
        expect(parseWriteOffListProductId(undefined)).toBeNull();
        expect(parseWriteOffListProductId("")).toBeNull();
        expect(parseWriteOffListProductId("   ")).toBeNull();
        expect(parseWriteOffListProductId("abc")).toBeNull();
        expect(parseWriteOffListProductId("12.5")).toBeNull();
        expect(parseWriteOffListProductId("-3")).toBeNull();
        expect(parseWriteOffListProductId("0")).toBeNull();
    });

    it("does not invent a product_id from a ledger-row id string that is not product_id", () => {
        expect(parseWriteOffListProductId(null)).toBeNull();
    });
});

describe("parseWriteOffListReason", () => {
    it("accepts canonical write-off / damage reasons", () => {
        expect(parseWriteOffListReason("damage")).toBe("damage");
        expect(parseWriteOffListReason(" expiry ")).toBe("expiry");
        expect(parseWriteOffListReason("spoilage")).toBe("spoilage");
        expect(WRITE_OFF_LIST_REASONS).toEqual(["damage", "expiry", "spoilage"]);
    });

    it("returns null for blank or unknown reasons and does not invent", () => {
        expect(parseWriteOffListReason(null)).toBeNull();
        expect(parseWriteOffListReason("")).toBeNull();
        expect(parseWriteOffListReason("sold")).toBeNull();
        expect(parseWriteOffListReason("POS Sale: Order #1")).toBeNull();
        expect(parseWriteOffListReason("shrinkage")).toBeNull();
    });
});

describe("buildWriteOffListLedgerQuery", () => {
    const ALL = "damage,expiry,spoilage";

    it("asks for every write-off reason in one GET so the BE cap applies once", () => {
        expect(buildWriteOffListLedgerQuery({})).toEqual({ reason: ALL });
    });

    it("uses a single reason when the URL already has a write-off reason", () => {
        expect(buildWriteOffListLedgerQuery({ reason: "damage" })).toEqual({ reason: "damage" });
    });

    it("includes product_id only when already parsed; never invents it", () => {
        expect(buildWriteOffListLedgerQuery({ productId: 44, reason: "expiry" })).toEqual({
            reason: "expiry",
            product_id: 44,
        });
        for (const productId of [null, 0, -1]) {
            expect(buildWriteOffListLedgerQuery({ productId })).toEqual({ reason: ALL });
        }
    });

    it("ignores unknown reason and still filters to write-off reasons", () => {
        expect(buildWriteOffListLedgerQuery({ reason: "sold" })).toEqual({ reason: ALL });
    });
});

describe("isWriteOffListRow", () => {
    it("keeps write-off/damage reason rows", () => {
        expect(isWriteOffListRow({ reason: "damage" })).toBe(true);
        expect(isWriteOffListRow({ reason: "expiry" })).toBe(true);
        expect(isWriteOffListRow({ reason: "spoilage" })).toBe(true);
    });

    it("drops sale/purchase/other ledger rows and does not infer from log_type", () => {
        expect(isWriteOffListRow({ reason: "POS Sale: Order #9" })).toBe(false);
        expect(isWriteOffListRow({ reason: "added" })).toBe(false);
        expect(isWriteOffListRow({ reason: null })).toBe(false);
        expect(isWriteOffListRow({})).toBe(false);
        expect(isWriteOffListRow({ reason: "POS Sale: Order #9" })).toBe(false);
        expect(
            isWriteOffListRow({
                reason: null,
                log_type: "damaged",
            } as { reason: null; log_type: string })
        ).toBe(false);
    });
});
