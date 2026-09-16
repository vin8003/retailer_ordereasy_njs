/** OE-100 / F-0041 — supplier GSTIN, payment terms, inactive picker (BE RCP #99/#100). */

import { hasPermission } from "@/lib/org";

export const PERM_PURCHASING_TERMS = "purchasing.terms";

export const GSTIN_PATTERN =
  /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export const GSTIN_FORMAT_MESSAGE =
  "Invalid GSTIN format. It should be like: 22AAAAA0000A1Z5 (15 characters).";
export const DUPLICATE_GSTIN_MESSAGE =
  "GSTIN already used by another supplier in this organization.";
export const PAYMENT_TERMS_FORBIDDEN =
  "Payment terms may only be changed by a purchase-role user";
export const PAYMENT_TERMS_WHITESPACE = "Payment terms cannot be whitespace-only.";
export const INACTIVE_SUPPLIER_MESSAGE =
  "Inactive suppliers cannot be selected on new purchase documents.";

export interface SupplierRecord {
  id: number;
  company_name: string;
  is_active?: boolean;
  gst_number?: string | null;
  payment_terms?: string | null;
}

export interface SupplierFormFields {
  company_name: string;
  contact_person: string;
  phone_number: string;
  email: string;
  address: string;
  gst_number: string;
  payment_terms: string;
  is_active: boolean;
}

export function canEditPaymentTerms(
  permissions: ReadonlySet<string> | string[]
): boolean {
  return hasPermission(permissions, PERM_PURCHASING_TERMS);
}

/** Strip + uppercase. Blank stays blank. */
export function normalizeGstin(value: string | null | undefined): string {
  return (value ?? "").trim().toUpperCase();
}

export function isValidGstin(value: string | null | undefined): boolean {
  const gstin = normalizeGstin(value);
  if (!gstin) return true;
  return GSTIN_PATTERN.test(gstin);
}

export function normalizePaymentTerms(value: string | null | undefined): string {
  return (value ?? "").trim();
}

export function isWhitespaceOnlyPaymentTerms(
  value: string | null | undefined
): boolean {
  const raw = value ?? "";
  return Boolean(raw) && !raw.trim();
}

/** Active suppliers only; keep current id so an existing PI can stay on an inactive supplier. */
export function selectableSuppliersForNewPurchase<T extends SupplierRecord>(
  suppliers: T[],
  keepId?: string | number | null
): T[] {
  const keep = keepId == null || keepId === "" ? null : String(keepId);
  return suppliers.filter(
    (s) => s.is_active !== false || (keep != null && String(s.id) === keep)
  );
}

export function isSupplierSelectableForNewPurchase(
  supplier: Pick<SupplierRecord, "is_active"> | null | undefined
): boolean {
  if (!supplier) return false;
  return supplier.is_active !== false;
}

/**
 * Add-New on a purchase document. BE rejects an inactive supplier there, so an
 * inactive record stays created but unselected instead of failing on save.
 */
export function selectionAfterSupplierCreate(
  created: Pick<SupplierRecord, "id" | "is_active"> | null | undefined,
  currentValue: string
): { value: string; warning: string | null } {
  if (!created || created.id == null) return { value: currentValue, warning: null };
  if (!isSupplierSelectableForNewPurchase(created)) {
    return { value: currentValue, warning: INACTIVE_SUPPLIER_MESSAGE };
  }
  return { value: String(created.id), warning: null };
}

export function buildSupplierWritePayload(
  values: SupplierFormFields,
  options: { canEditTerms: boolean }
): Record<string, string | boolean> | null {
  const gstin = normalizeGstin(values.gst_number);
  if (!isValidGstin(gstin)) return null;
  if (options.canEditTerms && isWhitespaceOnlyPaymentTerms(values.payment_terms)) {
    return null;
  }

  const payload: Record<string, string | boolean> = {
    company_name: values.company_name.trim(),
    contact_person: values.contact_person.trim(),
    phone_number: values.phone_number.trim(),
    email: values.email.trim(),
    address: values.address.trim(),
    gst_number: gstin,
    is_active: values.is_active,
  };
  if (options.canEditTerms) {
    payload.payment_terms = normalizePaymentTerms(values.payment_terms);
  }
  return payload;
}

function firstMessage(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) return value;
  if (Array.isArray(value) && value.length) {
    const first = value[0];
    if (typeof first === "string") return first;
    if (first === true) return undefined;
  }
  return undefined;
}

function isTruthyFlag(value: unknown): boolean {
  if (value === true) return true;
  if (Array.isArray(value) && value.some((v) => v === true || v === "true")) return true;
  return false;
}

export function isGstinDuplicatePayload(data: unknown): boolean {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  if (isTruthyFlag(d.gstin_duplicate)) return true;
  const gstMsg = firstMessage(d.gst_number) ?? "";
  return gstMsg.includes("already used");
}

/** Flatten DRF / axios supplier and purchase-invoice errors. */
export function supplierErrorMessage(err: {
  response?: { status?: number; data?: unknown };
}): string {
  const status = err.response?.status;
  const data = err.response?.data;
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    if (isGstinDuplicatePayload(d)) return DUPLICATE_GSTIN_MESSAGE;
    if (status === 403) {
      const forbidden = firstMessage(d.error) ?? "";
      if (/payment terms/i.test(forbidden) || /purchase-role/i.test(forbidden)) {
        return PAYMENT_TERMS_FORBIDDEN;
      }
    }
    const named =
      firstMessage(d.gst_number) ||
      firstMessage(d.payment_terms) ||
      firstMessage(d.supplier) ||
      firstMessage(d.error) ||
      firstMessage(d.detail);
    if (named) return named;
    const messages: string[] = [];
    for (const [key, value] of Object.entries(d)) {
      if (key === "gstin_duplicate") continue;
      const msg = firstMessage(value);
      if (msg) messages.push(msg);
    }
    if (messages.length) return messages.join(" ");
  }
  if (status === 403) return PAYMENT_TERMS_FORBIDDEN;
  return "Failed to save supplier";
}

export function purchaseInvoiceErrorMessage(err: {
  response?: { status?: number; data?: unknown };
}): string {
  const mapped = supplierErrorMessage(err);
  if (mapped !== "Failed to save supplier") return mapped;
  return "Failed to save purchase";
}
