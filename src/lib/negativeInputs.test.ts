/** Negative and edge inputs for the password reset, delivery fee and order link helpers. */
import { describe, expect, it } from "vitest";
import {
    MAX_DELIVERY_FEE_TIERS,
    parseDeliveryFeeMode,
    previewDeliveryFee,
    tiersFromApi,
    tiersToPayload,
    validateDeliveryFeeSettings,
} from "./deliveryFees";
import { orderDetailsHref, parseOrderNumberFromText } from "./orderLinks";
import { normalizeOtpInput, requestCodeSchema, resetErrorMessage, resetPasswordSchema } from "./passwordReset";

const firstIssue = (r: { success: boolean; error?: { issues: { message: string; path: PropertyKey[] }[] } }) =>
    r.error?.issues[0];

describe("password reset form refuses bad input", () => {
    it.each(["", "   "])("identifier %j is required", (identifier) => {
        expect(firstIssue(requestCodeSchema.safeParse({ identifier }))?.message).toBe(
            "Enter your username, phone number or email",
        );
    });

    it.each(["12345", "1234567", "12a456", " 12345", ""])("otp %j is not a 6-digit code", (otp_code) => {
        const r = resetPasswordSchema.safeParse({ otp_code, new_password: "longenough", confirm_password: "longenough" });
        expect(firstIssue(r)).toMatchObject({ message: "Enter the 6-digit code", path: ["otp_code"] });
    });

    it("password shorter than 8 is refused", () => {
        const r = resetPasswordSchema.safeParse({ otp_code: "123456", new_password: "short7c", confirm_password: "short7c" });
        expect(firstIssue(r)).toMatchObject({ message: "Password must be at least 8 characters", path: ["new_password"] });
    });

    it("mismatched confirmation is flagged on confirm_password", () => {
        const r = resetPasswordSchema.safeParse({ otp_code: "123456", new_password: "longenough", confirm_password: "longenougH" });
        expect(firstIssue(r)).toMatchObject({ message: "Passwords don't match", path: ["confirm_password"] });
    });

    it("empty confirmation is refused", () => {
        const r = resetPasswordSchema.safeParse({ otp_code: "123456", new_password: "longenough", confirm_password: "" });
        expect(r.success).toBe(false);
    });

    it("otp input strips non-digits and caps at 6", () => {
        expect(normalizeOtpInput("12 3-4a56789")).toBe("123456");
        expect(normalizeOtpInput("abc")).toBe("");
    });
});

describe("reset error messages", () => {
    const e = (status: number, data?: unknown) => ({ response: { status, data } });
    it("429 always gets the wait message", () => {
        expect(resetErrorMessage(e(429, { error: "x" }), "fb")).toMatch(/Too many attempts/);
    });
    it("an HTML error page never reaches the user", () => {
        expect(resetErrorMessage(e(500, "<html>Server Error</html>"), "fallback")).toBe("fallback");
    });
    it("uses error, then detail, then the first field message", () => {
        expect(resetErrorMessage(e(400, { error: "Bad code" }), "fb")).toBe("Bad code");
        expect(resetErrorMessage(e(400, { detail: "Expired" }), "fb")).toBe("Expired");
        expect(resetErrorMessage(e(400, { otp_code: ["Invalid code"] }), "fb")).toBe("Invalid code");
    });
    it.each([null, undefined, new Error("network"), e(400, {}), e(400, { x: [1] })])("falls back for %j", (err) => {
        expect(resetErrorMessage(err, "fb")).toBe("fb");
    });
});

describe("distance delivery settings are refused like the backend", () => {
    const row = (upToKm: string, fee: string) => ({ upToKm, fee });
    it("flat mode is never blocked", () => {
        expect(validateDeliveryFeeSettings("flat", [row("", "")], -1)).toBeNull();
    });
    it.each(["", "0", "-1", "500.01", "abc"])("tier distance %j is refused", (upTo) => {
        expect(validateDeliveryFeeSettings("distance", [row(upTo, "10")], 0)).toBe(
            "Tier 1: enter a distance between 0 and 500 km.",
        );
    });
    it.each(["", "-0.5", "x"])("tier fee %j is refused", (fee) => {
        expect(validateDeliveryFeeSettings("distance", [row("3", fee)], 0)).toBe("Tier 1: enter a fee of 0 or more.");
    });
    it("duplicate tier ends are refused", () => {
        expect(validateDeliveryFeeSettings("distance", [row("3", "10"), row("3.00", "20")], 0)).toBe("Two tiers end at 3 km.");
    });
    it("too many tiers are refused", () => {
        const tiers = Array.from({ length: MAX_DELIVERY_FEE_TIERS + 1 }, (_, i) => row(String(i + 1), "10"));
        expect(validateDeliveryFeeSettings("distance", tiers, 0)).toMatch(/At most 10/);
    });
    it.each([-1, NaN])("per-km rate %s is refused", (perKm) => {
        expect(validateDeliveryFeeSettings("distance", [row("3", "10")], perKm)).toBe("Per-km rate must be 0 or more.");
    });
    it("no tiers and no per-km rate is refused", () => {
        expect(validateDeliveryFeeSettings("distance", [], 0)).toBe("Add at least one distance tier or a per-km rate.");
    });
    it("unknown mode and malformed API tiers fall back safely", () => {
        expect(parseDeliveryFeeMode("weird")).toBe("flat");
        expect(tiersFromApi("{not json")).toEqual([]);
        expect(tiersFromApi({ up_to_km: 1 })).toEqual([]);
        expect(tiersFromApi([null, 5, { up_to_km: 2, fee: 10 }])).toEqual([{ upToKm: "2", fee: "10" }]);
    });
    it("payload drops half-typed rows and sorts by distance", () => {
        expect(tiersToPayload([row("5", "40"), row("", "10"), row("2", "")
            , row("1", "0")])).toBe('[{"up_to_km":1,"fee":0},{"up_to_km":5,"fee":40}]');
    });
    it("preview is null beyond the radius (default 5 km when unset)", () => {
        const config = { mode: "flat" as const, tiers: [], perKm: 0, flatCharge: 30, radiusKm: 0 };
        expect(previewDeliveryFee(config, 5.01)).toBeNull();
        expect(previewDeliveryFee(config, 5)).toBe(30);
    });
});

describe("order links refuse missing data", () => {
    it.each([null, undefined, "", "no number here", "Order #"])("no order number in %j", (text) => {
        expect(parseOrderNumberFromText(text)).toBeNull();
    });
    it("no link without id or number; number is URL-encoded", () => {
        expect(orderDetailsHref({ id: "", orderNumber: "" })).toBeNull();
        expect(orderDetailsHref({})).toBeNull();
        expect(orderDetailsHref({ orderNumber: "A&B" })).toBe("/dashboard/orders/details?number=A%26B");
    });
});
