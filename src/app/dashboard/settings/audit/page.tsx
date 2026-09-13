"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ArrowLeft, History, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { PERMISSIONS, type OrgAuditEntry } from "@/lib/org";
import { InfiniteScrollTrigger } from "@/components/dashboard/InfiniteScrollTrigger";

export default function AuditLogPage() {
  const { orgId, locationId, hasPermission } = useOrgContext();
  const [entries, setEntries] = useState<OrgAuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [nextPage, setNextPage] = useState<string | null>(null);

  const canRead = hasPermission(PERMISSIONS.AUDIT_READ);

  const fetchLog = useCallback(
    async (append = false) => {
      if (!orgId || !canRead) return;
      if (append) setIsFetchingMore(true);
      else setIsLoading(true);

      try {
        const params: Record<string, string | number> = {};
        if (locationId) params.location_id = locationId;

        let response;
        if (append && nextPage) {
          const url = new URL(nextPage);
          const page = url.searchParams.get("page");
          response = await orgService.fetchAuditLog(orgId, { ...params, page: page ?? undefined });
        } else {
          response = await orgService.fetchAuditLog(orgId, params);
        }

        const data = response.data.results ?? response.data ?? [];
        const next = response.data.next ?? null;

        setEntries((prev) => (append ? [...prev, ...data] : data));
        setNextPage(next);
      } catch (error) {
        console.error("Failed to load audit log", error);
        toast.error("Failed to load audit log");
      } finally {
        setIsLoading(false);
        setIsFetchingMore(false);
      }
    },
    [orgId, locationId, canRead, nextPage]
  );

  useEffect(() => {
    fetchLog(false);
  }, [orgId, locationId, canRead]);

  if (!canRead) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        Audit log requires the audit.read permission.
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
          <History className="h-6 w-6 text-primary" />
          Audit log
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Immutable org-scoped events. Rows cannot be edited or deleted via API.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent events</CardTitle>
          <CardDescription>
            {locationId ? `Filtered to location #${locationId}` : "All locations"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : entries.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No audit entries yet.</p>
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>When</TableHead>
                      <TableHead>Actor</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Object</TableHead>
                      <TableHead>Summary</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="whitespace-nowrap text-xs">
                          {format(new Date(row.created_at), "MMM d, yyyy h:mm a")}
                        </TableCell>
                        <TableCell className="text-sm">
                          {row.actor_username ?? "system"}
                        </TableCell>
                        <TableCell>
                          <code className="text-xs">{row.action}</code>
                        </TableCell>
                        <TableCell className="text-xs">
                          {row.object_type} #{row.object_id}
                          {row.location ? ` · loc ${row.location}` : ""}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                          {JSON.stringify(row.summary_after ?? row.summary_before ?? {})}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <InfiniteScrollTrigger
                onLoadMore={() => fetchLog(true)}
                hasMore={!!nextPage}
                isLoading={isFetchingMore}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
