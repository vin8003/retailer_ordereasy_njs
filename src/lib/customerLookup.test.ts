import { describe, expect, it } from "vitest";
import {
  LOOKUP_RECENT_LIMIT,
  digitsForLookup,
  formatLookupSource,
  isHistoryExportDenied,
  isLookupBadPhone,
  isLookupNotFound,
  isLookupPhoneReady,
  parseLookupExport,
  parseLookupResponse,
} from "./customerLookup";

const sample = {
  customer_id: 11,
  mapping_id: 4,
  customer_name: "Ravi",
  phone_number: "9876543210",
  nickname: "Ravi-ji",
  registration_status: "registered",
  total_orders: 3,
  total_spent: "1200.00",
  current_balance: "50.00",
  credit_limit: "500.00",
  recent_orders: [
    {
      id: 1,
      order_number: "POS-1",
      source: "pos",
      status: "delivered",
      total_amount: "200.00",
      created_at: "2026-09-01T10:00:00Z",
      items_count: 2,
    },
    {
      id: 2,
      order_number: "APP-1",
      source: "app",
      status: "pending",
      total_amount: "80.00",
      created_at: "2026-09-02T10:00:00Z",
      items_count: 1,
    },
  ],
};

describe("digits / readiness", () => {
  it("requires last-10 digits (not typeahead)", () => {
    expect(isLookupPhoneReady("98765")).toBe(false);
    expect(isLookupPhoneReady("+91 98765 43210")).toBe(true);
    expect(digitsForLookup("+919876543210")).toBe("9876543210");
  });
});

describe("parseLookupResponse", () => {
  it("returns customer + POS and app recent orders", () => {
    const parsed = parseLookupResponse(sample);
    expect(parsed?.customer_id).toBe(11);
    expect(parsed?.recent_orders.map((o) => o.source).sort()).toEqual(["app", "pos"]);
    expect(parsed?.recent_orders).toHaveLength(2);
  });

  it("caps recent orders at the BE limit of 20", () => {
    const many = {
      ...sample,
      recent_orders: Array.from({ length: 25 }, (_, i) => ({
        ...sample.recent_orders[0],
        id: i + 1,
      })),
    };
    expect(parseLookupResponse(many)?.recent_orders).toHaveLength(LOOKUP_RECENT_LIMIT);
  });

  it("keeps guest leftover (null customer_id)", () => {
    const guest = parseLookupResponse({
      ...sample,
      customer_id: null,
      mapping_id: null,
      registration_status: "guest",
    });
    expect(guest?.customer_id).toBeNull();
    expect(guest?.registration_status).toBe("guest");
  });
});

describe("export / errors", () => {
  it("parses paginated export envelope", () => {
    const page = parseLookupExport({
      customer: { ...sample, recent_orders: undefined },
      count: 40,
      next: "http://127.0.0.1:8000/api/customer/retailer/lookup/?phone=9876543210&export=1&page=2",
      previous: null,
      results: sample.recent_orders,
    });
    expect(page?.count).toBe(40);
    expect(page?.results).toHaveLength(2);
    expect(page?.next).toContain("export=1");
  });

  it("maps BE status codes without inventing merge", () => {
    expect(isLookupNotFound(404)).toBe(true);
    expect(isLookupBadPhone(400)).toBe(true);
    expect(isHistoryExportDenied(403)).toBe(true);
    expect(formatLookupSource("pos")).toBe("POS");
    expect(formatLookupSource("app")).toBe("App");
  });
});
