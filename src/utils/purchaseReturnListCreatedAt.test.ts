import { describe, expect, it } from "vitest";
import { getPurchaseReturnCreatedAtTimeLabel } from "./purchaseReturnListCreatedAt";

const formatIstTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("en-IN", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: "Asia/Kolkata",
    });

describe("getPurchaseReturnCreatedAtTimeLabel", () => {
    it("returns a compact IST clock time when BE sent a datetime created_at", () => {
        const iso = "2026-09-18T09:15:00+05:30";
        expect(getPurchaseReturnCreatedAtTimeLabel({ created_at: iso })).toBe(formatIstTime(iso));
        expect(getPurchaseReturnCreatedAtTimeLabel({ created_at: "  2026-09-18T03:45:00Z  " })).toBe(
            formatIstTime("2026-09-18T03:45:00Z")
        );
        expect(getPurchaseReturnCreatedAtTimeLabel({ created_at: "2026-09-18 14:05:00+05:30" })).toBe(
            formatIstTime("2026-09-18T14:05:00+05:30")
        );
    });

    it("returns a time when created_at is midnight but includes a clock component", () => {
        const iso = "2026-09-18T00:00:00+05:30";
        expect(getPurchaseReturnCreatedAtTimeLabel({ created_at: iso })).toBe(formatIstTime(iso));
    });

    it("returns null when created_at is omitted, null, or blank", () => {
        expect(getPurchaseReturnCreatedAtTimeLabel({})).toBeNull();
        expect(getPurchaseReturnCreatedAtTimeLabel({ created_at: undefined })).toBeNull();
        expect(getPurchaseReturnCreatedAtTimeLabel({ created_at: null })).toBeNull();
        expect(getPurchaseReturnCreatedAtTimeLabel({ created_at: "" })).toBeNull();
        expect(getPurchaseReturnCreatedAtTimeLabel({ created_at: "   " })).toBeNull();
    });

    it("returns null for date-only created_at (no clock time to show)", () => {
        expect(getPurchaseReturnCreatedAtTimeLabel({ created_at: "2026-09-18" })).toBeNull();
    });

    it("returns null for invalid created_at values", () => {
        expect(getPurchaseReturnCreatedAtTimeLabel({ created_at: "not-a-date" })).toBeNull();
        expect(getPurchaseReturnCreatedAtTimeLabel({ created_at: "2026-13-40T10:00:00Z" })).toBeNull();
    });

    it("does not invent created_at time from return_date or invoice_date", () => {
        expect(
            getPurchaseReturnCreatedAtTimeLabel({
                return_date: "2026-09-18T11:30:00+05:30",
                invoice_date: "2026-09-17T08:00:00+05:30",
                created_at: null,
            })
        ).toBeNull();
        expect(
            getPurchaseReturnCreatedAtTimeLabel({
                return_date: "2026-09-18T11:30:00+05:30",
                invoice_date: "2026-09-17T08:00:00+05:30",
            })
        ).toBeNull();
    });
});
