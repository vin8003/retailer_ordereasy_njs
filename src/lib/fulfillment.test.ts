import { describe, expect, it } from "vitest";
import {
  buildDispatchPayload,
  buildInboxDispatchPayload,
  buildInboxMarkDeliveredPayload,
  buildInboxMarkFailedPayload,
  buildInboxOfdMarkDeliveredPayload,
  FAILED_REASON_REQUIRED,
  OFD_CLOSEOUT_COPY,
  formatFulfillmentSlot,
  formatSlotOptionLabel,
  FulfillmentSlotOption,
  isOfdDeliveryCloseOut,
  validateFailedReason,
} from "./fulfillment";

describe("formatFulfillmentSlot", () => {
  it("formats start and end into a readable window", () => {
    const label = formatFulfillmentSlot(
      "2026-09-08T10:00:00+05:30",
      "2026-09-08T10:30:00+05:30"
    );
    expect(label).toMatch(/Sep 8/);
    expect(label).toContain("–");
  });

  it("returns null when slot start is missing", () => {
    expect(formatFulfillmentSlot(null, null)).toBeNull();
  });
});

describe("formatSlotOptionLabel", () => {
  it("includes remaining capacity for available slots", () => {
    const slot: FulfillmentSlotOption = {
      slot_start: "2026-09-08T04:30:00.000Z",
      slot_end: "2026-09-08T05:00:00.000Z",
      slot_start_local: "2026-09-08T10:00:00+05:30",
      slot_end_local: "2026-09-08T10:30:00+05:30",
      capacity: 5,
      booked: 2,
      remaining: 3,
      is_available: true,
    };
    expect(formatSlotOptionLabel(slot)).toContain("3 left");
  });

  it("marks full slots", () => {
    const slot: FulfillmentSlotOption = {
      slot_start: "2026-09-08T04:30:00.000Z",
      slot_end: "2026-09-08T05:00:00.000Z",
      capacity: 5,
      booked: 5,
      remaining: 0,
      is_available: false,
    };
    expect(formatSlotOptionLabel(slot)).toContain("(full)");
  });
});

describe("buildInboxDispatchPayload", () => {
  it("maps courier fields to inbox dispatch action", () => {
    expect(
      buildInboxDispatchPayload({
        name: " Raj ",
        phone: "9876543210",
        estimatedDeliveryTime: "2026-09-08T12:00:00.000Z",
      })
    ).toEqual({
      action: "dispatch",
      delivery_person_name: "Raj",
      delivery_person_phone: "9876543210",
      estimated_delivery_time: "2026-09-08T12:00:00.000Z",
    });
  });
});

describe("buildInboxMarkDeliveredPayload", () => {
  it("maps pickup code to inbox mark_delivered action", () => {
    expect(
      buildInboxMarkDeliveredPayload({ pickupCode: " ABC123 " })
    ).toEqual({
      action: "mark_delivered",
      pickup_code: "ABC123",
    });
  });

  it("includes customer_id when provided", () => {
    expect(
      buildInboxMarkDeliveredPayload({ pickupCode: "XYZ", customerId: 42 })
    ).toEqual({
      action: "mark_delivered",
      pickup_code: "XYZ",
      customer_id: 42,
    });
  });
});

describe("buildDispatchPayload", () => {
  it("includes required courier fields for out_for_delivery", () => {
    expect(
      buildDispatchPayload("out_for_delivery", {
        name: " Raj ",
        phone: "9876543210",
      })
    ).toEqual({
      status: "out_for_delivery",
      delivery_person_name: "Raj",
      delivery_person_phone: "9876543210",
    });
  });

  it("passes optional estimated delivery time when provided", () => {
    const eta = "2026-09-08T12:00:00.000Z";
    expect(
      buildDispatchPayload("out_for_delivery", {
        name: "Raj",
        phone: "9876543210",
        estimatedDeliveryTime: eta,
      }).estimated_delivery_time
    ).toBe(eta);
  });
});

describe("isOfdDeliveryCloseOut", () => {
  it("is true for delivery-mode orders that are out for delivery", () => {
    expect(isOfdDeliveryCloseOut("out_for_delivery", "delivery")).toBe(true);
    expect(isOfdDeliveryCloseOut("OUT_FOR_DELIVERY")).toBe(true);
  });

  it("is false for pickup, other statuses, and packed delivery", () => {
    expect(isOfdDeliveryCloseOut("out_for_delivery", "pickup")).toBe(false);
    expect(isOfdDeliveryCloseOut("packed", "delivery")).toBe(false);
    expect(isOfdDeliveryCloseOut("delivered", "delivery")).toBe(false);
  });
});

describe("buildInboxOfdMarkDeliveredPayload", () => {
  it("reuses inbox mark_delivered without a pickup code", () => {
    expect(buildInboxOfdMarkDeliveredPayload()).toEqual({
      action: "mark_delivered",
    });
  });
});

describe("validateFailedReason", () => {
  it("requires a non-empty reason", () => {
    expect(validateFailedReason("")).toBe(FAILED_REASON_REQUIRED);
    expect(validateFailedReason("   ")).toBe(FAILED_REASON_REQUIRED);
  });

  it("accepts a trimmed non-empty reason", () => {
    expect(validateFailedReason(" Customer not home ")).toBeNull();
  });
});

describe("buildInboxMarkFailedPayload", () => {
  it("maps a required reason to inbox mark_failed", () => {
    expect(buildInboxMarkFailedPayload(" Customer not home ")).toEqual({
      action: "mark_failed",
      reason: "Customer not home",
    });
  });

  it("throws when reason is empty", () => {
    expect(() => buildInboxMarkFailedPayload("")).toThrow(FAILED_REASON_REQUIRED);
    expect(() => buildInboxMarkFailedPayload("  ")).toThrow(FAILED_REASON_REQUIRED);
  });

  it("does not send a cancel action", () => {
    expect(buildInboxMarkFailedPayload("not home").action).toBe("mark_failed");
    expect(buildInboxMarkFailedPayload("not home")).not.toHaveProperty("status", "cancelled");
  });
});

describe("OFD_CLOSEOUT_COPY", () => {
  it("reads as delivery failed / Mark as failed, not Cancel", () => {
    expect(OFD_CLOSEOUT_COPY.dialogTitle).toBe("Delivery failed");
    expect(OFD_CLOSEOUT_COPY.markFailedButton).toBe("Mark as failed");
    expect(OFD_CLOSEOUT_COPY.submit).toBe("Mark as failed");
    const surface = Object.values(OFD_CLOSEOUT_COPY).join(" ");
    expect(surface.toLowerCase()).not.toMatch(/cancel/);
  });
});
