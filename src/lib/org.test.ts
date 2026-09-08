import { describe, expect, it } from "vitest";
import {
  canAccessSettings,
  filterNavByModules,
  hasPermission,
  resolvePermissionsFromStaff,
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

  it("falls back to full catalog when username not in staff list", () => {
    const catalog = ["orders.read", "orders.update"];
    expect(resolvePermissionsFromStaff("owner", staff, catalog)).toEqual(catalog);
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
