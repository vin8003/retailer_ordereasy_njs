import { describe, expect, it } from "vitest";
import { PERM_INVENTORY_ADJUST } from "./inventoryAdjust";
import {
  ERR_NON_EXPIRED,
  WRITE_OFF_REASONS,
  axiosWriteOffError,
  buildWriteOffPayload,
  canWriteOffStock,
  classifyWriteOffError,
  ledgerReasonQuery,
  parseWriteOffResult,
} from "./writeOff";

describe("canWriteOffStock", () => {
  it("requires inventory.adjust (no shrinkage.* invent)", () => {
    expect(canWriteOffStock(["inventory.adjust"])).toBe(true);
    expect(canWriteOffStock(["catalog.price"])).toBe(false);
    expect(PERM_INVENTORY_ADJUST).toBe("inventory.adjust");
    expect(WRITE_OFF_REASONS).toEqual(["damage", "expiry", "spoilage"]);
  });
});

describe("buildWriteOffPayload", () => {
  it("sends quantity + reason and optional batch_id", () => {
    expect(buildWriteOffPayload({ quantity: "2.5", reason: "damage" })).toEqual({
      quantity: "2.5",
      reason: "damage",
    });
    expect(
      buildWriteOffPayload({ quantity: 1, reason: "expiry", batchId: 88 })
    ).toEqual({ quantity: "1", reason: "expiry", batch_id: 88 });
  });

  it("rejects unknown reasons and non-positive qty", () => {
    expect(buildWriteOffPayload({ quantity: "0", reason: "damage" })).toBeNull();
    expect(buildWriteOffPayload({ quantity: "1", reason: "shrinkage" })).toBeNull();
    expect(buildWriteOffPayload({ quantity: "1", reason: "damage", batchId: "x" })).toBeNull();
  });
});

describe("parse / errors", () => {
  it("parses the write-off receipt", () => {
    expect(
      parseWriteOffResult({
        id: 12,
        product_id: 44,
        batch_id: 88,
        reason: "expiry",
        log_type: "expired",
        quantity_change: "1.00",
        previous_quantity: "4.00",
        new_quantity: "3.00",
      })
    ).toEqual({
      id: 12,
      productId: 44,
      batchId: 88,
      reason: "expiry",
      logType: "expired",
      quantityChange: "1.00",
      previousQuantity: "4.00",
      newQuantity: "3.00",
    });
  });

  it("maps 403/404/expiry guard without inventing StockMovement", () => {
    expect(
      classifyWriteOffError(403, "Inventory adjust permission required")
    ).toBe("forbidden");
    expect(classifyWriteOffError(404, "Product not found")).toBe("not_found");
    expect(classifyWriteOffError(400, ERR_NON_EXPIRED)).toBe("non_expired");
    expect(
      axiosWriteOffError({
        response: { status: 403, data: { error: "Inventory adjust permission required" } },
      }).message
    ).toContain("inventory.adjust");
  });

  it("omits ledger ?reason= when All is selected", () => {
    expect(ledgerReasonQuery("all")).toBeUndefined();
    expect(ledgerReasonQuery("damage")).toBe("damage");
  });
});
