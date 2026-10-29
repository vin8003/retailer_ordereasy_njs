import api from '@/services/api';
import { POS_PAGE_SIZE, POS_SEARCH_STEP, readPage, rowsWithBarcode, type CatalogBarcodeRow } from '@/utils/posCatalog';

/**
 * The POS asks the server for what it shows: a page of the catalog while the search box is empty,
 * the best matches while it is not. Nothing here loads the whole product list.
 */
export type CatalogCategory = { id: number; name: string };

export async function browseCatalog<T>(page: number, categoryId?: number | null) {
    const response = await api.get('/products/', {
        params: { is_active: true, page, page_size: POS_PAGE_SIZE, ...(categoryId ? { category: categoryId } : {}) },
    });
    return readPage<T>(response.data);
}

export async function searchCatalog<T>(query: string, limit: number, categoryId?: number | null) {
    const response = await api.get('/products/search/', {
        params: { search: query, limit, ...(categoryId ? { category: categoryId } : {}) },
    });
    const rows: T[] = Array.isArray(response.data?.results) ? response.data.results : [];
    return rows;
}

/** Products whose barcode, or a batch barcode, is exactly `code`; the server ranks exact barcodes first. */
export async function lookupBarcode<T extends CatalogBarcodeRow>(code: string, categoryId?: number | null) {
    const rows = await searchCatalog<T>(code, 20, categoryId);
    return rowsWithBarcode(rows, code);
}

export async function fetchCatalogCategories(): Promise<CatalogCategory[]> {
    const response = await api.get('/products/categories/');
    const list = Array.isArray(response.data) ? response.data : response.data?.results ?? [];
    return (list as CatalogCategory[]).map((c) => ({ id: c.id, name: c.name }));
}

/** The rows a pick-a-product list shows: the first page of the catalog, or the best matches for the text. */
export async function findCatalogProducts<T>(query: string): Promise<T[]> {
    const text = query.trim();
    if (!text) return (await browseCatalog<T>(1)).rows;
    return searchCatalog<T>(text, POS_SEARCH_STEP);
}
