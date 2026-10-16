/** Optional BE customer-list scalars (OE-306 / OE-305). */
export type CustomerListScalarDisplay = {
    email?: string | null;
    credit_limit?: number | string | null;
    credit_due_days?: number | string | null;
    /** Allowed on payloads / tests; never used to invent email or credit. */
    customer_name?: string | null;
    phone_number?: string | null;
    current_balance?: number | string | null;
};

function optionalTrimmedText(raw: string | null | undefined): string | null {
    if (raw === undefined || raw === null) return null;
    const trimmed = raw.trim();
    return trimmed === "" ? null : trimmed;
}

function optionalFiniteNumber(raw: number | string | null | undefined): number | null {
    if (raw === undefined || raw === null) return null;
    if (typeof raw === "string" && raw.trim() === "") return null;
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
}

function formatInr(value: number): string {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(value);
}

/**
 * Compact email line from top-level `email` only.
 * Absent / undefined / null / blank → do not show. Never derived from name or phone.
 */
export function getCustomerEmailLabel(customer: CustomerListScalarDisplay): string | null {
    return optionalTrimmedText(customer.email);
}

/**
 * Compact INR label from top-level `credit_limit` only, including 0.
 * Absent / undefined / null / blank / non-numeric → do not show.
 * Never derived from current_balance or other fields.
 */
export function getCreditLimitLabel(customer: CustomerListScalarDisplay): string | null {
    const value = optionalFiniteNumber(customer.credit_limit);
    if (value === null) return null;
    return formatInr(value);
}

/**
 * Compact due-days label from top-level `credit_due_days` only, including 0.
 * Absent / undefined / null / blank / non-numeric → do not show.
 * Never derived from credit_limit or other fields.
 */
export function getCreditDueDaysLabel(customer: CustomerListScalarDisplay): string | null {
    const value = optionalFiniteNumber(customer.credit_due_days);
    if (value === null) return null;
    return value === 1 ? "1 day" : `${value} days`;
}
