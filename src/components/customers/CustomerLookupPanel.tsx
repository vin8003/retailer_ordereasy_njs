"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { customerService } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { orderDetailsHref } from "@/lib/orderLinks";
import {
  type CustomerLookup,
  type LookupOrder,
  digitsForLookup,
  formatLookupSource,
  isHistoryExportDenied,
  isLookupBadPhone,
  isLookupNotFound,
  isLookupPhoneReady,
  parseLookupExport,
  parseLookupResponse,
} from "@/lib/customerLookup";

interface CustomerLookupPanelProps {
  canExport?: boolean;
}

export function CustomerLookupPanel({ canExport = false }: CustomerLookupPanelProps) {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [result, setResult] = useState<CustomerLookup | null>(null);
  const [exportRows, setExportRows] = useState<LookupOrder[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runLookup = async () => {
    if (!isLookupPhoneReady(phone)) {
      setError("Enter at least 10 digits.");
      return;
    }
    setLoading(true);
    setError(null);
    setExportRows(null);
    try {
      const res = await customerService.lookupByPhone(digitsForLookup(phone));
      const parsed = parseLookupResponse(res.data);
      setResult(parsed);
      if (!parsed) setError("Unexpected lookup payload.");
    } catch (err: any) {
      setResult(null);
      const status = err.response?.status;
      if (isLookupNotFound(status)) setError("No customer or orders for this phone in this org.");
      else if (isLookupBadPhone(status)) setError("Phone must be at least 10 digits.");
      else setError(err.response?.data?.error || "Lookup failed");
    } finally {
      setLoading(false);
    }
  };

  const runExport = async () => {
    if (!isLookupPhoneReady(phone)) return;
    setExporting(true);
    try {
      const res = await customerService.exportLookupHistory(digitsForLookup(phone), {
        page_size: 50,
      });
      const page = parseLookupExport(res.data);
      setExportRows(page?.results ?? []);
    } catch (err: any) {
      if (isHistoryExportDenied(err.response?.status)) {
        toast.error("orders.read is required to export full history.");
      } else {
        toast.error(err.response?.data?.error || "Export failed");
      }
    } finally {
      setExporting(false);
    }
  };

  const rows = exportRows ?? result?.recent_orders ?? [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Phone lookup</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            type="tel"
            inputMode="numeric"
            placeholder="10-digit phone"
            value={phone}
            maxLength={14}
            onChange={(e) => setPhone(e.target.value.replace(/[^\d+]/g, ""))}
            onKeyDown={(e) => {
              if (e.key === "Enter") runLookup();
            }}
          />
          <Button onClick={runLookup} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
            Lookup
          </Button>
          {canExport && (
            <Button variant="outline" onClick={runExport} disabled={exporting || !result}>
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Full history"}
            </Button>
          )}
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {result && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">{result.customer_name || "Guest"}</span>
              <span className="text-sm text-muted-foreground">{result.phone_number}</span>
              <Badge variant="secondary">{result.registration_status || "unknown"}</Badge>
              {result.customer_id != null && (
                <Button
                  variant="link"
                  className="h-auto p-0"
                  onClick={() =>
                    router.push(`/dashboard/customers/details?id=${result.customer_id}`)
                  }
                >
                  Open profile
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {result.total_orders} orders · spent ₹{result.total_spent}
              {result.current_balance != null ? ` · due ₹${result.current_balance}` : ""}
            </p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-muted-foreground">
                      No recent orders.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((order) => (
                    <TableRow
                      key={order.id}
                      className="cursor-pointer"
                      onClick={() => {
                        const href = orderDetailsHref({ id: order.id, orderNumber: order.order_number });
                        if (href) router.push(href);
                      }}
                    >
                      <TableCell className="font-medium">{order.order_number || order.id}</TableCell>
                      <TableCell>{formatLookupSource(order.source)}</TableCell>
                      <TableCell>{order.status}</TableCell>
                      <TableCell className="text-right">₹{order.total_amount}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            {exportRows && (
              <p className="text-[10px] text-muted-foreground">
                Showing first export page (orders.read). Duplicate merge is not available.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
