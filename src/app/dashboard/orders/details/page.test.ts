import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const pageSource = readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), "page.tsx"),
    "utf8"
);

describe("order detail e-invoice panel mount", () => {
    it("imports and renders EInvoicePanel from the order payload", () => {
        expect(pageSource).toContain(
            'import { EInvoicePanel } from "@/components/orders/EInvoicePanel"'
        );
        expect(pageSource).toContain("<EInvoicePanel invoice={order} />");
        expect(pageSource).not.toMatch(/api\.ordereasy\.win|retailer\.ordereasy\.win/);
    });
});
