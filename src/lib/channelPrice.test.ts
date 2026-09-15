import { describe, expect, it } from "vitest";
import {
  CHANNEL_APP,
  CHANNEL_STORE,
  appendAppPriceToFormData,
  canEditAppPrice,
  channelPriceLines,
  hasDistinctAppPrice,
  isCatalogPriceDenied,
  posUnitPrice,
  resolveChannelSellingPrice,
} from "./channelPrice";

const sku = { price: "100.00", app_price: "89.00" };

describe("resolveChannelSellingPrice", () => {
  it("keeps store/POS on Product.price even when app_price differs", () => {
    expect(resolveChannelSellingPrice(sku, CHANNEL_STORE)).toBe(100);
    expect(resolveChannelSellingPrice(sku, CHANNEL_APP)).toBe(89);
  });

  it("falls back to store when app_price is null", () => {
    expect(
      resolveChannelSellingPrice({ price: 50, app_price: null }, CHANNEL_APP)
    ).toBe(50);
  });

  it("uses batch store price on POS, not app_price", () => {
    expect(
      resolveChannelSellingPrice(sku, CHANNEL_STORE, { price: "95.00" })
    ).toBe(95);
    expect(posUnitPrice(sku, { price: "95.00" })).toBe(95);
  });
});

describe("posUnitPrice", () => {
  it("never charges the app list at the counter", () => {
    expect(posUnitPrice(sku)).toBe(100);
    expect(posUnitPrice(sku)).not.toBe(89);
  });
});

describe("hasDistinctAppPrice / channelPriceLines", () => {
  it("hides the app line when lists match or app is unset", () => {
    expect(hasDistinctAppPrice({ price: 10, app_price: 10 })).toBe(false);
    expect(hasDistinctAppPrice({ price: 10, app_price: null })).toBe(false);
    expect(channelPriceLines({ price: 10, app_price: null })).toEqual({
      store: "10.00",
    });
  });

  it("shows both channels when store ≠ app", () => {
    expect(hasDistinctAppPrice(sku)).toBe(true);
    expect(channelPriceLines(sku)).toEqual({ store: "100.00", app: "89.00" });
  });
});

describe("canEditAppPrice / appendAppPriceToFormData", () => {
  it("requires catalog.price", () => {
    expect(canEditAppPrice(["orders.update"])).toBe(false);
    expect(canEditAppPrice(["catalog.price"])).toBe(true);
  });

  it("omits app_price without catalog.price so cashiers do not 403", () => {
    const fd = new FormData();
    appendAppPriceToFormData(fd, "80", false);
    expect(fd.has("app_price")).toBe(false);
  });

  it("includes app_price when permitted (empty = store fallback)", () => {
    const fd = new FormData();
    appendAppPriceToFormData(fd, " 80.00 ", true);
    expect(fd.get("app_price")).toBe("80.00");
    const clear = new FormData();
    appendAppPriceToFormData(clear, "", true);
    expect(clear.get("app_price")).toBe("");
  });
});

describe("isCatalogPriceDenied", () => {
  it("matches BE 403 copy", () => {
    expect(
      isCatalogPriceDenied({
        response: {
          status: 403,
          data: { error: "Catalog price permission required" },
        },
      })
    ).toBe(true);
  });

  it("does not treat other 403s as the app-price gate", () => {
    expect(
      isCatalogPriceDenied({
        response: { status: 403, data: { error: "Insufficient permissions" } },
      })
    ).toBe(false);
  });
});
