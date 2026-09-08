"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Flag, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { orgService } from "@/services/api";
import { useOrgContext } from "@/hooks/useOrgContext";
import { MODULES, PERMISSIONS, type ModuleFlags } from "@/lib/org";

const MODULE_LABELS: Record<keyof ModuleFlags, string> = {
  catalog: "Catalog & inventory",
  orders: "Orders & POS",
  customers: "Customers & khata",
  rewards: "Rewards & offers",
  notifications: "Notifications",
};

export default function ModuleFlagsPage() {
  const { orgId, hasPermission, moduleFlags, refresh } = useOrgContext();
  const [flags, setFlags] = useState<ModuleFlags>(moduleFlags);
  const [catalog, setCatalog] = useState<{ code: string; description: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const canManage = hasPermission(PERMISSIONS.MODULES_MANAGE);

  const load = useCallback(async () => {
    if (!orgId) return;
    setIsLoading(true);
    try {
      const [flagsRes, catalogRes] = await Promise.all([
        orgService.fetchModuleFlags(orgId),
        orgService.fetchModuleFlagsCatalog(orgId),
      ]);
      setFlags({ ...moduleFlags, ...(flagsRes.data?.flags ?? {}) });
      setCatalog(catalogRes.data?.modules ?? []);
    } catch (error) {
      console.error("Failed to load module flags", error);
      toast.error("Failed to load module flags");
    } finally {
      setIsLoading(false);
    }
  }, [orgId, moduleFlags]);

  useEffect(() => {
    setFlags(moduleFlags);
  }, [moduleFlags]);

  useEffect(() => {
    load();
  }, [orgId]);

  const handleToggle = (code: keyof ModuleFlags, enabled: boolean) => {
    setFlags((prev) => ({ ...prev, [code]: enabled }));
  };

  const handleSave = async () => {
    if (!orgId || !canManage) return;
    setIsSaving(true);
    try {
      const changed: Record<string, boolean> = {};
      for (const code of Object.keys(MODULE_LABELS) as (keyof ModuleFlags)[]) {
        if (flags[code] !== moduleFlags[code]) {
          changed[code] = flags[code];
        }
      }
      if (Object.keys(changed).length === 0) {
        toast.message("No changes to save");
        return;
      }
      await orgService.updateModuleFlags(orgId, changed);
      toast.success("Module flags updated");
      await refresh();
    } catch (error) {
      console.error("Failed to save module flags", error);
      toast.error("Failed to save module flags");
    } finally {
      setIsSaving(false);
    }
  };

  if (!canManage) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/settings">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Settings
          </Link>
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Module flags (read-only)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(Object.keys(MODULE_LABELS) as (keyof ModuleFlags)[]).map((code) => (
              <div key={code} className="flex justify-between items-center border rounded-lg p-3">
                <span>{MODULE_LABELS[code]}</span>
                <Switch checked={moduleFlags[code]} disabled />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-xl">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/dashboard/settings">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Settings
        </Link>
      </Button>

      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Flag className="h-6 w-6 text-primary" />
          Module flags
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Client uses flags for navigation hiding; APIs enforce 403 with module_disabled when off.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Shop modules</CardTitle>
          <CardDescription>
            Disabling a module hides related navigation and blocks gated APIs server-side.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          ) : (
            <>
              {(Object.keys(MODULE_LABELS) as (keyof ModuleFlags)[]).map((code) => {
                const meta = catalog.find((m) => m.code === code);
                return (
                  <div
                    key={code}
                    className="flex items-center justify-between rounded-lg border p-3 gap-4"
                  >
                    <div>
                      <Label>{MODULE_LABELS[code]}</Label>
                      {meta?.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{meta.description}</p>
                      )}
                    </div>
                    <Switch
                      checked={flags[code]}
                      onCheckedChange={(v) => handleToggle(code, v)}
                    />
                  </div>
                );
              })}
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save module flags
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
