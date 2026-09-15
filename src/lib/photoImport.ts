/** OE-124 / F-0027 — bulk photo attach (BE POST products/upload/images/). */

import { hasPermission } from "@/lib/org";

export const PERM_CATALOG_IMAGE = "catalog.image";

export const PHOTO_ROW_ATTACHED = "attached";
export const PHOTO_ROW_FAILED = "failed";

export interface PhotoImportRow {
  row: number;
  key: string;
  status: typeof PHOTO_ROW_ATTACHED | typeof PHOTO_ROW_FAILED | string;
  error?: string;
  productId?: number;
}

export interface PhotoImportReport {
  totalRows: number;
  successfulRows: number;
  failedRows: number;
  results: PhotoImportRow[];
}

export function canImportProductPhotos(
  permissions: ReadonlySet<string> | string[]
): boolean {
  return hasPermission(permissions, PERM_CATALOG_IMAGE);
}

export function parsePhotoImportReport(data: unknown): PhotoImportReport | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  if (!Array.isArray(d.results)) return null;
  const results: PhotoImportRow[] = d.results.map((raw) => {
    const row = (raw ?? {}) as Record<string, unknown>;
    return {
      row: typeof row.row === "number" ? row.row : 0,
      key: String(row.key ?? ""),
      status: String(row.status ?? ""),
      error: row.error == null ? undefined : String(row.error),
      productId: typeof row.product_id === "number" ? row.product_id : undefined,
    };
  });
  return {
    totalRows: typeof d.total_rows === "number" ? d.total_rows : results.length,
    successfulRows:
      typeof d.successful_rows === "number"
        ? d.successful_rows
        : results.filter((r) => r.status === PHOTO_ROW_ATTACHED).length,
    failedRows:
      typeof d.failed_rows === "number"
        ? d.failed_rows
        : results.filter((r) => r.status === PHOTO_ROW_FAILED).length,
    results,
  };
}

export function isPhotoImportDenied(status?: number, error?: string): boolean {
  if (status !== 403) return false;
  return /catalog image/i.test(error ?? "") || /permission required/i.test(error ?? "");
}

export function isPhotoImportBadArchive(status?: number): boolean {
  return status === 400;
}

export function photoImportErrorMessage(status?: number, error?: string): string {
  if (isPhotoImportDenied(status, error)) {
    return "catalog.image is required to attach product photos.";
  }
  return error || "Photo import failed.";
}

export function buildPhotoImportFormData(input: {
  archive?: File | null;
  csv?: File | null;
  images?: File[] | null;
}): FormData | null {
  const form = new FormData();
  let hasFile = false;
  if (input.archive) {
    form.append("archive", input.archive);
    hasFile = true;
  }
  if (input.csv) {
    form.append("csv", input.csv);
    hasFile = true;
  }
  for (const file of input.images ?? []) {
    form.append("images", file);
    hasFile = true;
  }
  return hasFile ? form : null;
}
