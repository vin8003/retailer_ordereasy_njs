"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { orgService } from "@/services/api";
import { useOrgContext } from "@/hooks/useOrgContext";
import { PERMISSIONS, type OrgRole, type OrgStaffMember } from "@/lib/org";

export default function StaffSettingsPage() {
  const { orgId, hasPermission } = useOrgContext();
  const [roles, setRoles] = useState<OrgRole[]>([]);
  const [staff, setStaff] = useState<OrgStaffMember[]>([]);
  const [permissionLabels, setPermissionLabels] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  const canManage = hasPermission(PERMISSIONS.STAFF_MANAGE);
  const canManageRoles = hasPermission(PERMISSIONS.ROLES_MANAGE);

  const load = useCallback(async () => {
    if (!orgId) return;
    setIsLoading(true);
    try {
      const [rolesRes, staffRes, catalogRes] = await Promise.all([
        orgService.fetchRoles(orgId),
        orgService.fetchStaff(orgId),
        orgService.fetchPermissionCatalog(orgId),
      ]);
      setRoles(rolesRes.data ?? []);
      setStaff(staffRes.data ?? []);
      const labels: Record<string, string> = {};
      for (const p of catalogRes.data?.permissions ?? []) {
        labels[p.code] = p.description ?? p.code;
      }
      setPermissionLabels(labels);
    } catch (error) {
      console.error("Failed to load staff", error);
      toast.error("Failed to load staff and roles");
    } finally {
      setIsLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAssign = async () => {
    if (!orgId || !selectedRoleId || !newUsername.trim() || !newPassword) return;
    setIsAssigning(true);
    try {
      await orgService.assignStaff(orgId, {
        role_id: Number(selectedRoleId),
        username: newUsername.trim(),
        password: newPassword,
      });
      toast.success("Staff member assigned");
      setNewUsername("");
      setNewPassword("");
      await load();
    } catch (error) {
      console.error("Failed to assign staff", error);
      toast.error("Failed to assign staff");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleToggleActive = async (member: OrgStaffMember) => {
    if (!orgId || !canManage) return;
    try {
      await orgService.updateStaff(orgId, member.id, {
        is_active: !member.is_active,
      });
      toast.success(member.is_active ? "Staff deactivated" : "Staff reactivated");
      await load();
    } catch (error) {
      toast.error("Failed to update staff membership");
    }
  };

  const handleRoleChange = async (member: OrgStaffMember, roleId: string) => {
    if (!orgId || !canManage) return;
    try {
      await orgService.updateStaff(orgId, member.id, { role_id: Number(roleId) });
      toast.success("Role updated");
      await load();
    } catch (error) {
      toast.error("Failed to update role");
    }
  };

  if (!canManage && !canManageRoles) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        Staff management requires the staff.manage permission.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/dashboard/settings">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Settings
        </Link>
      </Button>

      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          Staff &amp; roles
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          RBAC gates order and fulfillment actions server-side; UI mirrors orders.read / orders.update / fulfillment.manage.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Named roles</CardTitle>
              <CardDescription>System Admin and Cashier ship by default</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {roles.map((role) => (
                <div key={role.id} className="rounded-lg border p-3 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{role.name}</span>
                    <Badge variant="outline">{role.slug}</Badge>
                    {role.is_system && (
                      <Badge variant="secondary" className="text-[10px]">
                        system
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(role.permissions ?? []).map((code) => (
                      <Badge key={code} variant="outline" className="text-[10px] font-normal">
                        {code}
                      </Badge>
                    ))}
                    {(role.permissions ?? []).length === 0 && (
                      <span className="text-xs text-muted-foreground">No permissions (deny-by-default)</span>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Staff memberships</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Permissions</TableHead>
                      <TableHead>Active</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staff.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="font-medium">{member.username}</div>
                          <div className="text-xs text-muted-foreground">{member.email}</div>
                        </TableCell>
                        <TableCell>
                          {canManage ? (
                            <Select
                              value={String(member.role)}
                              onValueChange={(v) => handleRoleChange(member, v)}
                            >
                              <SelectTrigger className="w-[140px] h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {roles.map((r) => (
                                  <SelectItem key={r.id} value={String(r.id)}>
                                    {r.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            member.role_name
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {(member.permissions ?? []).slice(0, 4).map((code) => (
                              <Badge key={code} variant="outline" className="text-[9px]">
                                {code}
                              </Badge>
                            ))}
                            {(member.permissions ?? []).length > 4 && (
                              <Badge variant="secondary" className="text-[9px]">
                                +{(member.permissions ?? []).length - 4}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={member.is_active}
                            onCheckedChange={() => handleToggleActive(member)}
                            disabled={!canManage}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {canManage && (
            <Card>
              <CardHeader>
                <CardTitle>Assign staff</CardTitle>
                <CardDescription>Create a retailer-type staff login (password auth)</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2 max-w-xl">
                <div className="grid gap-2">
                  <Label>Role</Label>
                  <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((r) => (
                        <SelectItem key={r.id} value={String(r.id)}>
                          {r.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="staffUsername">Username</Label>
                  <Input
                    id="staffUsername"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                  />
                </div>
                <div className="grid gap-2 sm:col-span-2">
                  <Label htmlFor="staffPassword">Password</Label>
                  <Input
                    id="staffPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleAssign}
                  disabled={isAssigning || !selectedRoleId || !newUsername || !newPassword}
                >
                  {isAssigning ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Assign staff
                </Button>
              </CardContent>
            </Card>
          )}

          {Object.keys(permissionLabels).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Permission catalog</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                {Object.entries(permissionLabels).map(([code, desc]) => (
                  <div key={code} className="flex gap-2">
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded shrink-0">{code}</code>
                    <span className="text-muted-foreground">{desc}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
