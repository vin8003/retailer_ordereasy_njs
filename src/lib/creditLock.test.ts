import { describe, expect, it } from "vitest";
import {
  REASON_CREDIT_LIMIT,
  REASON_CREDIT_OVERDUE,
  attachCreditOverride,
  canOverrideCreditLock,
  creditAmountForPos,
  creditSaleLockReasons,
  formatCreditLockMessage,
  isCreditLockError,
  isCreditOverrideDenied,
  khataFromDetail,
  last10Digits,
  lockReasonsFromCheckoutError,
  pickCustomerFromList,
} from "./creditLock";

const mapping = {
  creditLimit: 100,
  currentBalance: 80,
  creditDueDays: 7,
  outstandingSince: null as string | null,
};

describe("creditAmountForPos", () => {
  it("uses full total on credit and split.credit on split", () => {
    expect(creditAmountForPos("credit", { credit: 0 }, 250)).toBe(250);
    expect(creditAmountForPos("split", { credit: 40 }, 250)).toBe(40);
    expect(creditAmountForPos("cash", { credit: 40 }, 250)).toBe(0);
  });
});

describe("creditSaleLockReasons", () => {
  it("blocks when projected balance exceeds limit", () => {
    expect(creditSaleLockReasons(mapping, 30)).toEqual([REASON_CREDIT_LIMIT]);
    expect(creditSaleLockReasons(mapping, 20)).toEqual([]);
  });

  it("treats credit_limit 0 as unset", () => {
    expect(
      creditSaleLockReasons({ ...mapping, creditLimit: 0, currentBalance: 500 }, 50)
    ).toEqual([]);
  });

  it("does not invent a due-days lock without outstanding_since", () => {
    expect(
      creditSaleLockReasons(
        { ...mapping, currentBalance: 10, creditDueDays: 1, outstandingSince: null },
        10
      )
    ).not.toContain(REASON_CREDIT_OVERDUE);
  });

  it("locks overdue when outstanding_since is present (BE field)", () => {
    const since = new Date();
    since.setDate(since.getDate() - 10);
    expect(
      creditSaleLockReasons(
        {
          creditLimit: 0,
          currentBalance: 20,
          creditDueDays: 7,
          outstandingSince: since.toISOString(),
        },
        10
      )
    ).toEqual([REASON_CREDIT_OVERDUE]);
  });
});

describe("checkout error parse / override", () => {
  it("maps BE 400 copy to reasons", () => {
    expect(lockReasonsFromCheckoutError("Credit limit exceeded. Limit: ₹100")).toEqual([
      REASON_CREDIT_LIMIT,
    ]);
    expect(
      lockReasonsFromCheckoutError("Credit sales locked: outstanding is past due days.")
    ).toEqual([REASON_CREDIT_OVERDUE]);
    expect(isCreditLockError("Credit sales locked.")).toBe(true);
  });

  it("attaches credit_override only when requested", () => {
    expect(attachCreditOverride({ payment_mode: "credit" }, false)).toEqual({
      payment_mode: "credit",
    });
    expect(attachCreditOverride({ payment_mode: "credit" }, true)).toEqual({
      payment_mode: "credit",
      credit_override: true,
    });
  });

  it("gates override on orders.update", () => {
    expect(canOverrideCreditLock(["orders.read"])).toBe(false);
    expect(canOverrideCreditLock(["orders.update"])).toBe(true);
  });

  it("detects override 403", () => {
    expect(
      isCreditOverrideDenied({
        response: {
          status: 403,
          data: { error: "Insufficient permissions to override credit lock" },
        },
      })
    ).toBe(true);
  });
});

describe("CRM helpers", () => {
  it("matches list rows on last-10 phone", () => {
    const row = pickCustomerFromList(
      [{ phone_number: "+919876543210", customer_id: 9 }],
      "9876543210"
    );
    expect(row?.customer_id).toBe(9);
    expect(last10Digits("+91 98765 43210")).toBe("9876543210");
  });

  it("reads credit_due_days from detail and leaves outstanding_since optional", () => {
    const snap = khataFromDetail({
      customer_id: 3,
      credit_limit: "200.00",
      current_balance: "50",
      credit_due_days: 14,
    });
    expect(snap.creditDueDays).toBe(14);
    expect(snap.outstandingSince).toBeNull();
  });
});

describe("formatCreditLockMessage", () => {
  it("includes available remaining on limit lock", () => {
    expect(formatCreditLockMessage(mapping, [REASON_CREDIT_LIMIT])).toContain("Available: ₹20");
  });
});
