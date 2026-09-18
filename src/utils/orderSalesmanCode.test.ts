import { describe, expect, it } from "vitest";
import { getSalesmanCodeLabel } from "./orderSalesmanCode";

describe("getSalesmanCodeLabel", () => {
    it("returns the salesman_code text when BE sent a present non-empty value", () => {
        expect(getSalesmanCodeLabel({ salesman_code: "SM-1042" })).toBe("SM-1042");
        expect(getSalesmanCodeLabel({ salesman_code: "  WALK-12  " })).toBe("WALK-12");
        expect(getSalesmanCodeLabel({ salesman_code: 88 })).toBe("88");
        expect(getSalesmanCodeLabel({ salesman_code: "0" })).toBe("0");
        expect(getSalesmanCodeLabel({ salesman_code: 0 })).toBe("0");
    });

    it("returns null when salesman_code is omitted, null, or blank", () => {
        expect(getSalesmanCodeLabel({})).toBeNull();
        expect(getSalesmanCodeLabel({ salesman_code: undefined })).toBeNull();
        expect(getSalesmanCodeLabel({ salesman_code: null })).toBeNull();
        expect(getSalesmanCodeLabel({ salesman_code: "" })).toBeNull();
        expect(getSalesmanCodeLabel({ salesman_code: "   " })).toBeNull();
    });

    it("does not invent salesman_code from name, nested salesman, salesman_id, or id", () => {
        expect(
            getSalesmanCodeLabel({
                salesman_name: "Ravi",
                salesman_id: 55,
                salesman: { id: 55, code: "NESTED", name: "Ravi" },
                customer_name: "Anita",
                notes: "SM-999",
                id: 99,
                salesman_code: null,
            })
        ).toBeNull();
    });

    it("returns null for non-finite numeric salesman_code", () => {
        expect(getSalesmanCodeLabel({ salesman_code: Number.NaN })).toBeNull();
        expect(getSalesmanCodeLabel({ salesman_code: Number.POSITIVE_INFINITY })).toBeNull();
    });
});
