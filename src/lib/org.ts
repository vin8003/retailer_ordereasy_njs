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
  CATALOG_PRICE: 'catalog.price',
  CATALOG_IMAGE: 'catalog.image',
  INVENTORY_ADJUST: 'inventory.adjust',
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

/** DRF / OrgStaffPagination envelope — same unwrap as audit/inbox. */
export function unwrapPaginatedResults<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (
    data &&
    typeof data === "object" &&
    Array.isArray((data as { results?: unknown }).results)
  ) {
    return (data as { results: T[] }).results;
  }
  return [];
}

export function userIdFromJwtPayload(token: string | null | undefined): number | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const normalized = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(normalized));
    const raw = payload.user_id ?? payload.userId;
    const id = typeof raw === "number" ? raw : Number(raw);
    return Number.isFinite(id) && id > 0 ? id : null;
  } catch {
    return null;
  }
}

export function callerIsOrgOwner(
  ownerId: number | null | undefined,
  profile?: { user?: number; user_id?: number } | null,
  accessToken?: string | null
): boolean {
  if (ownerId == null) return false;
  const fromProfile = profile?.user ?? profile?.user_id;
  if (typeof fromProfile === "number" && fromProfile === ownerId) return true;
  return userIdFromJwtPayload(accessToken) === ownerId;
}

export function resolvePermissionsFromStaff(
  username: string,
  staff: OrgStaffMember[] | unknown,
  permissionCatalog: string[],
  options?: { isOwner?: boolean }
): string[] {
  const list = unwrapPaginatedResults<OrgStaffMember>(staff);
  const match = list.find((m) => m.is_active && m.username === username);
  if (match) {
    return match.permissions ?? [];
  }
  // Owner bootstrap only: implicit admin when staff seat missing AND caller is org owner.
  if (options?.isOwner) {
    return permissionCatalog;
  }
  return [];
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
