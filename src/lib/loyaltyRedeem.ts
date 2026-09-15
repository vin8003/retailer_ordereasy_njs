/** OE-220 / F-0107 — staff OTP redeem (BE POST customer/retailer/loyalty/*). */

import { hasPermission } from "@/lib/org";

/** Catalog has no rewards.redeem — staff redeem reuses orders.update. */
export const PERM_LOYALTY_REDEEM = "orders.update";
export const MODULE_REWARDS = "rewards";

export const ERR_OTP_REQUIRED = "OTP is required to redeem points";
export const ERR_OTP_INVALID = "Invalid or expired OTP";
export const ERR_OTP_USED = "This OTP has already been used";
export const ERR_NO_MOBILE = "Customer has no registered mobile";
export const ERR_SEND_FAILED = "Failed to send OTP";
export const ERR_NO_POINTS = "No redeemable points";
export const ERR_ORDER_CLOSED = "Order is not open for redeem";
export const ERR_ALREADY = "Points already redeemed on this order";
export const ERR_NO_CUSTOMER = "Order has no customer";
export const ERR_SPLIT_TENDER = "Redeem is only allowed on a single-tender pending order";
export const ERR_NO_WALLET = "No loyalty wallet at this shop";

export interface RedeemableOrder {
  id: number;
  order_number?: string;
  status?: string;
  total_amount?: number | string;
  source?: string;
}

export interface OtpSentResult {
  message: string;
  expiresIn: number | null;
}

export interface RedeemResult {
  orderId: number;
  pointsRedeemed: number | string;
  discountFromPoints: number | string;
  totalAmount: number | string;
}

export type RedeemErrorKind =
  | "otp_required"
  | "otp_invalid"
  | "otp_used"
  | "no_mobile"
  | "send_failed"
  | "no_points"
  | "order_closed"
  | "already"
  | "no_customer"
  | "split_tender"
  | "no_wallet"
  | "forbidden"
  | "not_found"
  | "module_disabled"
  | "bad_request"
  | "unknown";

export function canStaffRedeem(
  permissions: ReadonlySet<string> | string[],
  rewardsModuleEnabled: boolean
): boolean {
  return rewardsModuleEnabled && hasPermission(permissions, PERM_LOYALTY_REDEEM);
}

export function pendingOrdersForRedeem<T extends { status?: string }>(
  orders: T[] | null | undefined
): T[] {
  if (!Array.isArray(orders)) return [];
  return orders.filter((row) => String(row.status ?? "").toLowerCase() === "pending");
}

export function buildRedeemOtpPayload(input: {
  orderId?: number | null;
  customerId?: number | null;
  locationId?: number | null;
}): { order_id: number } | { customer_id: number; location_id?: number } | null {
  if (typeof input.orderId === "number" && input.orderId > 0) {
    return { order_id: input.orderId };
  }
  if (typeof input.customerId === "number" && input.customerId > 0) {
    const body: { customer_id: number; location_id?: number } = {
      customer_id: input.customerId,
    };
    if (typeof input.locationId === "number" && input.locationId > 0) {
      body.location_id = input.locationId;
    }
    return body;
  }
  return null;
}

export function buildRedeemPayload(input: {
  orderId: number;
  otpCode: string;
  points?: string | number | null;
}): { order_id: number; otp_code: string; points?: string | number } | null {
  if (!(input.orderId > 0)) return null;
  const otp = String(input.otpCode ?? "").trim();
  if (!otp) return null;
  const body: { order_id: number; otp_code: string; points?: string | number } = {
    order_id: input.orderId,
    otp_code: otp,
  };
  if (input.points != null && input.points !== "") {
    body.points = input.points;
  }
  return body;
}

export function parseOtpSent(data: unknown): OtpSentResult | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  return {
    message: String(d.message ?? "OTP sent"),
    expiresIn: typeof d.expires_in === "number" ? d.expires_in : null,
  };
}

export function parseRedeemResult(data: unknown): RedeemResult | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  if (typeof d.order_id !== "number") return null;
  return {
    orderId: d.order_id,
    pointsRedeemed: (d.points_redeemed as number | string) ?? 0,
    discountFromPoints: (d.discount_from_points as number | string) ?? 0,
    totalAmount: (d.total_amount as number | string) ?? 0,
  };
}

export function classifyRedeemError(
  status?: number,
  error?: string
): RedeemErrorKind {
  if (status === 404) return "not_found";
  const msg = error ?? "";
  if (status === 403) {
    if (/module rewards is disabled/i.test(msg)) return "module_disabled";
    return "forbidden";
  }
  if (msg === ERR_OTP_REQUIRED) return "otp_required";
  if (msg === ERR_OTP_INVALID) return "otp_invalid";
  if (msg === ERR_OTP_USED) return "otp_used";
  if (msg === ERR_NO_MOBILE) return "no_mobile";
  if (msg === ERR_SEND_FAILED) return "send_failed";
  if (msg === ERR_NO_POINTS) return "no_points";
  if (msg === ERR_ORDER_CLOSED) return "order_closed";
  if (msg === ERR_ALREADY) return "already";
  if (msg === ERR_NO_CUSTOMER) return "no_customer";
  if (msg === ERR_SPLIT_TENDER) return "split_tender";
  if (msg === ERR_NO_WALLET) return "no_wallet";
  if (status === 400) return "bad_request";
  return "unknown";
}

export function redeemErrorMessage(kind: RedeemErrorKind, fallback?: string): string {
  switch (kind) {
    case "otp_required":
      return ERR_OTP_REQUIRED;
    case "otp_invalid":
      return ERR_OTP_INVALID;
    case "otp_used":
      return ERR_OTP_USED;
    case "no_mobile":
      return ERR_NO_MOBILE;
    case "send_failed":
      return ERR_SEND_FAILED;
    case "no_points":
      return ERR_NO_POINTS;
    case "order_closed":
      return ERR_ORDER_CLOSED;
    case "already":
      return ERR_ALREADY;
    case "no_customer":
      return ERR_NO_CUSTOMER;
    case "split_tender":
      return ERR_SPLIT_TENDER;
    case "no_wallet":
      return ERR_NO_WALLET;
    case "forbidden":
      return "orders.update and the rewards module are required to redeem.";
    case "not_found":
      return "Customer or order not found in this shop.";
    case "module_disabled":
      return "Rewards module is disabled for this organization.";
    case "bad_request":
      return fallback || "Redeem request was rejected.";
    default:
      return fallback || "Redeem failed.";
  }
}

export function axiosRedeemError(err: {
  response?: { status?: number; data?: { error?: string } };
}): { kind: RedeemErrorKind; message: string } {
  const status = err.response?.status;
  const error = err.response?.data?.error;
  const kind = classifyRedeemError(status, error);
  return { kind, message: redeemErrorMessage(kind, error) };
}
