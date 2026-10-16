"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Building2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { orgService } from "@/services/api";
import { useOrgContext } from "@/hooks/useOrgContext";
import { PERMISSIONS } from "@/lib/org";

export default function OrgSettingsPage() {
  const { org, orgId, locationId, locationIds, setLocationId, hasPermission, refresh, shopName } =
    useOrgContext();
  const [name, setName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (org) {
      setName(org.name);
      setIsActive(org.is_active);
    }
  }, [org]);

  const canEdit = hasPermission(PERMISSIONS.ORG_UPDATE);

  const handleSave = async () => {
    if (!orgId || !canEdit) return;
    setIsSaving(true);
    try {
      await orgService.updateOrg(orgId, { name: name.trim(), is_active: isActive });
      toast.success("Organization updated");
      await refresh();
    } catch (error) {
      console.error("Failed to update org", error);
      toast.error("Failed to update organization");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/settings">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Settings
          </Link>
        </Button>
      </div>

      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Building2 className="h-6 w-6 text-primary" />
          Organization
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Tenant parent for {shopName ?? "this shop"}. Single-shop tenants keep a 1:1 org–location mapping.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Org details</CardTitle>
          <CardDescription>
            Org ID {orgId ?? "—"} · {org?.location_count ?? 0} location
            {(org?.location_count ?? 0) === 1 ? "" : "s"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="orgName">Organization name</Label>
            <Input
              id="orgName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!canEdit}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label htmlFor="orgActive">Tenant active</Label>
              <p className="text-xs text-muted-foreground">
                Disabling blocks new sessions without deleting history
              </p>
            </div>
            <Switch
              id="orgActive"
              checked={isActive}
              onCheckedChange={setIsActive}
              disabled={!canEdit}
            />
          </div>

          {locationIds.length > 1 && (
            <div className="grid gap-2">
              <Label>Active location (context)</Label>
              <Select
                value={locationId?.toString() ?? ""}
                onValueChange={(v) => setLocationId(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locationIds.map((id) => (
                    <SelectItem key={id} value={String(id)}>
                      Location #{id}
                      {id === locationId ? " (current shop)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {canEdit && (
            <Button onClick={handleSave} disabled={isSaving || !name.trim()}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save organization
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
