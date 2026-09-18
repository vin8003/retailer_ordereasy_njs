import { describe, expect, it } from "vitest";
import {
    getWriteOffDetailCreatedByName,
    mapWriteOffDetail,
    unwrapWriteOffDetail,
} from "./writeOffDetailCreatedBy";

describe("getWriteOffDetailCreatedByName", () => {
    it("returns the trimmed created_by_name when BE sent a non-empty string", () => {
        expect(getWriteOffDetailCreatedByName({ created_by_name: "Ravi Kumar" })).toBe(
            "Ravi Kumar"
        );
        expect(getWriteOffDetailCreatedByName({ created_by_name: "  Priya  " })).toBe("Priya");
    });

    it("returns null when created_by_name is omitted, null, or blank", () => {
        expect(getWriteOffDetailCreatedByName({})).toBeNull();
        expect(getWriteOffDetailCreatedByName({ created_by_name: undefined })).toBeNull();
        expect(getWriteOffDetailCreatedByName({ created_by_name: null })).toBeNull();
        expect(getWriteOffDetailCreatedByName({ created_by_name: "" })).toBeNull();
        expect(getWriteOffDetailCreatedByName({ created_by_name: "   " })).toBeNull();
    });

    it("does not invent created_by_name from created_by, reason, or product_name", () => {
        expect(
            getWriteOffDetailCreatedByName({
                created_by: "user-44",
                reason: "damage",
                product_name: "Atta 10kg",
                log_type: "damaged",
                quantity_change: "-2",
            })
        ).toBeNull();
        expect(
            getWriteOffDetailCreatedByName({
                created_by: "user-44",
                reason: "damage",
                created_by_name: null,
            })
        ).toBeNull();
    });
});

describe("mapWriteOffDetail", () => {
    it("passes through optional created_by_name without inventing from created_by", () => {
        expect(
            mapWriteOffDetail({
                id: 9,
                product_name: "Atta 10kg",
                log_type: "damaged",
                quantity_change: "-2",
                created_by: "user-44",
                created_by_name: "  Ravi Kumar  ",
            })
        ).toEqual({
            id: 9,
            product_name: "Atta 10kg",
            log_type: "damaged",
            quantity_change: "-2",
            created_at: undefined,
            created_by: "user-44",
            created_by_name: "  Ravi Kumar  ",
            reason: undefined,
        });
        expect(
            mapWriteOffDetail({
                id: 10,
                created_by: "user-44",
                product_name: "Rice 5kg",
                created_by_name: null,
            }).created_by_name
        ).toBeNull();
        expect(
            mapWriteOffDetail({
                id: 11,
                created_by: "user-44",
                product_name: "Oil 1L",
            }).created_by_name
        ).toBeUndefined();
    });
});

describe("unwrapWriteOffDetail", () => {
    it("maps a dummy object payload and finds a matching list row", () => {
        expect(
            unwrapWriteOffDetail(
                {
                    id: 12,
                    product_name: "Sugar 1kg",
                    created_by_name: "Anita",
                },
                12
            )
        ).toEqual({
            id: 12,
            product_name: "Sugar 1kg",
            quantity_change: undefined,
            log_type: undefined,
            created_at: undefined,
            created_by: undefined,
            created_by_name: "Anita",
            reason: undefined,
        });
        expect(
            unwrapWriteOffDetail(
                {
                    results: [
                        { id: 1, created_by: "user-1" },
                        { id: 12, created_by_name: "Anita" },
                    ],
                },
                12
            )?.created_by_name
        ).toBe("Anita");
    });

    it("returns null for missing dummy payloads and does not invent a name", () => {
        expect(unwrapWriteOffDetail(null, 12)).toBeNull();
        expect(unwrapWriteOffDetail([{ id: 3, created_by: "user-3" }], 12)).toBeNull();
        expect(unwrapWriteOffDetail({ created_by: "user-12" }, 12)?.created_by_name).toBeUndefined();
    });
});
