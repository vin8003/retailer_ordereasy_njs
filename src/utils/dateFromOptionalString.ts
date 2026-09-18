/**
 * Type-safe Date from an optional BE date string.
 * Missing / empty / null → Invalid Date (same as `new Date(undefined)` at runtime).
 */
export function dateFromOptionalString(raw: string | null | undefined): Date {
    return new Date(raw ?? "");
}
