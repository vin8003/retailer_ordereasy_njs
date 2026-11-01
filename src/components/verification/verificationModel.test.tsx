import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import VerificationStatusCard from "./VerificationStatusCard";
import {
    ADMIN_ACTION_META,
    adminActionsFor,
    deriveStage,
    PROOF_OPTIONS,
    STATUS_LABEL,
    STEP_HINDI,
    STEP_LINKS,
    stepsDone,
    type AdminAction,
    type VerificationStatus,
    type VerificationStep,
} from "./verificationModel";

const STATUSES: VerificationStatus[] = ["pending", "needs_changes", "approved", "suspended", "rejected"];
const STEP_KEYS = ["phone", "shop", "address", "proof", "owner_id"] as const;

const steps = (done: boolean[]): VerificationStep[] =>
    STEP_KEYS.map((key, i) => ({ key, label: key, done: done[i] ?? false, detail: done[i] ? "" : `Fix ${key}` }));

// Backend retailers/verification.py ADMIN_ACTIONS: action -> statuses it is allowed from.
const BACKEND_ALLOWED_FROM: Record<AdminAction, VerificationStatus[]> = {
    approve: ["pending", "needs_changes", "rejected", "approved"],
    request_changes: ["pending", "approved"],
    reject: ["pending", "needs_changes", "approved", "suspended"],
    suspend: ["approved"],
    reinstate: ["suspended"],
    mark_reviewed: ["approved"],
};

describe("adminActionsFor (regression: never offer an action the backend refuses)", () => {
    for (const status of STATUSES) {
        it(`only offers allowed actions for ${status}`, () => {
            for (const reviewNeeded of [false, true]) {
                for (const action of adminActionsFor(status, reviewNeeded)) {
                    expect(BACKEND_ALLOWED_FROM[action]).toContain(status);
                }
            }
        });
    }

    it("offers mark reviewed only on approved shops that are flagged", () => {
        expect(adminActionsFor("approved", false)).not.toContain("mark_reviewed");
        expect(adminActionsFor("approved", true)).toContain("mark_reviewed");
        for (const s of STATUSES.filter((x) => x !== "approved")) {
            expect(adminActionsFor(s, true)).not.toContain("mark_reviewed");
        }
    });

    it("keeps suspend manual and available on every approved shop", () => {
        expect(adminActionsFor("approved")).toContain("suspend");
        expect(adminActionsFor("pending")).not.toContain("suspend");
        expect(adminActionsFor("suspended")).not.toContain("suspend");
    });

    it("returns nothing for an unknown status", () => {
        expect(adminActionsFor("draft" as VerificationStatus)).toEqual([]);
    });

    it("asks for a reason wherever the backend requires one", () => {
        expect(ADMIN_ACTION_META.request_changes.needsReason).toBe(true);
        expect(ADMIN_ACTION_META.suspend.needsReason).toBe(true);
        expect(ADMIN_ACTION_META.approve.needsReason).toBe(false);
        expect(ADMIN_ACTION_META.reinstate.needsReason).toBe(false);
    });
});

describe("deriveStage edge cases", () => {
    it("keeps needs_changes even when the shop had submitted", () => {
        expect(deriveStage({ verification_status: "needs_changes", submitted_at: "2026-10-31T10:00:00Z", ready: true })).toBe("needs_changes");
    });

    it("shows submitted even if checks later fail (admin decides)", () => {
        expect(deriveStage({ verification_status: "pending", submitted_at: "2026-10-31T10:00:00Z", ready: false })).toBe("submitted");
    });
});

describe("stepsDone", () => {
    it("counts done steps and tolerates missing data", () => {
        expect(stepsDone(undefined)).toBe(0);
        expect(stepsDone([])).toBe(0);
        expect(stepsDone(steps([true, false, true, false, true]))).toBe(3);
    });
});

describe("static tables", () => {
    it("cover every step, status and proof type", () => {
        for (const k of STEP_KEYS) {
            expect(STEP_HINDI[k]).toBeTruthy();
            expect(k in STEP_LINKS).toBe(true);
        }
        for (const s of STATUSES) expect(STATUS_LABEL[s]).toBeTruthy();
        expect(PROOF_OPTIONS.map((o) => o.value)).toEqual(["gst", "fssai", "licence", "board"]);
    });

    it("sends documents to the checklist, not the profile page", () => {
        expect(STEP_LINKS.proof).toBeNull();
        expect(STEP_LINKS.owner_id).toBeNull();
    });
});

describe("VerificationStatusCard more states", () => {
    const base = { reason: "", steps: steps([true, true, true, true, true]) };

    it("ready shows a submit call to action", () => {
        const html = renderToStaticMarkup(<VerificationStatusCard data={{ ...base, verification_status: "pending", submitted_at: null, ready: true }} />);
        expect(html).toContain('data-stage="ready"');
        expect(html).toContain("Review and submit");
    });

    it("submitted tells the retailer it is being checked", () => {
        const html = renderToStaticMarkup(<VerificationStatusCard data={{ ...base, verification_status: "pending", submitted_at: "x", ready: true }} />);
        expect(html).toContain('data-stage="submitted"');
        expect(html).toContain("Being checked");
    });

    it("approved has no call to action", () => {
        const html = renderToStaticMarkup(<VerificationStatusCard data={{ ...base, verification_status: "approved", submitted_at: "x", ready: true }} />);
        expect(html).toContain("Your shop is live");
        expect(html).not.toContain("verification-banner-cta");
    });

    it("falls back to default text when no reason is given", () => {
        const html = renderToStaticMarkup(<VerificationStatusCard data={{ ...base, verification_status: "rejected", submitted_at: "x", ready: true }} />);
        expect(html).toContain("Your shop was not approved.");
        const nc = renderToStaticMarkup(<VerificationStatusCard data={{ ...base, verification_status: "needs_changes", submitted_at: "x", ready: true }} />);
        expect(nc).toContain("Our team asked for a change.");
    });

    it("escapes an admin reason instead of rendering it as HTML", () => {
        const html = renderToStaticMarkup(
            <VerificationStatusCard data={{ ...base, verification_status: "suspended", submitted_at: "x", ready: true, reason: "<img src=x onerror=alert(1)>" }} />
        );
        expect(html).not.toContain("<img src=x");
        expect(html).toContain("&lt;img");
    });

    it("shows progress for an incomplete shop with no steps loaded", () => {
        const html = renderToStaticMarkup(<VerificationStatusCard data={{ reason: "", steps: [], verification_status: "pending", submitted_at: null, ready: false }} />);
        expect(html).toContain("0 of 5 steps done");
    });
});
