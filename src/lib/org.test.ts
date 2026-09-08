import { describe, expect, it } from "vitest";
import {
  callerIsOrgOwner,
  canAccessSettings,
  filterNavByModules,
  hasPermission,
  resolvePermissionsFromStaff,
  unwrapPaginatedResults,
  userIdFromJwtPayload,
  type OrgStaffMember,
} from "./org";

describe("hasPermission", () => {
  it("returns true when code is in set", () => {
    expect(hasPermission(["orders.read", "orders.update"], "orders.read")).toBe(true);
  });

  it("returns false when code is missing", () => {
    expect(hasPermission(["orders.read"], "orders.update")).toBe(false);
  });
});

describe("resolvePermissionsFromStaff", () => {
  const staff: OrgStaffMember[] = [
    {
      id: 1,
      organization: 1,
      user: 10,
      username: "cashier1",
      email: "c@example.com",
      role: 2,
      role_slug: "cashier",
      role_name: "Cashier",
      permissions: ["orders.read"],
      is_active: true,
    },
  ];

  it("uses active membership permissions for matching username", () => {
    expect(resolvePermissionsFromStaff("cashier1", staff, ["orders.read", "orders.update"])).toEqual([
      "orders.read",
    ]);
  });

  it("unwraps OrgStaffPagination results before matching", () => {
    const envelope = { count: 1, next: null, previous: null, results: staff };
    expect(resolvePermissionsFromStaff("cashier1", envelope, ["orders.read", "orders.update"])).toEqual([
      "orders.read",
    ]);
  });

  it("does not silently grant the full catalog to non-owner staff", () => {
    const catalog = ["orders.read", "orders.update", "staff.manage"];
    expect(resolvePermissionsFromStaff("missing-cashier", staff, catalog)).toEqual([]);
    expect(resolvePermissionsFromStaff("missing-cashier", staff, catalog, { isOwner: false })).toEqual([]);
  });

  it("falls back to full catalog only when membership is missing and caller is owner", () => {
    const catalog = ["orders.read", "orders.update"];
    expect(resolvePermissionsFromStaff("owner", staff, catalog, { isOwner: true })).toEqual(catalog);
  });

  it("keeps empty membership permissions instead of escalating", () => {
    const emptyPerms: OrgStaffMember[] = [{ ...staff[0], permissions: [] }];
    expect(resolvePermissionsFromStaff("cashier1", emptyPerms, ["orders.read", "staff.manage"])).toEqual([]);
  });
});

describe("unwrapPaginatedResults", () => {
  it("returns a flat array unchanged", () => {
    expect(unwrapPaginatedResults([{ id: 1 }])).toEqual([{ id: 1 }]);
  });

  it("unwraps DRF results envelope", () => {
    expect(unwrapPaginatedResults({ count: 1, results: [{ id: 2 }] })).toEqual([{ id: 2 }]);
  });

  it("returns empty for a non-list pagination object", () => {
    expect(unwrapPaginatedResults({ count: 0, next: null })).toEqual([]);
  });
});

describe("callerIsOrgOwner", () => {
  it("matches owner id from profile.user", () => {
    expect(callerIsOrgOwner(42, { user: 42 })).toBe(true);
    expect(callerIsOrgOwner(42, { user: 7 })).toBe(false);
  });

  it("matches owner id from JWT user_id when profile has no user", () => {
    const token = [
      btoa(JSON.stringify({ alg: "HS256", typ: "JWT" })),
      btoa(JSON.stringify({ user_id: 42 })),
      "sig",
    ].join(".");
    expect(callerIsOrgOwner(42, {}, token)).toBe(true);
    expect(callerIsOrgOwner(99, {}, token)).toBe(false);
  });

  it("parses SimpleJWT payloads via userIdFromJwtPayload", () => {
    const token = ["a", btoa(JSON.stringify({ user_id: 15 })), "b"].join(".");
    expect(userIdFromJwtPayload(token)).toBe(15);
    expect(userIdFromJwtPayload("not-a-jwt")).toBeNull();
  });
});

describe("filterNavByModules", () => {
  const nav = [
    { label: "Products", href: "/dashboard/products" },
    { label: "Display Labels", href: "/dashboard/display-labels" },
    { label: "Inbox", href: "/dashboard/inbox" },
    { label: "Profile", href: "/dashboard/profile" },
  ];

  it("hides module-gated routes when module disabled", () => {
    const filtered = filterNavByModules(nav, { catalog: false, orders: true });
    expect(filtered.map((n) => n.href)).toEqual(["/dashboard/inbox", "/dashboard/profile"]);
  });

  it("keeps label routes when catalog enabled", () => {
    const filtered = filterNavByModules(nav, { catalog: true, orders: true });
    expect(filtered.map((n) => n.href)).toContain("/dashboard/display-labels");
  });
});

describe("canAccessSettings", () => {
  it("is true when any admin permission present", () => {
    expect(canAccessSettings(["audit.read"])).toBe(true);
  });

  it("is false for order-only staff", () => {
    expect(canAccessSettings(["orders.read"])).toBe(false);
  });
});
