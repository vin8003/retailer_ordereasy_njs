/** OE-212 / F-0105 — retailer phone lookup (BE GET customer/retailer/lookup/). */

export const LOOKUP_RECENT_LIMIT = 20;
export const LOOKUP_MIN_DIGITS = 10;

export interface LookupOrder {
  id: number;
  order_number: string;
  source: string;
  status: string;
  total_amount: number | string;
  created_at: string;
  items_count: number;
}

export interface CustomerLookup {
  customer_id: number | null;
  mapping_id: number | null;
  customer_name: string;
  phone_number: string;
  nickname: string | null;
  registration_status: string;
  total_orders: number;
  total_spent: number | string;
  current_balance: number | string | null;
  credit_limit: number | string | null;
  recent_orders: LookupOrder[];
}

export interface LookupExportPage {
  customer: Omit<CustomerLookup, "recent_orders">;
  count?: number;
  next?: string | null;
  previous?: string | null;
  results: LookupOrder[];
}

export function digitsForLookup(raw?: string | null): string {
  return String(raw ?? "").replace(/\D/g, "").slice(-10);
}

export function isLookupPhoneReady(raw?: string | null): boolean {
  return digitsForLookup(raw).length >= LOOKUP_MIN_DIGITS;
}

export function formatLookupSource(source?: string | null): string {
  if (source === "pos") return "POS";
  if (source === "app") return "App";
  return source || "App";
}

function asOrderRow(row: unknown): LookupOrder | null {
  if (!row || typeof row !== "object") return null;
  const r = row as Record<string, unknown>;
  if (typeof r.id !== "number") return null;
  return {
    id: r.id,
    order_number: String(r.order_number ?? ""),
    source: String(r.source ?? "app"),
    status: String(r.status ?? ""),
    total_amount: (r.total_amount as number | string) ?? 0,
    created_at: String(r.created_at ?? ""),
    items_count: typeof r.items_count === "number" ? r.items_count : 0,
  };
}

export function parseLookupResponse(data: unknown): CustomerLookup | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  const orders = Array.isArray(d.recent_orders)
    ? d.recent_orders.map(asOrderRow).filter((row): row is LookupOrder => row != null)
    : [];
  return {
    customer_id: typeof d.customer_id === "number" ? d.customer_id : null,
    mapping_id: typeof d.mapping_id === "number" ? d.mapping_id : null,
    customer_name: String(d.customer_name ?? ""),
    phone_number: String(d.phone_number ?? ""),
    nickname: d.nickname == null ? null : String(d.nickname),
    registration_status: String(d.registration_status ?? ""),
    total_orders: typeof d.total_orders === "number" ? d.total_orders : 0,
    total_spent: (d.total_spent as number | string) ?? 0,
    current_balance:
      d.current_balance == null ? null : (d.current_balance as number | string),
    credit_limit: d.credit_limit == null ? null : (d.credit_limit as number | string),
    recent_orders: orders.slice(0, LOOKUP_RECENT_LIMIT),
  };
}

export function parseLookupExport(data: unknown): LookupExportPage | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  const customerRaw = parseLookupResponse({
    ...(typeof d.customer === "object" && d.customer ? d.customer : {}),
    recent_orders: [],
  });
  if (!customerRaw) return null;
  const { recent_orders: _ignored, ...customer } = customerRaw;
  const results = Array.isArray(d.results)
    ? d.results.map(asOrderRow).filter((row): row is LookupOrder => row != null)
    : [];
  return {
    customer,
    count: typeof d.count === "number" ? d.count : undefined,
    next: (d.next as string | null | undefined) ?? null,
    previous: (d.previous as string | null | undefined) ?? null,
    results,
  };
}

export function isLookupNotFound(status?: number): boolean {
  return status === 404;
}

export function isLookupBadPhone(status?: number): boolean {
  return status === 400;
}

export function isHistoryExportDenied(status?: number): boolean {
  return status === 403;
}
