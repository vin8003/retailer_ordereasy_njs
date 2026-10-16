import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PurchaseReturnCreatedAtTimeLabel } from "./PurchaseReturnCreatedAtTimeLabel";

const formatIstTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("en-IN", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: "Asia/Kolkata",
    });

describe("PurchaseReturnCreatedAtTimeLabel", () => {
    it("shows a muted created_at time when BE sent a datetime", () => {
        const iso = "2026-09-18T09:15:00+05:30";
        const time = formatIstTime(iso);
        const markup = renderToStaticMarkup(
            <PurchaseReturnCreatedAtTimeLabel item={{ created_at: iso }} />
        );
        expect(markup).toContain(time);
        expect(markup).toContain(`Created ${time}`);
    });

    it("renders nothing when created_at is omitted, null, blank, date-only, or invalid", () => {
        expect(renderToStaticMarkup(<PurchaseReturnCreatedAtTimeLabel item={{}} />)).toBe("");
        expect(
            renderToStaticMarkup(<PurchaseReturnCreatedAtTimeLabel item={{ created_at: null }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(<PurchaseReturnCreatedAtTimeLabel item={{ created_at: "  " }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(
                <PurchaseReturnCreatedAtTimeLabel item={{ created_at: "2026-09-18" }} />
            )
        ).toBe("");
        expect(
            renderToStaticMarkup(
                <PurchaseReturnCreatedAtTimeLabel item={{ created_at: "not-a-date" }} />
            )
        ).toBe("");
    });

    it("does not invent a time from return_date or invoice_date", () => {
        const markup = renderToStaticMarkup(
            <PurchaseReturnCreatedAtTimeLabel
                item={{
                    return_date: "2026-09-18T11:30:00+05:30",
                    invoice_date: "2026-09-17T08:00:00+05:30",
                }}
            />
        );
        expect(markup).toBe("");
    });
});
