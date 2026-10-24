/** How long a barcode stays "in view" after the camera last read it. */
export const IN_VIEW_MS = 1500;

export type Detection = { code: string; at: number };

/** The code to scan when the cashier taps, or null if the camera has not read one recently. */
export function pickDetectedCode(last: Detection | null, now: number): string | null {
    if (!last || now - last.at > IN_VIEW_MS) return null;
    return last.code;
}
