import { describe, expect, it } from "vitest";
import { getOrderDetailSalesmanName } from "./orderDetailSalesmanName";

describe("getOrderDetailSalesmanName", () => {
    it("returns the trimmed salesman_name when BE sent a non-empty string", () => {
        expect(getOrderDetailSalesmanName({ salesman_name: "Rahul" })).toBe("Rahul");
        expect(getOrderDetailSalesmanName({ salesman_name: "  Priya Shah  " })).toBe("Priya Shah");
    });

    it("returns null when salesman_name is omitted, null, or blank", () => {
        expect(getOrderDetailSalesmanName({})).toBeNull();
        expect(getOrderDetailSalesmanName({ salesman_name: undefined })).toBeNull();
        expect(getOrderDetailSalesmanName({ salesman_name: null })).toBeNull();
        expect(getOrderDetailSalesmanName({ salesman_name: "" })).toBeNull();
        expect(getOrderDetailSalesmanName({ salesman_name: "   " })).toBeNull();
    });

    it("does not invent salesman_name from nested salesman, id, customer, notes, or phone", () => {
        expect(
            getOrderDetailSalesmanName({
                salesman: { name: "Hidden Salesman" },
                salesman_id: 12,
                customer_name: "Ravi",
                notes: "internal remark",
                customer_phone: "9999999999",
                salesman_name: null,
            })
        ).toBeNull();
    });
});
