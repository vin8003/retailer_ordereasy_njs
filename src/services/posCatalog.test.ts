import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import api from "./api";
import { browseCatalog, fetchCatalogCategories, findCatalogProducts, lookupBarcode, searchCatalog } from "./posCatalog";

afterEach(() => {
    vi.restoreAllMocks();
});

describe("browseCatalog", () => {
    it("asks for one page of active products, never no_page", async () => {
        const get = vi.spyOn(api, "get").mockResolvedValue({ data: { results: [{ id: 1 }], next: null } });

        const page = await browseCatalog(2, 7);

        expect(get).toHaveBeenCalledWith("/products/", { params: { is_active: true, page: 2, page_size: 40, category: 7 } });
        expect(page).toEqual({ rows: [{ id: 1 }], hasMore: false });
    });

    it("leaves the category out for All", async () => {
        const get = vi.spyOn(api, "get").mockResolvedValue({ data: { results: [], next: "next" } });

        await browseCatalog(1, null);

        expect(get.mock.calls[0][1]).toEqual({ params: { is_active: true, page: 1, page_size: 40 } });
    });
});

describe("searchCatalog", () => {
    it("uses the search endpoint with the limit and category", async () => {
        const get = vi.spyOn(api, "get").mockResolvedValue({ data: { results: [{ id: 5 }], facets: {} } });

        const rows = await searchCatalog("tata atta", 50, 3);

        expect(get).toHaveBeenCalledWith("/products/search/", { params: { search: "tata atta", limit: 50, category: 3 } });
        expect(rows).toEqual([{ id: 5 }]);
    });

    it("returns no rows for an odd body", async () => {
        vi.spyOn(api, "get").mockResolvedValue({ data: {} });
        expect(await searchCatalog("x", 10)).toEqual([]);
    });
});

describe("lookupBarcode", () => {
    it("keeps only exact product or batch barcode matches", async () => {
        vi.spyOn(api, "get").mockResolvedValue({
            data: {
                results: [
                    { id: 1, barcode: "8901" },
                    { id: 2, barcode: "89012" },
                    { id: 3, barcode: "x", batches: [{ barcode: "8901" }] },
                ],
            },
        });

        const hits = await lookupBarcode<{ id: number; barcode: string }>("8901");

        expect(hits.map((h) => h.id)).toEqual([1, 3]);
    });
});

describe("findCatalogProducts", () => {
    it("browses the first page for an empty box", async () => {
        const get = vi.spyOn(api, "get").mockResolvedValue({ data: { results: [{ id: 1 }], next: null } });

        expect(await findCatalogProducts("  ")).toEqual([{ id: 1 }]);
        expect(get.mock.calls[0][0]).toBe("/products/");
    });

    it("searches for text", async () => {
        const get = vi.spyOn(api, "get").mockResolvedValue({ data: { results: [{ id: 2 }] } });

        expect(await findCatalogProducts(" amul ")).toEqual([{ id: 2 }]);
        expect(get).toHaveBeenCalledWith("/products/search/", { params: { search: "amul", limit: 50 } });
    });
});

describe("fetchCatalogCategories", () => {
    it("reduces each category to id and name", async () => {
        vi.spyOn(api, "get").mockResolvedValue({ data: [{ id: 1, name: "Dairy", subcategories: [] }] });
        expect(await fetchCatalogCategories()).toEqual([{ id: 1, name: "Dairy" }]);
    });
});

describe("no screen loads the whole catalog", () => {
    const read = (file: string) => readFileSync(path.resolve(process.cwd(), file), "utf8");

    it.each([
        "src/app/dashboard/pos/page.tsx",
        "src/components/products/ProductSelector.tsx",
        "src/components/offer/ProductMultiSelect.tsx",
    ])("%s does not ask for no_page", (file) => {
        expect(read(file)).not.toMatch(/no_page/);
    });

    it("the POS does not keep a whole-catalog cache", () => {
        expect(read("src/app/dashboard/pos/page.tsx")).not.toContain("posProductsCache");
    });
});
