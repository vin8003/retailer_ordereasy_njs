import { describe, expect, it } from "vitest";
import {
  PERM_CATALOG_IMAGE,
  PHOTO_ROW_ATTACHED,
  PHOTO_ROW_FAILED,
  buildPhotoImportFormData,
  canImportProductPhotos,
  isPhotoImportDenied,
  parsePhotoImportReport,
  photoImportErrorMessage,
} from "./photoImport";

const report = {
  total_rows: 3,
  successful_rows: 1,
  failed_rows: 2,
  results: [
    { row: 1, key: "890124001", status: "attached", product_id: 44 },
    { row: 2, key: "missing", status: "failed", error: "missing SKU" },
    { row: 3, key: "bad.gif", status: "failed", error: "wrong type", product_id: 45 },
  ],
};

describe("canImportProductPhotos", () => {
  it("requires catalog.image", () => {
    expect(canImportProductPhotos(["catalog.image"])).toBe(true);
    expect(canImportProductPhotos(["catalog.price"])).toBe(false);
    expect(PERM_CATALOG_IMAGE).toBe("catalog.image");
  });
});

describe("parsePhotoImportReport", () => {
  it("maps attached and failed rows from the BE report", () => {
    const parsed = parsePhotoImportReport(report);
    expect(parsed?.successfulRows).toBe(1);
    expect(parsed?.failedRows).toBe(2);
    expect(parsed?.results.map((r) => r.status)).toEqual([
      PHOTO_ROW_ATTACHED,
      PHOTO_ROW_FAILED,
      PHOTO_ROW_FAILED,
    ]);
    expect(parsed?.results[0].productId).toBe(44);
    expect(parsed?.results[1].error).toBe("missing SKU");
  });

  it("rejects a non-report payload", () => {
    expect(parsePhotoImportReport({ error: "Archive must be a zip file" })).toBeNull();
  });
});

describe("errors / form", () => {
  it("maps catalog.image 403 without inventing a DAM", () => {
    expect(isPhotoImportDenied(403, "Catalog image permission required")).toBe(true);
    expect(isPhotoImportDenied(400, "Archive must be a zip file")).toBe(false);
    expect(photoImportErrorMessage(403, "Catalog image permission required")).toContain(
      "catalog.image"
    );
  });

  it("builds multipart with archive and/or csv+images", () => {
    const zip = new File(["zip"], "photos.zip", { type: "application/zip" });
    const csv = new File(["barcode,filename\n"], "map.csv", { type: "text/csv" });
    const img = new File(["img"], "890124001.jpg", { type: "image/jpeg" });
    const form = buildPhotoImportFormData({ archive: zip, csv, images: [img] });
    expect(form).not.toBeNull();
    expect(form?.get("archive")).toBe(zip);
    expect(form?.get("csv")).toBe(csv);
    expect(form?.getAll("images")).toEqual([img]);
    expect(buildPhotoImportFormData({})).toBeNull();
  });
});
