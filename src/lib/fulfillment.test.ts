import { describe, expect, it } from "vitest";
import {
  buildDispatchPayload,
  buildInboxDispatchPayload,
  formatFulfillmentSlot,
  formatSlotOptionLabel,
  FulfillmentSlotOption,
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
