/** Optional BE purchase-list `due_date` (unpaid invoice rows only). */
export type PurchaseListDueDateDisplay = {
    due_date?: string | null;
    payment_status?: string | null;
    type?: string | null;
    /** Allowed on payloads / tests; never used to invent due_date. */
    invoice_date?: string | null;
    created_at?: string | null;
    credit_due_days?: number | string | null;
};

function paymentStatusKey(raw: string | null | undefined): string {
    if (raw === undefined || raw === null) return "";
    return raw.trim().toUpperCase();
}

/**
 * Unpaid purchase-invoice rows: UNPAID, PARTIAL, or missing status.
 * PAID invoices and purchase returns are not unpaid.
 */
export function isPurchaseListUnpaidInvoice(row: PurchaseListDueDateDisplay): boolean {
    if (row.type === "return") return false;
    return paymentStatusKey(row.payment_status) !== "PAID";
}

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

function formatCalendarDate(year: number, monthIndex: number, day: number): string | null {
    const parsed = new Date(year, monthIndex, day);
    if (
        parsed.getFullYear() !== year ||
        parsed.getMonth() !== monthIndex ||
        parsed.getDate() !== day
    ) {
        return null;
    }
    return parsed.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

/**
 * Compact due-date text from top-level `due_date` on unpaid invoice rows only.
 * Absent / undefined / null / blank / unparseable → do not show.
 * Never invented from invoice_date, created_at, or credit_due_days.
 */
export function getPurchaseListDueDateLabel(row: PurchaseListDueDateDisplay): string | null {
    if (!isPurchaseListUnpaidInvoice(row)) return null;

    const raw = row.due_date;
    if (raw === undefined || raw === null) return null;
    if (typeof raw !== "string") return null;

    const trimmed = raw.trim();
    if (trimmed === "") return null;

    const dateOnly = DATE_ONLY.exec(trimmed);
    if (dateOnly) {
        return formatCalendarDate(
            Number(dateOnly[1]),
            Number(dateOnly[2]) - 1,
            Number(dateOnly[3])
        );
    }

    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}
