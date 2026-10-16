/** OE-143 / F-0052 — Khata credit limit + due-days lock (mirrors RCP credit_lock.py). */

export const REASON_CREDIT_LIMIT = "credit_limit";
export const REASON_CREDIT_OVERDUE = "credit_overdue";
export const PERM_CREDIT_OVERRIDE = "orders.update";

export type CreditLockReason = typeof REASON_CREDIT_LIMIT | typeof REASON_CREDIT_OVERDUE;

export interface KhataMapping {
  creditLimit: number;
  currentBalance: number;
  creditDueDays: number | null;
  /** Absent on current CRM detail serializer — do not invent. */
  outstandingSince?: string | null;
}

export function last10Digits(raw?: string | null): string {
  const digits = String(raw ?? "").replace(/\D/g, "");
  return digits.slice(-10);
}

export function asMoney(value: unknown): number {
  if (value == null || value === "") return 0;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function elapsedDueDays(outstandingSince: string, now: Date = new Date()): number {
  const start = new Date(outstandingSince);
  if (Number.isNaN(start.getTime())) return 0;
  const startDay = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const endDay = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.floor((endDay - startDay) / 86_400_000);
}

export function creditAmountForPos(
  mode: "cash" | "upi" | "credit" | "split",
  split: { credit?: number },
  total: number
): number {
  if (mode === "credit") return total;
  if (mode === "split") return asMoney(split.credit);
  return 0;
}

/**
 * Same rules as BE: limit 0 = unset; due days null = unset.
 * Due-days needs outstanding_since (not on CRM detail today).
 */
export function creditSaleLockReasons(
  mapping: KhataMapping | null | undefined,
  creditAmount: number,
  now: Date = new Date()
): CreditLockReason[] {
  if (!mapping || creditAmount <= 0) return [];
  const reasons: CreditLockReason[] = [];
  const limit = asMoney(mapping.creditLimit);
  if (limit > 0 && asMoney(mapping.currentBalance) + creditAmount > limit) {
    reasons.push(REASON_CREDIT_LIMIT);
  }
  const dueDays = mapping.creditDueDays;
  const since = mapping.outstandingSince;
  if (
    dueDays != null &&
    asMoney(mapping.currentBalance) > 0 &&
    since &&
    elapsedDueDays(since, now) >= dueDays
  ) {
    reasons.push(REASON_CREDIT_OVERDUE);
  }
  return reasons;
}

export function formatCreditLockMessage(
  mapping: KhataMapping,
  reasons: CreditLockReason[]
): string {
  const parts: string[] = [];
  if (reasons.includes(REASON_CREDIT_LIMIT)) {
    const available = Math.max(asMoney(mapping.creditLimit) - asMoney(mapping.currentBalance), 0);
    parts.push(
      `Credit limit exceeded. Limit: ₹${asMoney(mapping.creditLimit)}, Current balance: ₹${asMoney(mapping.currentBalance)}, Available: ₹${available}`
    );
  }
  if (reasons.includes(REASON_CREDIT_OVERDUE)) {
    parts.push("Credit sales locked: outstanding is past due days.");
  }
  return parts.join(" ") || "Credit sales locked.";
}

export function lockReasonsFromCheckoutError(error: string | undefined): CreditLockReason[] {
  const msg = error ?? "";
  const reasons: CreditLockReason[] = [];
  if (/credit limit exceeded/i.test(msg)) reasons.push(REASON_CREDIT_LIMIT);
  if (/past due days/i.test(msg)) reasons.push(REASON_CREDIT_OVERDUE);
  return reasons;
}

export function isCreditLockError(error: string | undefined): boolean {
  const msg = error ?? "";
  return (
    lockReasonsFromCheckoutError(msg).length > 0 ||
    /credit sales locked/i.test(msg)
  );
}

export function isCreditOverrideDenied(error: {
  response?: { status?: number; data?: { error?: string } };
}): boolean {
  if (error.response?.status !== 403) return false;
  return /override credit lock/i.test(error.response.data?.error ?? "");
}

export function canOverrideCreditLock(
  permissions: ReadonlySet<string> | string[]
): boolean {
  const set = permissions instanceof Set ? permissions : new Set(permissions);
  return set.has(PERM_CREDIT_OVERRIDE);
}

export function attachCreditOverride<T extends Record<string, unknown>>(
  payload: T,
  override: boolean
): T & { credit_override?: boolean } {
  if (!override) return payload;
  return { ...payload, credit_override: true };
}

export function pickCustomerFromList<T extends { phone_number?: string; phoneNumber?: string }>(
  rows: T[],
  phone: string
): T | null {
  const last10 = last10Digits(phone);
  if (last10.length < 10) return null;
  return (
    rows.find((row) => last10Digits(row.phone_number ?? row.phoneNumber) === last10) ?? null
  );
}

export function khataFromDetail(data: {
  customer_id?: number;
  credit_limit?: unknown;
  current_balance?: unknown;
  credit_due_days?: unknown;
  outstanding_since?: string | null;
}): KhataMapping & { customerId: number | null } {
  const due = data.credit_due_days;
  return {
    customerId: typeof data.customer_id === "number" ? data.customer_id : null,
    creditLimit: asMoney(data.credit_limit),
    currentBalance: asMoney(data.current_balance),
    creditDueDays: due == null || due === "" ? null : Number(due),
    outstandingSince: data.outstanding_since ?? null,
  };
}

export function mergeLockReasons(
  ...groups: CreditLockReason[][]
): CreditLockReason[] {
  return [...new Set(groups.flat())];
}
