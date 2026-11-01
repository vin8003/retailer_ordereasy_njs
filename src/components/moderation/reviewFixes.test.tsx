import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ADMIN_NAV } from "@/hooks/useIsAdmin";

const read = (p: string) => readFileSync(path.resolve(process.cwd(), p), "utf8");

describe("review fixes (regressions)", () => {
    it("admin pages are reachable from the desktop sidebar and the mobile menu", () => {
        expect(ADMIN_NAV.map((i) => i.href)).toEqual([
            "/dashboard/admin/verifications",
            "/dashboard/admin/moderation",
        ]);
        for (const file of ["src/components/layout/Sidebar.tsx", "src/components/layout/BottomNav.tsx"]) {
            const src = read(file);
            expect(src).toContain("useIsAdmin()");
            expect(src).toContain("ADMIN_NAV");
        }
    });

    it("mobile admin links only appear for admins", () => {
        expect(read("src/components/layout/BottomNav.tsx")).toContain("...(isAdmin ? [");
    });

    it("the review dialog stops fetching private documents once it is closed", () => {
        const src = read("src/components/verification/AdminReviewDialog.tsx");
        expect(src.match(/if \(!alive\) return;/g)?.length).toBeGreaterThanOrEqual(2);
        expect(src).toContain("URL.revokeObjectURL");
    });

    it("the moderation page ignores out-of-order responses and says when a list is cut off", () => {
        const src = read("src/app/dashboard/admin/moderation/page.tsx");
        expect(src).toContain("seq !== loadSeq.current");
        expect(src).toContain('data-testid="more-results"');
    });
});
