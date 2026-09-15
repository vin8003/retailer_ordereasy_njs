"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { productService } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PHOTO_ROW_ATTACHED,
  buildPhotoImportFormData,
  parsePhotoImportReport,
  photoImportErrorMessage,
  type PhotoImportReport,
} from "@/lib/photoImport";

interface PhotoBulkImportProps {
  canImport: boolean;
}

export function PhotoBulkImport({ canImport }: PhotoBulkImportProps) {
  const archiveRef = useRef<HTMLInputElement>(null);
  const csvRef = useRef<HTMLInputElement>(null);
  const imagesRef = useRef<HTMLInputElement>(null);
  const [archive, setArchive] = useState<File | null>(null);
  const [csv, setCsv] = useState<File | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [report, setReport] = useState<PhotoImportReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!canImport) {
    return (
      <p className="text-sm text-muted-foreground">
        Photo attach needs <code>catalog.image</code>. This uses the existing product image field — no second media library.
      </p>
    );
  }

  const onSubmit = async () => {
    const form = buildPhotoImportFormData({ archive, csv, images });
    if (!form) {
      setError("Choose a zip archive and/or a CSV plus image files.");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const res = await productService.uploadProductImages(form);
      const parsed = parsePhotoImportReport(res.data);
      if (!parsed) {
        setError("Unexpected import payload.");
        return;
      }
      setReport(parsed);
      toast.success(
        `${parsed.successfulRows} attached, ${parsed.failedRows} failed (file not aborted).`
      );
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { error?: string } } };
      const message = photoImportErrorMessage(
        axiosErr.response?.status,
        axiosErr.response?.data?.error
      );
      setError(message);
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Attach photos to existing SKUs. Zip names like <code>barcode.jpg</code> or <code>product_id.png</code>,
        or a CSV plus files. Failed rows are listed; they do not stop the rest.
      </p>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1">
          <Label htmlFor="photo-zip">Zip archive</Label>
          <Input
            id="photo-zip"
            ref={archiveRef}
            type="file"
            accept=".zip,application/zip"
            onChange={(e) => setArchive(e.target.files?.[0] ?? null)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="photo-csv">CSV map</Label>
          <Input
            id="photo-csv"
            ref={csvRef}
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => setCsv(e.target.files?.[0] ?? null)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="photo-images">Image files</Label>
          <Input
            id="photo-images"
            ref={imagesRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp,.jpg,.jpeg,.png,.gif,.webp"
            multiple
            onChange={(e) => setImages(Array.from(e.target.files ?? []))}
          />
        </div>
      </div>
      <Button type="button" onClick={onSubmit} disabled={uploading}>
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4 mr-2" />}
        Attach photos
      </Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {report && (
        <div className="space-y-2">
          <p className="text-sm">
            {report.successfulRows} attached · {report.failedRows} failed · {report.totalRows} rows
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Row</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Error</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.results.map((row) => (
                <TableRow key={`${row.row}-${row.key}`}>
                  <TableCell>{row.row}</TableCell>
                  <TableCell className="font-mono text-xs">{row.key || "—"}</TableCell>
                  <TableCell>
                    {row.status === PHOTO_ROW_ATTACHED ? (
                      <span className="text-green-700">attached</span>
                    ) : (
                      <span className="text-red-600">failed</span>
                    )}
                  </TableCell>
                  <TableCell>{row.productId ?? "—"}</TableCell>
                  <TableCell>{row.error ?? ""}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
