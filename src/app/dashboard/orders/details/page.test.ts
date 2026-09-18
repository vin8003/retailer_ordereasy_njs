import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const pageSource = readFileSync(path.join(__dirname, "page.tsx"), "utf8");

describe("order detail e-invoice panel mount", () => {
    it("imports EInvoicePanel and mounts it on the loaded order payload", () => {
        expect(pageSource).toContain(
            'import { EInvoicePanel } from "@/components/orders/EInvoicePanel"'
        );
        expect(pageSource).toContain("<EInvoicePanel invoice={order} />");
    });

    it("does not call production ordereasy.win hosts from this page", () => {
        expect(pageSource).not.toMatch(/ordereasy\.win/);
    });
});
