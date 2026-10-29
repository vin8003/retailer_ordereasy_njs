/**
 * Pure helpers for the POS catalog: the POS no longer loads every product, it asks the server for
 * one page of the catalog (no search) or the best matches (search) and works on those rows.
 */
export const POS_PAGE_SIZE = 40;
export const POS_SEARCH_STEP = 50;
/** The server caps ?limit= here; asking for more returns the same rows. */
export const POS_SEARCH_MAX = 200;
/** A one-letter query matches half the catalog; wait for a second character. */
export const POS_MIN_SEARCH_LENGTH = 2;

export type CatalogBarcodeRow = {
    barcode?: string | null;
    batches?: { barcode?: string | null }[] | null;
};

/** `barcode*qty` is how a cashier scans one code several times. */
export function parseScanInput(raw: string): { code: string; multiplier: number } {
    const text = raw.trim();
    if (!text.includes('*')) return { code: text, multiplier: 1 };
    const [code, qty] = text.split('*');
    const parsed = parseInt(qty, 10) || 1;
    return { code: code.trim(), multiplier: Math.max(1, Math.min(parsed, 999)) };
}

/** Rows whose own barcode, or one of their batch barcodes, is exactly `code`. */
export function rowsWithBarcode<T extends CatalogBarcodeRow>(rows: T[], code: string): T[] {
    if (!code) return [];
    return rows.filter(
        (row) => row.barcode === code || (row.batches ?? []).some((batch) => batch.barcode === code),
    );
}

/** The next ?limit= to ask for when the cashier scrolls to the end, or null when there is no more. */
export function nextSearchLimit(limit: number, returned: number): number | null {
    if (returned < limit || limit >= POS_SEARCH_MAX) return null;
    return Math.min(limit + POS_SEARCH_STEP, POS_SEARCH_MAX);
}

/** Whether a code that matched nothing should open Quick Add (a number or a long code, not a short word). */
export function isUnknownBarcodeCandidate(code: string): boolean {
    return /^\d+$/.test(code) || code.length > 5;
}

/** The server's page response, or a flat list, as rows plus whether another page exists. */
export function readPage<T>(data: unknown): { rows: T[]; hasMore: boolean } {
    if (Array.isArray(data)) return { rows: data, hasMore: false };
    const page = data as { results?: unknown; next?: unknown } | null | undefined;
    return { rows: Array.isArray(page?.results) ? (page.results as T[]) : [], hasMore: Boolean(page?.next) };
}
