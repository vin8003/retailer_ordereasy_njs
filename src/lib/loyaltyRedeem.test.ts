import { describe, expect, it } from "vitest";
import {
  ERR_OTP_INVALID,
  ERR_OTP_REQUIRED,
  ERR_SPLIT_TENDER,
  PERM_LOYALTY_REDEEM,
  axiosRedeemError,
  buildRedeemOtpPayload,
  buildRedeemPayload,
  canStaffRedeem,
  classifyRedeemError,
  parseOtpSent,
  parseRedeemResult,
  pendingOrdersForRedeem,
} from "./loyaltyRedeem";

const pending = {
  id: 9,
  order_number: "APP-9",
  status: "pending",
  total_amount: "80.00",
  source: "app",
};

describe("canStaffRedeem", () => {
  it("requires orders.update and rewards module", () => {
    expect(canStaffRedeem(["orders.update"], true)).toBe(true);
    expect(canStaffRedeem(["orders.update"], false)).toBe(false);
    expect(canStaffRedeem(["orders.read"], true)).toBe(false);
    expect(PERM_LOYALTY_REDEEM).toBe("orders.update");
  });
});

describe("pendingOrdersForRedeem", () => {
  it("keeps only pending rows (staff redeem is not POS checkout burn)", () => {
    expect(
      pendingOrdersForRedeem([
        pending,
        { ...pending, id: 2, status: "delivered" },
        { ...pending, id: 3, status: "PENDING" },
      ]).map((row) => row.id)
    ).toEqual([9, 3]);
  });

  it("returns empty when no pending order exists", () => {
    expect(pendingOrdersForRedeem([{ id: 1, status: "delivered" }])).toEqual([]);
    expect(pendingOrdersForRedeem(undefined)).toEqual([]);
  });
});

describe("payloads", () => {
  it("prefers order_id for OTP send", () => {
    expect(
      buildRedeemOtpPayload({ orderId: 9, customerId: 11, locationId: 4 })
    ).toEqual({ order_id: 9 });
  });

  it("falls back to customer_id + location_id", () => {
    expect(buildRedeemOtpPayload({ customerId: 11, locationId: 4 })).toEqual({
      customer_id: 11,
      location_id: 4,
    });
  });

  it("returns null without order or customer", () => {
    expect(buildRedeemOtpPayload({})).toBeNull();
  });

  it("builds redeem body with otp_code; omits empty points", () => {
    expect(buildRedeemPayload({ orderId: 9, otpCode: " 123456 " })).toEqual({
      order_id: 9,
      otp_code: "123456",
    });
    expect(buildRedeemPayload({ orderId: 9, otpCode: "123456", points: 20 })).toEqual({
      order_id: 9,
      otp_code: "123456",
      points: 20,
    });
    expect(buildRedeemPayload({ orderId: 9, otpCode: "" })).toBeNull();
  });
});

describe("parse / errors", () => {
  it("parses OTP sent envelope without exposing a code", () => {
    const parsed = parseOtpSent({ message: "OTP sent", expires_in: 300 });
    expect(parsed).toEqual({ message: "OTP sent", expiresIn: 300 });
    expect(JSON.stringify(parsed)).not.toMatch(/\b\d{6}\b/);
  });

  it("parses staff redeem result", () => {
    expect(
      parseRedeemResult({
        order_id: 9,
        points_redeemed: "15.00",
        discount_from_points: "15.00",
        total_amount: "65.00",
      })
    ).toEqual({
      orderId: 9,
      pointsRedeemed: "15.00",
      discountFromPoints: "15.00",
      totalAmount: "65.00",
    });
  });

  it("maps BE 403/404/OTP failures without inventing a wallet engine", () => {
    expect(classifyRedeemError(403, "Insufficient permissions for order operations")).toBe(
      "forbidden"
    );
    expect(classifyRedeemError(403, "Module rewards is disabled for this organization")).toBe(
      "module_disabled"
    );
    expect(classifyRedeemError(404, "Order not found")).toBe("not_found");
    expect(classifyRedeemError(400, ERR_OTP_REQUIRED)).toBe("otp_required");
    expect(classifyRedeemError(400, ERR_OTP_INVALID)).toBe("otp_invalid");
    expect(classifyRedeemError(400, ERR_SPLIT_TENDER)).toBe("split_tender");
    expect(
      axiosRedeemError({
        response: { status: 403, data: { error: "Only retailers can access this endpoint" } },
      }).kind
    ).toBe("forbidden");
  });
});
