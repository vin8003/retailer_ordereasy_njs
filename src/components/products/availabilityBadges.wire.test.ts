import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const catalogAndPosFiles = [
    "src/components/products/ProductTable.tsx",
    "src/components/products/VirtualProductList.tsx",
    "src/app/dashboard/pos/page.tsx",
] as const;

function readSrc(relativePath: (typeof catalogAndPosFiles)[number]): string {
    return readFileSync(path.resolve(process.cwd(), relativePath), "utf8");
}

describe("OE-304 availability badge wire", () => {
    it.each(catalogAndPosFiles)("imports AvailabilityBadges and optional flags in %s", (file) => {
        const src = readSrc(file);
        expect(src).toContain("AvailabilityBadges");
        expect(src).toContain("is_available?: boolean | null");
        expect(src).toContain("is_in_stock?: boolean | null");
    });
});
