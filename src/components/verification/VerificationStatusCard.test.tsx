import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import VerificationStatusCard from "./VerificationStatusCard";
import { adminActionsFor, deriveStage, type VerificationStep } from "./verificationModel";

const steps = (doneCount: number): VerificationStep[] =>
    (["phone", "shop", "address", "proof", "owner_id"] as const).map((key, i) => ({
        key, label: key, done: i < doneCount, detail: "",
    }));

describe("deriveStage", () => {
    it("splits pending into incomplete, ready and submitted", () => {
        expect(deriveStage({ verification_status: "pending", submitted_at: null, ready: false })).toBe("incomplete");
        expect(deriveStage({ verification_status: "pending", submitted_at: null, ready: true })).toBe("ready");
        expect(deriveStage({ verification_status: "pending", submitted_at: "2026-10-31T10:00:00Z", ready: true })).toBe("submitted");
    });

    it("passes other statuses through", () => {
        for (const s of ["approved", "needs_changes", "suspended", "rejected"] as const) {
            expect(deriveStage({ verification_status: s, submitted_at: null, ready: false })).toBe(s);
        }
    });
});

describe("VerificationStatusCard", () => {
    it("shows progress and a link while steps are missing", () => {
        const html = renderToStaticMarkup(
            <VerificationStatusCard data={{ verification_status: "pending", submitted_at: null, ready: false, reason: "", steps: steps(2) }} />
        );
        expect(html).toContain('data-stage="incomplete"');
        expect(html).toContain("2 of 5 steps done");
        expect(html).toContain('href="/dashboard/verification"');
    });

    it("shows the admin's reason when changes are needed", () => {
        const html = renderToStaticMarkup(
            <VerificationStatusCard data={{ verification_status: "needs_changes", submitted_at: "x", ready: true, reason: "Photo is too dark.", steps: steps(5) }} />
        );
        expect(html).toContain("Photo is too dark.");
        expect(html).toContain("Fix now");
    });

    it("has no call to action once suspended or rejected", () => {
        for (const s of ["suspended", "rejected"] as const) {
            const html = renderToStaticMarkup(
                <VerificationStatusCard data={{ verification_status: s, submitted_at: "x", ready: true, reason: "Fake shop", steps: steps(5) }} />
            );
            expect(html).toContain("Fake shop");
            expect(html).not.toContain("verification-banner-cta");
        }
    });

    it("can hide the link on the checklist page", () => {
        const html = renderToStaticMarkup(
            <VerificationStatusCard showLink={false} data={{ verification_status: "pending", submitted_at: null, ready: false, reason: "", steps: steps(0) }} />
        );
        expect(html).not.toContain("verification-banner-cta");
    });
});

describe("adminActionsFor", () => {
    it("matches the backend transition table", () => {
        expect(adminActionsFor("pending")).toEqual(["approve", "request_changes", "reject"]);
        expect(adminActionsFor("approved")).toEqual(["request_changes", "suspend", "reject"]);
        expect(adminActionsFor("approved", true)[0]).toBe("mark_reviewed");
        expect(adminActionsFor("suspended")).toEqual(["reinstate", "reject"]);
        expect(adminActionsFor("rejected")).toEqual(["approve"]);
    });
});
