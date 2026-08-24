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
    // After remap, the new SKU owns `barcode`. The old SKU may still list the
    // code on additional_barcodes / batches. Prefer the current primary owner.
    const primary = products.find((p) => String(p.barcode || "") === code);
    if (primary) return primary;
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


export async function loadRetailerProducts<T = any>(
    fetchPages: (endpoint: string, params?: Record<string, any>) => Promise<T[]>,
    attempts = 3
): Promise<T[]> {
    let lastErr: any;
    for (let i = 0; i < attempts; i++) {
        try {
            // Page through the catalog. no_page=true times out on a large shop and
            // aborts the whole purchase setup (empty search list).
            return await fetchPages('/products/', { is_active: true });
        } catch (err) {
            lastErr = err;
            if (i < attempts - 1) {
                await new Promise((r) => setTimeout(r, 400 * (i + 1)));
            }
        }
    }
    throw lastErr;
}

export function mergeProductsById<T extends { id: number }>(current: T[], incoming: T[]): T[] {
    if (!incoming?.length) return current;
    const byId = new Map(current.map((p) => [p.id, p]));
    for (const p of incoming) {
        if (!p?.id) continue;
        const prev = byId.get(p.id);
        byId.set(p.id, prev ? { ...prev, ...p } : p);
    }
    return Array.from(byId.values());
}
