import { describe, expect, it } from "vitest";
import {
  ERR_INVENTORY_ADJUST,
  EXPIRED_BATCH_SALE_MESSAGE,
  PERM_INVENTORY_ADJUST,
  axiosBatchExpiryError,
  canAdjustInventory,
  expiryHint,
  isBatchExpired,
  prepareBatchesForSave,
  sortBatchesFifo,
  unexpiredBatches,
} from "./batchExpiry";

describe("canAdjustInventory", () => {
  it("requires inventory.adjust", () => {
    expect(canAdjustInventory(["inventory.adjust"])).toBe(true);
    expect(canAdjustInventory(["catalog.price"])).toBe(false);
    expect(PERM_INVENTORY_ADJUST).toBe("inventory.adjust");
  });
});

describe("expiry hints", () => {
  it("treats null expiry as still valid (BE optional until filled)", () => {
    expect(isBatchExpired(null, "2026-09-15")).toBe(false);
    expect(isBatchExpired("", "2026-09-15")).toBe(false);
    expect(unexpiredBatches([{ expiry_date: null }], "2026-09-15")).toHaveLength(1);
  });

  it("marks dated lots expired when before today (negative)", () => {
    expect(isBatchExpired("2026-09-14", "2026-09-15")).toBe(true);
    expect(isBatchExpired("2026-09-15", "2026-09-15")).toBe(false);
    expect(unexpiredBatches([{ expiry_date: "2026-01-01" }], "2026-09-15")).toHaveLength(0);
    expect(expiryHint("2026-01-01")).toMatch(/Expired/);
  });

  it("filters pickable lots from expiry_date only (no saleable_* contract)", () => {
    expect(
      unexpiredBatches(
        [
          { expiry_date: "2020-01-01", is_active: true },
          { expiry_date: null, is_active: true },
          { expiry_date: "2026-12-01", is_active: false },
        ],
        "2026-09-15"
      )
    ).toEqual([{ expiry_date: null, is_active: true }]);
  });

  it("sorts FIFO earliest expiry, nulls last (display hint only)", () => {
    const sorted = sortBatchesFifo([
      { id: 1, expiry_date: null },
      { id: 2, expiry_date: "2026-12-01" },
      { id: 3, expiry_date: "2026-10-01" },
    ]);
    expect(sorted.map((b) => b.id)).toEqual([3, 2, 1]);
    expect(
      unexpiredBatches([{ expiry_date: "2020-01-01" }, { expiry_date: null }], "2026-09-15")
    ).toHaveLength(1);
  });
});

describe("prepareBatchesForSave", () => {
  it("echoes stored expiry without inventory.adjust and omits it on new rows", () => {
    const rows = [
      { id: 9, batch_number: "A", expiry_date: "2026-12-01" },
      { batch_number: "NEW", expiry_date: "2026-11-01" },
    ];
    const saved = prepareBatchesForSave(rows, {
      canAdjust: false,
      originalById: { 9: "2026-10-01" },
    });
    expect(saved[0].expiry_date).toBe("2026-10-01");
    expect(saved[1]).not.toHaveProperty("expiry_date");
  });

  it("writes blank expiry as null when permitted", () => {
    const saved = prepareBatchesForSave([{ id: 1, expiry_date: "" }], { canAdjust: true });
    expect(saved[0].expiry_date).toBeNull();
  });
});

describe("errors", () => {
  it("maps 403 inventory.adjust without inventing a second batch engine", () => {
    expect(
      axiosBatchExpiryError({
        response: { status: 403, data: { error: ERR_INVENTORY_ADJUST } },
      })
    ).toContain("inventory.adjust");
    expect(EXPIRED_BATCH_SALE_MESSAGE).toMatch(/Expired/);
  });
});
