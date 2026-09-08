'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { authService, orgService } from '@/services/api';
import {
  type ModuleFlags,
  type Organization,
  type OrgStaffMember,
  canAccessSettings,
  hasPermission,
  isModuleEnabled,
  resolvePermissionsFromStaff,
} from '@/lib/org';

interface OrgContextValue {
  org: Organization | null;
  orgId: number | null;
  locationId: number | null;
  locationIds: number[];
  setLocationId: (id: number | null) => void;
  permissions: Set<string>;
  moduleFlags: ModuleFlags;
  username: string | null;
  shopName: string | null;
  isLoading: boolean;
  hasPermission: (code: string) => boolean;
  isModuleEnabled: (module: keyof ModuleFlags) => boolean;
  canAccessSettings: boolean;
  refresh: () => Promise<void>;
}

const defaultFlags: ModuleFlags = {
  catalog: true,
  orders: true,
  customers: true,
  rewards: true,
  notifications: true,
};

const OrgContext = createContext<OrgContextValue | null>(null);

export function OrgContextProvider({ children }: { children: ReactNode }) {
  const [org, setOrg] = useState<Organization | null>(null);
  const [permissions, setPermissions] = useState<Set<string>>(new Set());
  const [moduleFlags, setModuleFlags] = useState<ModuleFlags>(defaultFlags);
  const [locationId, setLocationId] = useState<number | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [shopName, setShopName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const profileRes = await authService.fetchProfile();
      const profile = profileRes.data;
      setUsername(profile.username ?? null);
      setShopName(profile.shop_name ?? profile.shopName ?? null);

      const resolvedLocationId = profile.id ?? null;
      setLocationId(resolvedLocationId);

      const orgRes = await orgService.fetchOrgMe();
      const orgData: Organization = orgRes.data;
      setOrg(orgData);

      const orgId = orgData.id;
      const [catalogRes, staffRes, flagsRes] = await Promise.all([
        orgService.fetchPermissionCatalog(orgId),
        orgService.fetchStaff(orgId),
        orgService.fetchModuleFlags(orgId),
      ]);

      const catalogCodes: string[] =
        catalogRes.data?.permissions?.map((p: { code: string }) => p.code) ?? [];
      const staff: OrgStaffMember[] = staffRes.data ?? [];
      const resolved = resolvePermissionsFromStaff(
        profile.username,
        staff,
        catalogCodes
      );
      setPermissions(new Set(resolved));

      const flags = flagsRes.data?.flags ?? defaultFlags;
      setModuleFlags({ ...defaultFlags, ...flags });
    } catch (error) {
      console.error('Failed to load org context', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const value = useMemo<OrgContextValue>(
    () => ({
      org,
      orgId: org?.id ?? null,
      locationId,
      locationIds: org?.location_ids ?? [],
      setLocationId,
      permissions,
      moduleFlags,
      username,
      shopName,
      isLoading,
      hasPermission: (code: string) => hasPermission(permissions, code),
      isModuleEnabled: (module: keyof ModuleFlags) =>
        isModuleEnabled(moduleFlags, module),
      canAccessSettings: canAccessSettings(permissions),
      refresh: load,
    }),
    [
      org,
      locationId,
      permissions,
      moduleFlags,
      username,
      shopName,
      isLoading,
      load,
    ]
  );

  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
}

export function useOrgContext(): OrgContextValue {
  const ctx = useContext(OrgContext);
  if (!ctx) {
    throw new Error('useOrgContext must be used within OrgContextProvider');
  }
  return ctx;
}

/** Safe hook for components that may render outside the provider during SSR. */
export function useOrgContextOptional(): OrgContextValue | null {
  return useContext(OrgContext);
}
