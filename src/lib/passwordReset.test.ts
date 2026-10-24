import { afterEach, describe, expect, it, vi } from "vitest";
import api, { authService } from "@/services/api";
import {
    normalizeOtpInput,
    requestCodeSchema,
    resetErrorMessage,
    resetPasswordSchema,
} from "./passwordReset";

describe("password reset service calls", () => {
    afterEach(() => vi.restoreAllMocks());

    it("requests a code from the retailer forgot route with the identifier", async () => {
        const post = vi.spyOn(api, "post").mockResolvedValue({ data: {} });
        await authService.forgotPassword("shopowner");
        expect(post).toHaveBeenCalledWith("auth/retailer/password/forgot/", { identifier: "shopowner" });
    });

    it("posts the code and new password to the retailer reset route", async () => {
        const post = vi.spyOn(api, "post").mockResolvedValue({ data: {} });
        const body = {
            identifier: "9876500001",
            otp_code: "123456",
            new_password: "BrandNewPass#2026",
            confirm_password: "BrandNewPass#2026",
        };
        await authService.resetPassword(body);
        expect(post).toHaveBeenCalledWith("auth/retailer/password/reset/", body);
    });
});

describe("request form schema", () => {
    it("trims and requires an identifier", () => {
        expect(requestCodeSchema.safeParse({ identifier: "  shop  " })).toMatchObject({
            success: true,
            data: { identifier: "shop" },
        });
        expect(requestCodeSchema.safeParse({ identifier: "   " }).success).toBe(false);
    });
});

describe("reset form schema", () => {
    const valid = { otp_code: "123456", new_password: "BrandNewPass#2026", confirm_password: "BrandNewPass#2026" };

    it("accepts a 6-digit code with matching passwords", () => {
        expect(resetPasswordSchema.safeParse(valid).success).toBe(true);
    });

    it("rejects codes that are not exactly 6 digits", () => {
        for (const otp_code of ["12345", "1234567", "12a456", ""]) {
            expect(resetPasswordSchema.safeParse({ ...valid, otp_code }).success).toBe(false);
        }
    });

    it("rejects short passwords", () => {
        const r = resetPasswordSchema.safeParse({ ...valid, new_password: "short", confirm_password: "short" });
        expect(r.success).toBe(false);
    });

    it("flags mismatched passwords on the confirm field", () => {
        const r = resetPasswordSchema.safeParse({ ...valid, confirm_password: "Different#1234" });
        expect(r.success).toBe(false);
        if (!r.success) expect(r.error.issues[0].path).toEqual(["confirm_password"]);
    });
});

describe("normalizeOtpInput", () => {
    it("keeps digits only and caps at 6", () => {
        expect(normalizeOtpInput("12 34-56")).toBe("123456");
        expect(normalizeOtpInput("1234567890")).toBe("123456");
        expect(normalizeOtpInput("abc")).toBe("");
    });
});

describe("resetErrorMessage", () => {
    const fallback = "fallback";

    it("uses the backend error text", () => {
        const err = { response: { status: 400, data: { error: "Invalid or expired code. Please request a new one." } } };
        expect(resetErrorMessage(err, fallback)).toBe("Invalid or expired code. Please request a new one.");
    });

    it("reads the first field error from a DRF validation body", () => {
        const err = { response: { status: 400, data: { new_password: ["This password is too common."] } } };
        expect(resetErrorMessage(err, fallback)).toBe("This password is too common.");
    });

    it("explains throttling on 429", () => {
        const err = { response: { status: 429, data: { detail: "Request was throttled." } } };
        expect(resetErrorMessage(err, fallback)).toMatch(/too many attempts/i);
    });

    it("falls back for network errors and HTML error pages", () => {
        expect(resetErrorMessage(new Error("Network Error"), fallback)).toBe(fallback);
        expect(resetErrorMessage({ response: { status: 502, data: "<html>bad gateway</html>" } }, fallback)).toBe(fallback);
    });
});
