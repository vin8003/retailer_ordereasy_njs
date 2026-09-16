import { describe, expect, it } from "vitest";
import {
  INACTIVE_PRODUCT_ADD_MESSAGE,
  UNSELLABLE_PRODUCT_HINT,
  axiosUnsellableProduct,
  cartWithoutProduct,
  checkoutErrorText,
  isSellableProduct,
  parseUnsellableProductError,
  unsellableCartHit,
  unsellableProductMessage,
} from "./posAvailability";

const BE_REJECT =
  "Product 'Aashirvaad Atta 5kg' (id=412) is inactive or unavailable and cannot be sold.";

describe("parseUnsellableProductError", () => {
  it("reads the BE reject string as-is", () => {
    expect(parseUnsellableProductError(BE_REJECT)).toEqual({
      productId: 412,
      name: "Aashirvaad Atta 5kg",
    });
  });

  it("tolerates spacing and casing around id=", () => {
    expect(
      parseUnsellableProductError(
        "product 'Milk 500ml' ( id = 7 ) IS INACTIVE OR UNAVAILABLE AND CANNOT BE SOLD."
      )
    ).toEqual({ productId: 7, name: "Milk 500ml" });
  });

  it("keeps an apostrophe inside the product name", () => {
    expect(
      parseUnsellableProductError(
        "Product 'Amul's Cheese' (id=9) is inactive or unavailable and cannot be sold."
      )
    ).toEqual({ productId: 9, name: "Amul's Cheese" });
  });

  it("returns null for other checkout errors", () => {
    expect(parseUnsellableProductError("Credit limit exceeded for this customer")).toBeNull();
    expect(parseUnsellableProductError("Checkout failed")).toBeNull();
    expect(parseUnsellableProductError("")).toBeNull();
    expect(parseUnsellableProductError(null)).toBeNull();
  });

  it("returns null when the id is not a usable product id", () => {
    expect(
      parseUnsellableProductError(
        "Product 'Ghost' (id=0) is inactive or unavailable and cannot be sold."
      )
    ).toBeNull();
    expect(
      parseUnsellableProductError(
        "Product 'Ghost' (id=abc) is inactive or unavailable and cannot be sold."
      )
    ).toBeNull();
  });
});

describe("checkoutErrorText", () => {
  it("prefers error, then detail, then non_field_errors", () => {
    expect(checkoutErrorText({ error: BE_REJECT })).toBe(BE_REJECT);
    expect(checkoutErrorText({ detail: BE_REJECT })).toBe(BE_REJECT);
    expect(checkoutErrorText({ non_field_errors: [BE_REJECT] })).toBe(BE_REJECT);
    expect(checkoutErrorText(BE_REJECT)).toBe(BE_REJECT);
  });

  it("is empty for shapes that carry no message", () => {
    expect(checkoutErrorText(undefined)).toBe("");
    expect(checkoutErrorText({})).toBe("");
    expect(checkoutErrorText({ error: [] })).toBe("");
  });
});

describe("axiosUnsellableProduct", () => {
  it("picks the product out of a 400 reject", () => {
    expect(
      axiosUnsellableProduct({ response: { status: 400, data: { error: BE_REJECT } } })
    ).toEqual({ productId: 412, name: "Aashirvaad Atta 5kg" });
  });

  it("stays null for a credit lock 400 and for a network error", () => {
    expect(
      axiosUnsellableProduct({
        response: { status: 400, data: { error: "Credit limit exceeded" } },
      })
    ).toBeNull();
    expect(axiosUnsellableProduct({})).toBeNull();
  });
});

describe("unsellableProductMessage", () => {
  it("names the product and says what to do", () => {
    const message = unsellableProductMessage({ productId: 412, name: "Aashirvaad Atta 5kg" });
    expect(message).toContain("Aashirvaad Atta 5kg");
    expect(message).toContain(UNSELLABLE_PRODUCT_HINT);
  });

  it("falls back to the id when BE sends an empty name", () => {
    expect(unsellableProductMessage({ productId: 412, name: "" })).toContain("Product #412");
  });
});

describe("cart state", () => {
  const cart = [
    { id: 412, batch_id: null },
    { id: 412, batch_id: 9 },
    { id: 500, batch_id: null },
  ];
  const hit = { productId: 412, name: "Aashirvaad Atta 5kg" };

  it("keeps the hit only while the product is still in the cart", () => {
    expect(unsellableCartHit(cart, hit)).toEqual(hit);
    expect(unsellableCartHit([{ id: 500, batch_id: null }], hit)).toBeNull();
    expect(unsellableCartHit(cart, null)).toBeNull();
  });

  it("drops every batch row of the rejected product", () => {
    expect(cartWithoutProduct(cart, 412)).toEqual([{ id: 500, batch_id: null }]);
    expect(cartWithoutProduct(cart, 999)).toHaveLength(3);
  });
});

describe("isSellableProduct", () => {
  it("treats a missing is_active as active and blocks an explicit false", () => {
    expect(isSellableProduct({})).toBe(true);
    expect(isSellableProduct({ is_active: true })).toBe(true);
    expect(isSellableProduct({ is_active: false })).toBe(false);
    expect(isSellableProduct(null)).toBe(false);
    expect(INACTIVE_PRODUCT_ADD_MESSAGE).toContain("cannot be added");
  });
});
