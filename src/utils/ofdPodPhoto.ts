/** Optional BE retailer OFD / order-detail `pod_photo_url` (display-only thumb). */
export type OfdPodPhotoDisplay = {
    pod_photo_url?: string | null;
    /** Allowed on payloads / tests; never used to invent pod_photo_url. */
    proof_of_delivery_url?: string | null;
    pod_image?: string | null;
    pod_image_url?: string | null;
    delivery_photo?: string | null;
    delivery_photo_url?: string | null;
    photo_url?: string | null;
    image_url?: string | null;
    signature_url?: string | null;
    pod_photo?: string | null;
    delivery_info?: { pod_photo_url?: string | null } | null;
    proof_of_delivery?: { url?: string | null } | null;
    status?: string | null;
};

function optionalTrimmedText(raw: string | null | undefined): string | null {
    if (raw === undefined || raw === null) return null;
    const trimmed = raw.trim();
    return trimmed === "" ? null : trimmed;
}

/**
 * Thumbnail URL from top-level `pod_photo_url` only.
 * Absent / undefined / null / blank → do not show.
 * Never derived from proof_of_delivery_url, pod_image, delivery_photo, nested delivery_info, or other photo-like fields.
 * Display only — does not affect OFD close-out / status transitions.
 */
export function getOfdPodPhotoUrl(order: OfdPodPhotoDisplay): string | null {
    return optionalTrimmedText(order.pod_photo_url);
}
