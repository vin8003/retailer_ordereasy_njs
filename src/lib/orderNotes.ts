/** Internal shop notes on an order (OE-325). Mirrors the backend limit. */
export const ORDER_NOTES_MAX = 1000;

export function normalizeOrderNotes(raw: string | null | undefined): string {
    return (raw ?? "").trim();
}

/** Returns an error message, or null when the notes can be saved. */
export function validateOrderNotes(raw: string | null | undefined): string | null {
    const notes = normalizeOrderNotes(raw);
    if (notes.length > ORDER_NOTES_MAX) return `Notes can be at most ${ORDER_NOTES_MAX} characters`;
    return null;
}

/** Toast text for a failed PATCH /orders/<id>/notes/. */
export function orderNotesSaveError(error: unknown): string {
    const response = (error as { response?: { status?: number; data?: { error?: unknown } } } | null)?.response;
    if (response?.status === 403) return "You don't have permission to edit order notes";
    const message = response?.data?.error;
    if (typeof message === "string" && message.trim() !== "") return message;
    return "Could not save notes";
}
