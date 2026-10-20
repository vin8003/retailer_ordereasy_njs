/** Field-level message for a supplier `email` the backend rejected (OE-337). */
export function supplierEmailError(error: unknown): string | null {
    const raw = (error as { response?: { data?: { email?: unknown } } } | null)?.response?.data?.email;
    if (raw === undefined || raw === null) return null;
    const first = Array.isArray(raw) ? raw[0] : raw;
    if (typeof first === "string" && first.trim() !== "") return `Email: ${first.trim()}`;
    return "Enter a valid supplier email";
}
