import React from "react";
import { readFileSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ModerationBadge } from "./ModerationBadge";
import { ModerationNotice } from "./ModerationNotice";
import {
    cleanReason,
    isAutoHold,
    isHeld,
    productActionsFor,
    REPORT_ACTION_META,
    REPORT_REASON_LABEL,
    reportActionLabel,
    reportActionsFor,
    retailerHint,
} from "./moderationModel";

describe("moderation helpers", () => {
    it("treats only the three hold states as held", () => {
        for (const s of ["pending_review", "hidden", "removed"]) expect(isHeld(s)).toBe(true);
        for (const s of ["ok", "", null, undefined, "bogus"]) expect(isHeld(s as string)).toBe(false);
    });

    it("strips the automatic prefix only when present", () => {
        expect(isAutoHold("Auto: Banned category: alcohol. (in the name)")).toBe(true);
        expect(cleanReason("Auto: Banned category: alcohol. (in the name)")).toBe("Banned category: alcohol. (in the name)");
        expect(isAutoHold("Fake brand")).toBe(false);
        expect(cleanReason("  Fake brand ")).toBe("Fake brand");
        expect(cleanReason(null)).toBe("");
    });

    it("tells the retailer how to fix an automatic hold and whom to contact otherwise", () => {
        expect(retailerHint("hidden", "Auto: x")).toMatch(/Fix the name or description/);
        expect(retailerHint("hidden", "Fake brand")).toMatch(/admin hid/);
        expect(retailerHint("removed", "Counterfeit")).toMatch(/admin removed/);
        expect(retailerHint("pending_review", "Auto: Restricted")).toMatch(/check it soon/);
        expect(retailerHint("ok", "")).toBe("");
    });

    it("matches the backend report reasons", () => {
        expect(Object.keys(REPORT_REASON_LABEL).sort()).toEqual(
            ["illegal", "misleading", "not_delivered", "offensive", "other", "wrong_price"],
        );
    });

    it("offers product actions only on product reports and none once closed", () => {
        expect(reportActionsFor("product")).toEqual(["dismiss", "hide_product", "remove_product", "strike"]);
        expect(reportActionsFor("shop")).toEqual(["dismiss", "strike"]);
        expect(reportActionsFor("product", "actioned")).toEqual([]);
        expect(reportActionsFor("shop", "dismissed")).toEqual([]);
    });

    it("requires a reason wherever the backend does", () => {
        expect(REPORT_ACTION_META.strike.needsReason).toBe(true);
        expect(REPORT_ACTION_META.dismiss.needsReason).toBe(false);
    });

    it("labels a product strike as also removing the product", () => {
        expect(reportActionLabel("strike", "product")).toBe("Remove + strike shop");
        expect(reportActionLabel("strike", "shop")).toBe("Strike shop");
        expect(reportActionLabel("dismiss", "product")).toBe("Dismiss");
    });

    it("never offers the state a product is already in", () => {
        expect(productActionsFor("pending_review")).toEqual(["approve", "hide", "remove"]);
        expect(productActionsFor("hidden")).toEqual(["approve", "remove"]);
        expect(productActionsFor("removed")).toEqual(["approve", "hide"]);
        expect(productActionsFor("ok")).toEqual(["hide", "remove"]);
    });
});

describe("ModerationBadge", () => {
    it("renders nothing for a live or legacy product", () => {
        expect(renderToStaticMarkup(<ModerationBadge product={{ moderation_status: "ok" }} />)).toBe("");
        expect(renderToStaticMarkup(<ModerationBadge product={{}} />)).toBe("");
    });

    it("shows the status with the cleaned reason as a tooltip", () => {
        const html = renderToStaticMarkup(
            <ModerationBadge product={{ moderation_status: "hidden", moderation_reason: "Auto: Remove phone numbers or links. (in the name)" }} />,
        );
        expect(html).toContain('data-status="hidden"');
        expect(html).toContain("Hidden from customers");
        expect(html).toContain('title="Remove phone numbers or links. (in the name)"');
        expect(html).not.toContain("Auto:");
    });
});

describe("ModerationNotice", () => {
    it("explains an automatic hold and escapes the reason", () => {
        const html = renderToStaticMarkup(
            <ModerationNotice product={{ moderation_status: "hidden", moderation_reason: "Auto: <b>bad</b>" }} />,
        );
        expect(html).toContain("Hidden from customers");
        expect(html).toContain("&lt;b&gt;bad&lt;/b&gt;");
        expect(html).toContain("goes live again automatically");
    });

    it("is absent for a live product", () => {
        expect(renderToStaticMarkup(<ModerationNotice product={{ moderation_status: "ok", moderation_reason: "" }} />)).toBe("");
    });
});

describe("wiring (regression: badges and admin calls stay connected)", () => {
    const read = (p: string) => readFileSync(path.resolve(process.cwd(), p), "utf8");

    it.each(["src/components/products/ProductTable.tsx", "src/components/products/VirtualProductList.tsx"])(
        "%s shows the moderation badge in both layouts",
        (file) => {
            const src = read(file);
            expect(src.match(/<ModerationBadge product=\{product\}/g)?.length).toBe(2);
            expect(src).toContain("moderation_status?: string | null");
        },
    );

    it("the product edit page explains a hold", () => {
        expect(read("src/app/dashboard/products/edit/page.tsx")).toContain("<ModerationNotice product={product} />");
    });

    it("admin API paths match the backend routes", () => {
        const api = read("src/services/api.ts");
        expect(api).toContain("'retailer/admin/reports/'");
        expect(api).toContain("'retailer/admin/reports/action/'");
        expect(api).toContain("'retailer/admin/products/review/'");
        expect(api).toContain("`retailer/admin/products/${productId}/moderate/`");
    });

    it("the sidebar links admins to the moderation page", () => {
        expect(read("src/hooks/useIsAdmin.ts")).toContain("'/dashboard/admin/moderation'");
    });
});
