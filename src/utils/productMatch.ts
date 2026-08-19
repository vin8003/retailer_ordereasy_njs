/** Parent + batch + extra barcodes the list serializer already returns. */

export type BarcodeProduct = {
    id: number;
    name: string;
    barcode?: string | null;
    additional_barcodes?: string[] | null;
    batches?: { barcode?: string | null }[] | null;
};

export function productBarcodes(p: BarcodeProduct): string[] {
    const out: string[] = [];
    if (p.barcode) out.push(String(p.barcode));
    if (Array.isArray(p.additional_barcodes)) {
        for (const c of p.additional_barcodes) {
            if (c) out.push(String(c));
        }
    }
    if (Array.isArray(p.batches)) {
        for (const b of p.batches) {
            if (b?.barcode) out.push(String(b.barcode));
        }
    }
    return out;
}

export function findProductByBarcode<T extends BarcodeProduct>(
    products: T[],
    raw: string
): T | undefined {
    const code = raw.trim();
    if (!code) return undefined;
    return products.find((p) => productBarcodes(p).some((c) => c === code));
}

export function productMatchesQuery<T extends BarcodeProduct>(p: T, raw: string): boolean {
    const trimmed = raw.trim().toLowerCase();
    if (trimmed.length <= 1) return false;
    const words = trimmed.split(/\s+/).filter(Boolean);
    const name = (p.name || '').toLowerCase();
    const codes = productBarcodes(p).map((c) => c.toLowerCase());
    return words.every((w) => name.includes(w) || codes.some((c) => c.includes(w)));
}

/** Real scanned codes, not a name like "DABUR HONEY". */
export function looksLikeBarcode(raw: string): boolean {
    return /^\d{6,}$/.test(raw.trim());
}

export function unwrapProductList(data: any): any[] {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;
    return [];
}

export function productListIsIncomplete(data: any, list: any[]): boolean {
    if (!Array.isArray(list) || list.length === 0) return true;
    const count = typeof data?.count === 'number' ? data.count : null;
    return count != null && list.length < count;
}
