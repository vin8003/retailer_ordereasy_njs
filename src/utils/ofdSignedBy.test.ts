import { describe, expect, it } from "vitest";
import { getOfdSignedByLabel, isOfdCloseDisplay } from "./ofdSignedBy";

describe("isOfdCloseDisplay", () => {
    it("is true for delivery-mode OFD and delivered close display", () => {
        expect(isOfdCloseDisplay("out_for_delivery", "delivery")).toBe(true);
        expect(isOfdCloseDisplay("OUT_FOR_DELIVERY")).toBe(true);
        expect(isOfdCloseDisplay("delivered", "delivery")).toBe(true);
        expect(isOfdCloseDisplay("DELIVERED")).toBe(true);
    });

    it("is false for pickup, missing status, or non-close statuses", () => {
        expect(isOfdCloseDisplay()).toBe(false);
        expect(isOfdCloseDisplay(null)).toBe(false);
        expect(isOfdCloseDisplay("")).toBe(false);
        expect(isOfdCloseDisplay("out_for_delivery", "pickup")).toBe(false);
        expect(isOfdCloseDisplay("delivered", "pickup")).toBe(false);
        expect(isOfdCloseDisplay("packed", "delivery")).toBe(false);
        expect(isOfdCloseDisplay("pending", "delivery")).toBe(false);
        expect(isOfdCloseDisplay("cancelled", "delivery")).toBe(false);
    });
});

describe("getOfdSignedByLabel", () => {
    it("returns the trimmed signed_by when BE sent a present non-empty value", () => {
        expect(getOfdSignedByLabel({ signed_by: "Asha" })).toBe("Asha");
        expect(getOfdSignedByLabel({ signed_by: "  Ravi  " })).toBe("Ravi");
        expect(getOfdSignedByLabel({ signed_by: 12 })).toBe("12");
        expect(getOfdSignedByLabel({ signed_by: 0 })).toBe("0");
        expect(getOfdSignedByLabel({ signed_by: "0" })).toBe("0");
    });

    it("returns null when signed_by is omitted, null, or blank", () => {
        expect(getOfdSignedByLabel({})).toBeNull();
        expect(getOfdSignedByLabel({ signed_by: undefined })).toBeNull();
        expect(getOfdSignedByLabel({ signed_by: null })).toBeNull();
        expect(getOfdSignedByLabel({ signed_by: "" })).toBeNull();
        expect(getOfdSignedByLabel({ signed_by: "   " })).toBeNull();
    });

    it("does not invent signed_by from signer, POD, nested delivery_info, or names", () => {
        expect(
            getOfdSignedByLabel({
                signed_by_name: "Asha",
                signer: "Ravi",
                signature: "sig.png",
                received_by: "Meera",
                receiver_name: "Meera",
                pod_signed_by: "Asha",
                delivery_info: { signed_by: "Nested" },
                customer_name: "Customer",
                driver_name: "Driver",
                delivery_person_name: "Courier",
                signed_by: null,
            })
        ).toBeNull();
    });

    it("returns null for non-finite numeric signed_by", () => {
        expect(getOfdSignedByLabel({ signed_by: Number.NaN })).toBeNull();
        expect(getOfdSignedByLabel({ signed_by: Number.POSITIVE_INFINITY })).toBeNull();
    });
});
