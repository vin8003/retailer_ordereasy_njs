/** Phone photos are often 5-12 MB; the server accepts 5 MB per document. Shrink them first. */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const MAX_SIDE = 2000;
const QUALITY = 0.85;

/** Dimensions that fit inside `maxSide`, keeping the aspect ratio; never scales up. */
export function fitWithin(width: number, height: number, maxSide = MAX_SIDE) {
    const scale = Math.min(1, maxSide / Math.max(width, height));
    return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

/** A new name ending in .jpg for a re-encoded photo. */
export function jpegName(name: string) {
    return `${name.replace(/\.[^./\\]+$/, '') || 'photo'}.jpg`;
}

/** Message for a failed upload; a refused body (nginx 413) reaches the browser without a response. */
export function uploadErrorMessage(err: any): string {
    const status = err?.response?.status;
    if (status === 413) return 'The file is too large. Try a smaller photo.';
    if (!err?.response) return 'Could not upload. Check your internet connection or try a smaller photo.';
    return err.response.data?.file?.[0] || err.response.data?.error || err.response.data?.detail || 'Upload failed. Please try again.';
}

/**
 * Returns the file ready to upload. Images above the limit (or very large ones) are
 * downscaled to a JPEG; PDFs and small images are returned as they are.
 * Throws an Error with a user-facing message when the file cannot be made small enough.
 */
export async function prepareImageForUpload(file: File, maxBytes = MAX_UPLOAD_BYTES): Promise<File> {
    if (!file.type.startsWith('image/')) {
        if (file.size > maxBytes) throw new Error('File must be 5 MB or smaller.');
        return file;
    }
    // Small JPEG/PNG/WEBP need nothing.
    if (file.size <= maxBytes / 2 && /^image\/(jpeg|png|webp)$/.test(file.type)) return file;

    let bitmap: ImageBitmap;
    try {
        bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
        if (file.size <= maxBytes && /^image\/(jpeg|png|webp)$/.test(file.type)) return file;
        throw new Error('This photo format is not supported. Please choose a JPG or PNG.');
    }
    try {
        let side = MAX_SIDE;
        let quality = QUALITY;
        for (let attempt = 0; attempt < 4; attempt++) {
            const { width, height } = fitWithin(bitmap.width, bitmap.height, side);
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) break;
            ctx.fillStyle = '#fff';
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(bitmap, 0, 0, width, height);
            const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
            if (blob && blob.size <= maxBytes) {
                return new File([blob], jpegName(file.name), { type: 'image/jpeg', lastModified: Date.now() });
            }
            side = Math.round(side * 0.7);
            quality = Math.max(0.6, quality - 0.1);
        }
    } finally {
        bitmap.close?.();
    }
    throw new Error('Could not shrink this photo below 5 MB. Please choose a smaller one.');
}
