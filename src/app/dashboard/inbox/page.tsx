"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, Inbox } from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { OrderTable } from "@/components/orders/OrderTable";
import { InboxFiltersBar } from "@/components/orders/InboxFiltersBar";
import { orderService } from "@/services/api";
import { InfiniteScrollTrigger } from "@/components/dashboard/InfiniteScrollTrigger";
import {
  buildInboxQueryParams,
  type InboxDeliveryModeFilter,
  type InboxSourceFilter,
  type InboxStatusChip,
} from "@/lib/inbox";
import { useOrgContext } from "@/hooks/useOrgContext";
import { PERMISSIONS } from "@/lib/org";

export default function InboxPage() {
  const { hasPermission } = useOrgContext();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [needsAction, setNeedsAction] = useState(false);
  const [source, setSource] = useState<InboxSourceFilter>("");
  const [deliveryMode, setDeliveryMode] = useState<InboxDeliveryModeFilter>("");
  const [pickupQueue, setPickupQueue] = useState(false);
  const [statusChip, setStatusChip] = useState<InboxStatusChip>("");
  const [nextPage, setNextPage] = useState<string | null>(null);

  const canRead = hasPermission(PERMISSIONS.ORDERS_READ);

  const fetchInbox = useCallback(
    async (append = false) => {
      if (!canRead) {
        setIsLoading(false);
        return;
      }

      if (append) setIsFetchingMore(true);
      else setIsLoading(true);

      try {
        const filterParams = buildInboxQueryParams({
          needsAction,
          source,
          deliveryMode,
          pickupQueue,
          statusChip,
          search: searchQuery,
        });

        let response;
        if (append && nextPage) {
          const url = new URL(nextPage);
          const page = url.searchParams.get("page");
          response = await orderService.fetchInbox({ ...filterParams, page: page ?? undefined });
        } else {
          response = await orderService.fetchInbox(filterParams);
        }

        const data = response.data.results || response.data;
        const next = response.data.next || null;

        setOrders((prev) => (append ? [...prev, ...data] : data));
        setNextPage(next);
      } catch (error) {
        console.error("Failed to fetch inbox:", error);
        toast.error("Failed to load inbox");
      } finally {
        setIsLoading(false);
        setIsFetchingMore(false);
      }
    },
    [needsAction, source, deliveryMode, pickupQueue, statusChip, searchQuery, nextPage, canRead]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInbox(false);
    }, 300);

    const handleFcmUpdate = () => fetchInbox(false);
    window.addEventListener("fcm_order_update", handleFcmUpdate);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("fcm_order_update", handleFcmUpdate);
    };
  }, [needsAction, source, deliveryMode, pickupQueue, statusChip, searchQuery, canRead]);

  if (!canRead) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        Order inbox requires the orders.read permission.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Inbox className="h-8 w-8 text-primary" />
          Order inbox
        </h2>
        <p className="text-muted-foreground">
          Unified queue for app and POS orders. Dispatch and pickup verification reuse PR #32 inbox actions.
        </p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search order #..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <InboxFiltersBar
        needsAction={needsAction}
        onNeedsActionChange={setNeedsAction}
        source={source}
        onSourceChange={setSource}
        deliveryMode={deliveryMode}
        onDeliveryModeChange={setDeliveryMode}
        pickupQueue={pickupQueue}
        onPickupQueueChange={setPickupQueue}
        statusChip={statusChip}
        onStatusChipChange={setStatusChip}
      />

      <OrderTable orders={orders} isLoading={isLoading} />

      <InfiniteScrollTrigger
        onLoadMore={() => fetchInbox(true)}
        hasMore={!!nextPage}
        isLoading={isFetchingMore}
      />
    </div>
  );
}
