/** Org / RBAC / module-flag helpers aligned with RCP API tip (OE-97/98/101). */

export const PERMISSIONS = {
  ORG_UPDATE: 'org.update',
  ROLES_MANAGE: 'roles.manage',
  STAFF_MANAGE: 'staff.manage',
  AUDIT_READ: 'audit.read',
  MODULES_MANAGE: 'modules.manage',
  ORDERS_READ: 'orders.read',
  ORDERS_UPDATE: 'orders.update',
  FULFILLMENT_MANAGE: 'fulfillment.manage',
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const MODULES = {
  CATALOG: 'catalog',
  ORDERS: 'orders',
  CUSTOMERS: 'customers',
  REWARDS: 'rewards',
  NOTIFICATIONS: 'notifications',
} as const;

export type ModuleCode = (typeof MODULES)[keyof typeof MODULES];

export interface Organization {
  id: number;
  name: string;
  owner: number;
  is_active: boolean;
  location_ids: number[];
  location_count: number;
  created_at?: string;
  updated_at?: string;
}

export interface OrgRole {
  id: number;
  organization: number;
  name: string;
  slug: string;
  permissions: string[];
  is_system: boolean;
}

export interface OrgStaffMember {
  id: number;
  organization: number;
  user: number;
  username: string;
  email: string;
  role: number;
  role_slug: string;
  role_name: string;
  permissions: string[];
  is_active: boolean;
}

export interface OrgAuditEntry {
  id: number;
  organization: number;
  location: number | null;
  actor: number | null;
  actor_username: string | null;
  action: string;
  object_type: string;
  object_id: string;
  summary_before: Record<string, unknown>;
  summary_after: Record<string, unknown>;
  created_at: string;
}

export interface ModuleFlags {
  catalog: boolean;
  orders: boolean;
  customers: boolean;
  rewards: boolean;
  notifications: boolean;
}

/** Nav href → module flag that must be enabled to show the item. */
export const NAV_MODULE_REQUIREMENTS: Record<string, ModuleCode> = {
  '/dashboard/products': MODULES.CATALOG,
  '/dashboard/categories': MODULES.CATALOG,
  '/dashboard/print-labels': MODULES.CATALOG,
  '/dashboard/display-labels': MODULES.CATALOG,
  '/dashboard/purchases': MODULES.CATALOG,
  '/dashboard/orders': MODULES.ORDERS,
  '/dashboard/inbox': MODULES.ORDERS,
  '/dashboard/pos': MODULES.ORDERS,
  '/dashboard/customers': MODULES.CUSTOMERS,
  '/dashboard/offers': MODULES.REWARDS,
};

export function hasPermission(
  permissions: ReadonlySet<string> | string[],
  code: string
): boolean {
  const set = permissions instanceof Set ? permissions : new Set(permissions);
  return set.has(code);
}

export function resolvePermissionsFromStaff(
  username: string,
  staff: OrgStaffMember[],
  permissionCatalog: string[]
): string[] {
  const match = staff.find(
    (m) => m.is_active && m.username === username
  );
  if (match?.permissions?.length) {
    return match.permissions;
  }
  // Owner bootstrap: implicit admin when staff seat missing but org is accessible.
  return permissionCatalog;
}

export function isModuleEnabled(
  flags: Partial<ModuleFlags> | Record<string, boolean>,
  module: ModuleCode
): boolean {
  return flags[module] !== false;
}

export function filterNavByModules<T extends { href: string }>(
  items: T[],
  flags: Partial<ModuleFlags> | Record<string, boolean>
): T[] {
  return items.filter((item) => {
    const base = item.href.replace(/\/$/, '');
    const required = NAV_MODULE_REQUIREMENTS[base];
    if (!required) return true;
    return isModuleEnabled(flags, required);
  });
}

export function canAccessSettings(permissions: ReadonlySet<string> | string[]): boolean {
  return (
    hasPermission(permissions, PERMISSIONS.ORG_UPDATE) ||
    hasPermission(permissions, PERMISSIONS.STAFF_MANAGE) ||
    hasPermission(permissions, PERMISSIONS.AUDIT_READ) ||
    hasPermission(permissions, PERMISSIONS.MODULES_MANAGE)
  );
}
