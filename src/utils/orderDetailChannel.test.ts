import { describe, expect, it } from "vitest";
import { getOrderDetailChannelLabel } from "./orderDetailChannel";

describe("getOrderDetailChannelLabel", () => {
    it("returns the trimmed channel when BE sent a present non-empty value", () => {
        expect(getOrderDetailChannelLabel({ channel: "app" })).toBe("app");
        expect(getOrderDetailChannelLabel({ channel: "  pos  " })).toBe("pos");
        expect(getOrderDetailChannelLabel({ channel: "whatsapp" })).toBe("whatsapp");
    });

    it("returns null when channel is omitted, null, or blank", () => {
        expect(getOrderDetailChannelLabel({})).toBeNull();
        expect(getOrderDetailChannelLabel({ channel: undefined })).toBeNull();
        expect(getOrderDetailChannelLabel({ channel: null })).toBeNull();
        expect(getOrderDetailChannelLabel({ channel: "" })).toBeNull();
        expect(getOrderDetailChannelLabel({ channel: "   " })).toBeNull();
    });

    it("does not invent channel from source, notes, phone, or order_number", () => {
        expect(
            getOrderDetailChannelLabel({
                source: "pos",
                notes: "Leave at gate",
                customer_phone: "9999999999",
                phone: "8888888888",
                order_number: "OE-1001",
                channel: null,
            })
        ).toBeNull();
    });
});
