import { describe, expect, it } from "vitest";
import {
  buildInboxQueryParams,
  formatOrderSource,
  inboxStatusChipToParam,
  inboxStatusChipsForDeliveryMode,
  sanitizeInboxStatusChip,
} from "./inbox";

describe("inboxStatusChipToParam", () => {
  it("maps accepted chip to confirmed (no accepted Order status)", () => {
    expect(inboxStatusChipToParam("accepted")).toBe("confirmed");
  });

  it("maps fulfillment chips to exact Order.status values", () => {
    expect(inboxStatusChipToParam("pending")).toBe("pending");
    expect(inboxStatusChipToParam("packed")).toBe("packed");
    expect(inboxStatusChipToParam("out_for_delivery")).toBe("out_for_delivery");
    expect(inboxStatusChipToParam("delivered")).toBe("delivered");
    expect(inboxStatusChipToParam("cancelled")).toBe("cancelled");
  });

  it("omits status when the All chip is cleared", () => {
    expect(inboxStatusChipToParam("")).toBeUndefined();
  });

  it("does not invent a failed Order status for cancelled close-outs", () => {
    expect(inboxStatusChipToParam("cancelled")).not.toBe("failed");
  });
});

describe("inboxStatusChipsForDeliveryMode", () => {
  it("hides out_for_delivery when fulfillment mode is pickup", () => {
    const chips = inboxStatusChipsForDeliveryMode("pickup").map((c) => c.chip);
    expect(chips).not.toContain("out_for_delivery");
    expect(chips).toEqual([
      "",
      "pending",
      "accepted",
      "packed",
      "delivered",
      "cancelled",
    ]);
  });

  it("keeps out_for_delivery for delivery and unscoped modes", () => {
    expect(
      inboxStatusChipsForDeliveryMode("delivery").map((c) => c.chip)
    ).toContain("out_for_delivery");
    expect(inboxStatusChipsForDeliveryMode("").map((c) => c.chip)).toContain(
      "out_for_delivery"
    );
  });
});

describe("sanitizeInboxStatusChip", () => {
  it("clears OFD when switching to pickup so the query cannot request false OFD", () => {
    expect(sanitizeInboxStatusChip("out_for_delivery", "pickup")).toBe("");
  });

  it("keeps OFD for delivery mode", () => {
    expect(sanitizeInboxStatusChip("out_for_delivery", "delivery")).toBe(
      "out_for_delivery"
    );
  });
});

describe("buildInboxQueryParams", () => {
  it("maps needs_action filter", () => {
    expect(buildInboxQueryParams({ needsAction: true })).toEqual({
      needs_action: true,
    });
  });

  it("maps source and delivery_mode filters", () => {
    expect(
      buildInboxQueryParams({ source: "app", deliveryMode: "pickup" })
    ).toEqual({
      source: "app",
      delivery_mode: "pickup",
    });
  });

  it("maps pickup queue to packed pickup status", () => {
    expect(buildInboxQueryParams({ pickupQueue: true })).toEqual({
      delivery_mode: "pickup",
      status: "packed",
    });
  });

  it("includes trimmed search", () => {
    expect(buildInboxQueryParams({ search: "  OE-123  " })).toEqual({
      search: "OE-123",
    });
  });

  it("maps accepted chip to status=confirmed and keeps delivery_mode", () => {
    expect(
      buildInboxQueryParams({
        statusChip: "accepted",
        deliveryMode: "delivery",
      })
    ).toEqual({
      status: "confirmed",
      delivery_mode: "delivery",
    });
  });

  it("sends a single exact status for packed and cancelled chips", () => {
    expect(buildInboxQueryParams({ statusChip: "packed" })).toEqual({
      status: "packed",
    });
    expect(buildInboxQueryParams({ statusChip: "cancelled" })).toEqual({
      status: "cancelled",
    });
  });

  it("omits status when the All chip is selected (default inbox set)", () => {
    expect(buildInboxQueryParams({ statusChip: "" })).toEqual({});
    expect(buildInboxQueryParams({ statusChip: "", deliveryMode: "pickup" })).toEqual({
      delivery_mode: "pickup",
    });
  });

  it("does not send out_for_delivery when delivery_mode is pickup", () => {
    expect(
      buildInboxQueryParams({
        statusChip: "out_for_delivery",
        deliveryMode: "pickup",
      })
    ).toEqual({
      delivery_mode: "pickup",
    });
  });

  it("sends out_for_delivery with delivery_mode=delivery", () => {
    expect(
      buildInboxQueryParams({
        statusChip: "out_for_delivery",
        deliveryMode: "delivery",
      })
    ).toEqual({
      status: "out_for_delivery",
      delivery_mode: "delivery",
    });
  });

  it("lets needs_action win over a status chip (single-param inbox)", () => {
    expect(
      buildInboxQueryParams({ needsAction: true, statusChip: "packed" })
    ).toEqual({
      needs_action: true,
    });
  });

  it("lets pickup queue win over a conflicting status chip", () => {
    expect(
      buildInboxQueryParams({
        pickupQueue: true,
        statusChip: "delivered",
        deliveryMode: "delivery",
      })
    ).toEqual({
      delivery_mode: "pickup",
      status: "packed",
    });
  });

  it("never emits a multi-status CSV or failed status", () => {
    const params = buildInboxQueryParams({ statusChip: "cancelled" });
    expect(String(params.status)).not.toContain(",");
    expect(params.status).not.toBe("failed");
  });
});

describe("formatOrderSource", () => {
  it("labels pos and app sources", () => {
    expect(formatOrderSource("pos")).toBe("Store (POS)");
    expect(formatOrderSource("app")).toBe("Online (App)");
  });

  it("labels missing or unknown sources without assuming app", () => {
    expect(formatOrderSource()).toBe("Unknown");
    expect(formatOrderSource("call_center")).toBe("CALL_CENTER");
  });
});
