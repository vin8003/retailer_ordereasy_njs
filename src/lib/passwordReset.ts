import * as z from "zod";

export const OTP_LENGTH = 6;

export const requestCodeSchema = z.object({
    identifier: z.string().trim().min(1, "Enter your username, phone number or email"),
});

export const resetPasswordSchema = z
    .object({
        otp_code: z.string().regex(new RegExp(`^\\d{${OTP_LENGTH}}$`), `Enter the ${OTP_LENGTH}-digit code`),
        new_password: z.string().min(8, "Password must be at least 8 characters"),
        confirm_password: z.string().min(1, "Confirm your password"),
    })
    .refine((v) => v.new_password === v.confirm_password, {
        message: "Passwords don't match",
        path: ["confirm_password"],
    });

/** Keep only digits and cap at the code length, so pasted "123 456" works. */
export function normalizeOtpInput(value: string): string {
    return value.replace(/\D/g, "").slice(0, OTP_LENGTH);
}

type ApiErrorLike = {
    response?: { status?: number; data?: unknown };
};

/** First readable message from a DRF error body, or the fallback. */
export function resetErrorMessage(error: unknown, fallback: string): string {
    const err = error as ApiErrorLike;
    if (err?.response?.status === 429) {
        return "Too many attempts. Please wait a minute and try again.";
    }
    const data = err?.response?.data;
    if (typeof data === "string" && data && !data.trim().startsWith("<")) return data;
    if (data && typeof data === "object") {
        const body = data as Record<string, unknown>;
        if (typeof body.error === "string") return body.error;
        if (typeof body.detail === "string") return body.detail;
        for (const value of Object.values(body)) {
            const first = Array.isArray(value) ? value[0] : value;
            if (typeof first === "string") return first;
        }
    }
    return fallback;
}
