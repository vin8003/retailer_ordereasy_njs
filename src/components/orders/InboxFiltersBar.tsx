"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { InboxDeliveryModeFilter, InboxSourceFilter } from "@/lib/inbox";

interface InboxFiltersBarProps {
  needsAction: boolean;
  onNeedsActionChange: (value: boolean) => void;
  source: InboxSourceFilter;
  onSourceChange: (value: InboxSourceFilter) => void;
  deliveryMode: InboxDeliveryModeFilter;
  onDeliveryModeChange: (value: InboxDeliveryModeFilter) => void;
  pickupQueue: boolean;
  onPickupQueueChange: (value: boolean) => void;
}

export function InboxFiltersBar({
  needsAction,
  onNeedsActionChange,
  source,
  onSourceChange,
  deliveryMode,
  onDeliveryModeChange,
  pickupQueue,
  onPickupQueueChange,
}: InboxFiltersBarProps) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border bg-muted/30 p-4">
      <div className="flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-2">
          <Switch
            id="needsAction"
            checked={needsAction}
            onCheckedChange={(v) => {
              onNeedsActionChange(v);
              if (v) onPickupQueueChange(false);
            }}
            disabled={pickupQueue}
          />
          <Label htmlFor="needsAction" className="text-sm font-medium cursor-pointer">
            Needs action
          </Label>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            id="pickupQueue"
            checked={pickupQueue}
            onCheckedChange={(v) => {
              onPickupQueueChange(v);
              if (v) onNeedsActionChange(false);
            }}
          />
          <Label htmlFor="pickupQueue" className="text-sm font-medium cursor-pointer">
            Pickup queue (packed)
          </Label>
        </div>
      </div>

      {!pickupQueue && (
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Source</p>
            <Tabs
              value={source || "all"}
              onValueChange={(v) => onSourceChange(v === "all" ? "" : (v as InboxSourceFilter))}
            >
              <TabsList className="h-9">
                <TabsTrigger value="all" className="text-xs px-3">All</TabsTrigger>
                <TabsTrigger value="app" className="text-xs px-3">App</TabsTrigger>
                <TabsTrigger value="pos" className="text-xs px-3">POS</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Fulfillment</p>
            <Tabs
              value={deliveryMode || "all"}
              onValueChange={(v) =>
                onDeliveryModeChange(v === "all" ? "" : (v as InboxDeliveryModeFilter))
              }
            >
              <TabsList className="h-9">
                <TabsTrigger value="all" className="text-xs px-3">All</TabsTrigger>
                <TabsTrigger value="delivery" className="text-xs px-3">Delivery</TabsTrigger>
                <TabsTrigger value="pickup" className="text-xs px-3">Pickup</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      )}
    </div>
  );
}
