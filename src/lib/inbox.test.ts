import { describe, expect, it } from "vitest";
import { buildInboxQueryParams, formatOrderSource } from "./inbox";

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
