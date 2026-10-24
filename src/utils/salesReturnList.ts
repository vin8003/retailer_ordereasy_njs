import type { SalesReturnListNotesDisplay } from "@/utils/salesReturnListNotes";

/** One row of GET /returns/sales/ (OE-336 list). Only fields the backend sends. */
export type SalesReturnListRow = SalesReturnListNotesDisplay & {
    id: number;
    order?: number | null;
    refund_amount?: number | string | null;
    processed_by_name?: string | null;
    created_at?: string | null;
    items?: Array<{ quantity?: number | string | null }>;
};

export type SalesReturnListPage = { rows: SalesReturnListRow[]; hasMore: boolean };

/** Accepts the paginated `{results, next}` shape or a bare array. Rows without an id are dropped. */
export function parseSalesReturnListPage(data: unknown): SalesReturnListPage {
    const raw = Array.isArray(data)
        ? data
        : data && typeof data === "object" && Array.isArray((data as { results?: unknown }).results)
            ? (data as { results: unknown[] }).results
            : [];
    const rows = raw.filter(
        (row): row is SalesReturnListRow =>
            !!row && typeof row === "object" && typeof (row as { id?: unknown }).id === "number"
    );
    const next = !Array.isArray(data) && data && typeof data === "object" ? (data as { next?: unknown }).next : null;
    return { rows, hasMore: typeof next === "string" && next !== "" };
}

/** Total units returned on a row; non-numeric quantities count as 0. */
export function salesReturnUnitCount(row: SalesReturnListRow): number {
    return (row.items || []).reduce((sum, item) => {
        const qty = Number(item?.quantity);
        return sum + (Number.isFinite(qty) ? qty : 0);
    }, 0);
}
