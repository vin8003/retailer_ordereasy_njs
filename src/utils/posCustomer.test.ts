import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { POS_DEFAULT_RATING } from "./posCustomer";

const pos = () => readFileSync(path.resolve(process.cwd(), "src/app/dashboard/pos/page.tsx"), "utf8");

describe("POS rating box", () => {
    it("starts above 0 stars, which would blacklist the customer", () => {
        expect(POS_DEFAULT_RATING).toBe(5);
    });

    it("starts there on the first bill of a session too (it opened at 0 stars)", () => {
        const source = pos();

        expect(source).toContain("useState<number>(POS_DEFAULT_RATING)");
        expect(source).toContain("setSelectedRating(POS_DEFAULT_RATING)");
        expect(source).not.toContain("useState<number>(0)");
    });
});
