"use client";

import Link from "next/link";
import { Building2, ClipboardList, Flag, History, Shield, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useOrgContext } from "@/hooks/useOrgContext";
import { PERMISSIONS } from "@/lib/org";

const settingsLinks = [
  {
    href: "/dashboard/settings/org",
    label: "Organization",
    description: "Org name, tenant status, and locations",
    icon: Building2,
    permission: PERMISSIONS.ORG_UPDATE,
  },
  {
    href: "/dashboard/settings/staff",
    label: "Staff & roles",
    description: "Assign roles and manage permissions",
    icon: Users,
    permission: PERMISSIONS.STAFF_MANAGE,
  },
  {
    href: "/dashboard/settings/audit",
    label: "Audit log",
    description: "Immutable record of sensitive changes",
    icon: History,
    permission: PERMISSIONS.AUDIT_READ,
  },
  {
    href: "/dashboard/settings/modules",
    label: "Module flags",
    description: "Enable or disable shop modules",
    icon: Flag,
    permission: PERMISSIONS.MODULES_MANAGE,
  },
];

export default function SettingsPage() {
  const { hasPermission, org, shopName } = useOrgContext();

  const visible = settingsLinks.filter((link) => hasPermission(link.permission));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Shield className="h-8 w-8 text-primary" />
          Shop settings
        </h2>
        <p className="text-muted-foreground mt-1">
          {org?.name ?? shopName ?? "Organization"} — admin and operations
        </p>
      </div>

      {visible.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            You do not have permission to manage shop settings.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {visible.map((link) => (
            <Link key={link.href} href={link.href}>
              <Card className="h-full hover:border-primary/40 transition-colors cursor-pointer">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <link.icon className="h-5 w-5 text-primary" />
                    {link.label}
                  </CardTitle>
                  <CardDescription>{link.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Deferred in this release
          </CardTitle>
          <CardDescription>
            OE-182 API versioning and OE-183 notification settings will ship in a follow-up PR.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
