import { describe, expect, it } from "vitest";
import {
  DUPLICATE_GSTIN_MESSAGE,
  GSTIN_FORMAT_MESSAGE,
  INACTIVE_SUPPLIER_MESSAGE,
  PAYMENT_TERMS_FORBIDDEN,
  PAYMENT_TERMS_WHITESPACE,
  PERM_PURCHASING_TERMS,
  buildSupplierWritePayload,
  canEditPaymentTerms,
  isGstinDuplicatePayload,
  isSupplierSelectableForNewPurchase,
  isValidGstin,
  isWhitespaceOnlyPaymentTerms,
  normalizeGstin,
  purchaseInvoiceErrorMessage,
  selectableSuppliersForNewPurchase,
  selectionAfterSupplierCreate,
  supplierErrorMessage,
} from "./suppliers";

describe("canEditPaymentTerms", () => {
  it("requires purchasing.terms (no invent purchasing.admin)", () => {
    expect(canEditPaymentTerms(["purchasing.terms"])).toBe(true);
    expect(canEditPaymentTerms(["inventory.adjust"])).toBe(false);
    expect(PERM_PURCHASING_TERMS).toBe("purchasing.terms");
  });
});

describe("GSTIN normalize / validate", () => {
  it("treats blank as optional and valid", () => {
    expect(normalizeGstin("  ")).toBe("");
    expect(isValidGstin("")).toBe(true);
    expect(isValidGstin(null)).toBe(true);
  });

  it("uppercases a well-formed GSTIN", () => {
    expect(normalizeGstin("22aaaaa0000a1z5")).toBe("22AAAAA0000A1Z5");
    expect(isValidGstin("22AAAAA0000A1Z5")).toBe(true);
  });

  it("rejects invalid format (negative)", () => {
    expect(isValidGstin("NOT-A-GSTIN")).toBe(false);
    expect(isValidGstin("AAAAAAAAAAAAAAA")).toBe(false);
  });
});

describe("payment terms", () => {
  it("flags whitespace-only before send", () => {
    expect(isWhitespaceOnlyPaymentTerms("   ")).toBe(true);
    expect(isWhitespaceOnlyPaymentTerms("Net 30")).toBe(false);
    expect(isWhitespaceOnlyPaymentTerms("")).toBe(false);
  });
});

describe("buildSupplierWritePayload", () => {
  const base = {
    company_name: "ABC Foods",
    contact_person: "Pat",
    phone_number: "9999999999",
    email: "a@b.com",
    address: "Pune",
    gst_number: "",
    payment_terms: "Net 30",
    is_active: true,
  };

  it("omits payment_terms without purchasing.terms", () => {
    const payload = buildSupplierWritePayload(base, { canEditTerms: false });
    expect(payload).not.toBeNull();
    expect(payload).not.toHaveProperty("payment_terms");
    expect(payload?.gst_number).toBe("");
  });

  it("includes trimmed terms and GSTIN when permitted", () => {
    expect(
      buildSupplierWritePayload(
        { ...base, gst_number: "22aaaaa0000a1z5", payment_terms: "  Net 15  " },
        { canEditTerms: true }
      )
    ).toEqual({
      company_name: "ABC Foods",
      contact_person: "Pat",
      phone_number: "9999999999",
      email: "a@b.com",
      address: "Pune",
      gst_number: "22AAAAA0000A1Z5",
      is_active: true,
      payment_terms: "Net 15",
    });
  });

  it("returns null for bad GSTIN or whitespace-only terms (negative)", () => {
    expect(
      buildSupplierWritePayload({ ...base, gst_number: "NOPE" }, { canEditTerms: true })
    ).toBeNull();
    expect(
      buildSupplierWritePayload({ ...base, payment_terms: "  \t " }, { canEditTerms: true })
    ).toBeNull();
  });
});

describe("inactive picker", () => {
  const rows = [
    { id: 1, company_name: "Active Co", is_active: true },
    { id: 2, company_name: "Quiet Co", is_active: false },
  ];

  it("hides inactive on new PI and keeps current on edit", () => {
    expect(selectableSuppliersForNewPurchase(rows).map((s) => s.id)).toEqual([1]);
    expect(selectableSuppliersForNewPurchase(rows, 2).map((s) => s.id)).toEqual([1, 2]);
    expect(isSupplierSelectableForNewPurchase({ is_active: false })).toBe(false);
    expect(isSupplierSelectableForNewPurchase({ is_active: true })).toBe(true);
  });
});

describe("selectionAfterSupplierCreate", () => {
  it("selects a freshly added active supplier", () => {
    expect(selectionAfterSupplierCreate({ id: 7, is_active: true }, "")).toEqual({
      value: "7",
      warning: null,
    });
    expect(selectionAfterSupplierCreate({ id: 7 }, "3")).toEqual({
      value: "7",
      warning: null,
    });
  });

  it("keeps the previous pick and warns when the new supplier is inactive (negative)", () => {
    expect(selectionAfterSupplierCreate({ id: 8, is_active: false }, "3")).toEqual({
      value: "3",
      warning: INACTIVE_SUPPLIER_MESSAGE,
    });
    expect(selectionAfterSupplierCreate({ id: 8, is_active: false }, "").value).toBe("");
  });

  it("leaves the pick alone when create returned nothing usable (negative)", () => {
    expect(selectionAfterSupplierCreate(null, "3")).toEqual({ value: "3", warning: null });
    expect(selectionAfterSupplierCreate(undefined, "")).toEqual({ value: "", warning: null });
  });
});

describe("supplier errors", () => {
  it("surfaces gstin_duplicate and 403 terms copy", () => {
    expect(
      isGstinDuplicatePayload({
        gst_number: [DUPLICATE_GSTIN_MESSAGE],
        gstin_duplicate: true,
      })
    ).toBe(true);
    expect(
      supplierErrorMessage({
        response: {
          status: 400,
          data: { gst_number: [DUPLICATE_GSTIN_MESSAGE], gstin_duplicate: true },
        },
      })
    ).toBe(DUPLICATE_GSTIN_MESSAGE);
    expect(
      supplierErrorMessage({
        response: {
          status: 403,
          data: { error: PAYMENT_TERMS_FORBIDDEN },
        },
      })
    ).toBe(PAYMENT_TERMS_FORBIDDEN);
    expect(
      supplierErrorMessage({
        response: { status: 400, data: { gst_number: [GSTIN_FORMAT_MESSAGE] } },
      })
    ).toBe(GSTIN_FORMAT_MESSAGE);
    expect(
      supplierErrorMessage({
        response: { status: 400, data: { payment_terms: [PAYMENT_TERMS_WHITESPACE] } },
      })
    ).toBe(PAYMENT_TERMS_WHITESPACE);
  });

  it("maps inactive supplier on new PI (negative)", () => {
    expect(
      purchaseInvoiceErrorMessage({
        response: { status: 400, data: { supplier: [INACTIVE_SUPPLIER_MESSAGE] } },
      })
    ).toBe(INACTIVE_SUPPLIER_MESSAGE);
  });
});
