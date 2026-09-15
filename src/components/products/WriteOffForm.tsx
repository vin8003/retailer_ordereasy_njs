"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { productService } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  WRITE_OFF_REASONS,
  axiosWriteOffError,
  buildWriteOffPayload,
  parseWriteOffResult,
  type WriteOffReason,
  type WriteOffResult,
} from "@/lib/writeOff";

export interface WriteOffBatch {
  id: number;
  batch_number?: string;
  expiry_date?: string | null;
  quantity?: number | string;
  is_active?: boolean;
}

interface WriteOffFormProps {
  productId: number;
  hasBatches?: boolean;
  batches?: WriteOffBatch[];
  canWriteOff: boolean;
  onWrittenOff?: (result: WriteOffResult) => void;
}

export function WriteOffForm({
  productId,
  hasBatches = false,
  batches = [],
  canWriteOff,
  onWrittenOff,
}: WriteOffFormProps) {
  const [reason, setReason] = useState<WriteOffReason>("damage");
  const [quantity, setQuantity] = useState("");
  const [batchId, setBatchId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<WriteOffResult | null>(null);

  const activeBatches = batches.filter((b) => b.is_active !== false);

  if (!canWriteOff) {
    return (
      <p className="text-sm text-muted-foreground">
        Write-off needs <code>inventory.adjust</code>. This posts the existing write-off document — no StockMovement engine.
      </p>
    );
  }

  const submit = async () => {
    const payload = buildWriteOffPayload({
      quantity,
      reason,
      batchId: batchId && batchId !== "none" ? batchId : null,
    });
    if (!payload) {
      setError("Enter a quantity greater than 0 and pick damage, expiry, or spoilage.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await productService.writeOff(productId, payload);
      const parsed = parseWriteOffResult(res.data);
      if (!parsed) {
        setError("Unexpected write-off payload.");
        return;
      }
      setResult(parsed);
      setQuantity("");
      onWrittenOff?.(parsed);
      toast.success(`Wrote off ${parsed.quantityChange} (${parsed.reason}).`);
    } catch (err: unknown) {
      const mapped = axiosWriteOffError(
        err as { response?: { status?: number; data?: { error?: string } } }
      );
      setError(mapped.message);
      toast.error(mapped.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">Write off damage / expiry / spoilage</p>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <Label>Reason</Label>
          <Select value={reason} onValueChange={(value) => setReason(value as WriteOffReason)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WRITE_OFF_REASONS.map((code) => (
                <SelectItem key={code} value={code}>
                  {code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Quantity</Label>
          <Input
            inputMode="decimal"
            placeholder="Qty to remove"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value.replace(/[^\d.]/g, ""))}
          />
        </div>
        <div className="space-y-1">
          <Label>Batch {reason === "expiry" || hasBatches ? "(required)" : "(optional)"}</Label>
          <Select value={batchId || "none"} onValueChange={setBatchId}>
            <SelectTrigger>
              <SelectValue placeholder={activeBatches.length ? "Select batch" : "No batches"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No batch</SelectItem>
              {activeBatches.map((batch) => (
                <SelectItem key={batch.id} value={String(batch.id)}>
                  {batch.batch_number || `Batch ${batch.id}`}
                  {batch.expiry_date ? ` · exp ${batch.expiry_date}` : ""}
                  {batch.quantity != null ? ` · ${batch.quantity}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button type="button" onClick={submit} disabled={submitting}>
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Write off"}
      </Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {result && (
        <p className="text-xs text-green-700">
          {result.logType}: {result.previousQuantity} → {result.newQuantity}
        </p>
      )}
    </div>
  );
}
