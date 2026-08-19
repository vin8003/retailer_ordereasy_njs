export function parseOrderNumberFromText(text?: string | null): string | null {
    if (!text) return null;
    const match = String(text).match(/Order\s*#\s*([A-Za-z0-9-]+)/i);
    return match?.[1] ?? null;
}

export function orderDetailsHref(opts: {
    id?: number | string | null;
    orderNumber?: string | null;
}): string | null {
    if (opts.id != null && opts.id !== "") {
        return `/dashboard/orders/details?id=${opts.id}`;
    }
    if (opts.orderNumber) {
        return `/dashboard/orders/details?number=${encodeURIComponent(String(opts.orderNumber))}`;
    }
    return null;
}
