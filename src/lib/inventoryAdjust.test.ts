import { describe, expect, it } from "vitest";
import {
  ERR_CONVERSION_FACTOR,
  ERR_INVENTORY_ADJUST,
  PACK_ADJUST_MESSAGE,
  PERM_INVENTORY_ADJUST,
  QTY_ADJUST_MESSAGE,
  applyLinkedChildQuantity,
  axiosInventoryAdjustError,
  canAdjustInventory,
  isPositiveConversionFactor,
  packLinkDiffers,
  packLinkIsSet,
  quantityDiffers,
} from "./inventoryAdjust";

describe("canAdjustInventory", () => {
  it("requires inventory.adjust (no shrinkage.* invent)", () => {
    expect(canAdjustInventory(["inventory.adjust"])).toBe(true);
    expect(canAdjustInventory(["purchasing.terms"])).toBe(false);
    expect(PERM_INVENTORY_ADJUST).toBe("inventory.adjust");
  });
});

describe("conversion factor", () => {
  it("rejects zero and non-positive (negative)", () => {
    expect(isPositiveConversionFactor("0")).toBe(false);
    expect(isPositiveConversionFactor("-1")).toBe(false);
    expect(isPositiveConversionFactor("0.10")).toBe(true);
  });
});

describe("pack / qty diffs", () => {
  const base = {
    is_parent_bulk: false,
    isLinkedToParent: true,
    parent_bulk_product_id: "12",
    conversion_factor: "0.10",
  };

  it("detects pack-link changes and quantity changes", () => {
    expect(packLinkIsSet(base)).toBe(true);
    expect(packLinkDiffers(base, { ...base, conversion_factor: "0.20" })).toBe(true);
    expect(packLinkDiffers(base, base)).toBe(false);
    expect(quantityDiffers("10", "10.0")).toBe(false);
    expect(quantityDiffers("10", "11")).toBe(true);
    expect(quantityDiffers("50", "0")).toBe(true);
  });
});

describe("linked child quantity on save", () => {
  it("omits quantity for linked child without inventory.adjust (does not send 0)", () => {
    const fd = new FormData();
    fd.set("quantity", "50");
    applyLinkedChildQuantity(fd, { isLinkedChild: true, canAdjust: false });
    expect(fd.has("quantity")).toBe(false);
    expect(fd.get("quantity")).toBeNull();
  });

  it("keeps form quantity for linked child when canAdjust (intentional adjust still sent)", () => {
    const fd = new FormData();
    fd.set("quantity", "12");
    applyLinkedChildQuantity(fd, { isLinkedChild: true, canAdjust: true });
    expect(fd.get("quantity")).toBe("12");
  });

  it("leaves non-child quantity untouched without inventory.adjust", () => {
    const fd = new FormData();
    fd.set("quantity", "7");
    applyLinkedChildQuantity(fd, { isLinkedChild: false, canAdjust: false });
    expect(fd.get("quantity")).toBe("7");
  });
});

describe("403 copy", () => {
  it("maps quantity and pack 403 without inventing StockMovement", () => {
    expect(
      axiosInventoryAdjustError(
        { response: { status: 403, data: { error: ERR_INVENTORY_ADJUST } } },
        "quantity"
      )
    ).toBe(QTY_ADJUST_MESSAGE);
    expect(
      axiosInventoryAdjustError(
        { response: { status: 403, data: { error: ERR_INVENTORY_ADJUST } } },
        "pack"
      )
    ).toBe(PACK_ADJUST_MESSAGE);
    expect(
      axiosInventoryAdjustError({
        response: { status: 400, data: { conversion_factor: [ERR_CONVERSION_FACTOR] } },
      })
    ).toBe(ERR_CONVERSION_FACTOR);
  });
});
