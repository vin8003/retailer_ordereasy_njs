/** Inbox list query helpers (OE-135 / OE-131 / OE-152). */

export type InboxSourceFilter = '' | 'app' | 'pos';
export type InboxDeliveryModeFilter = '' | 'delivery' | 'pickup';

export interface InboxFilters {
  needsAction?: boolean;
  source?: InboxSourceFilter;
  deliveryMode?: InboxDeliveryModeFilter;
  /** OE-152: packed pickup orders awaiting collection. */
  pickupQueue?: boolean;
  status?: string;
  search?: string;
}

export function buildInboxQueryParams(
  filters: InboxFilters
): Record<string, string | number | boolean> {
  const params: Record<string, string | number | boolean> = {};

  if (filters.pickupQueue) {
    params.delivery_mode = 'pickup';
    params.status = 'packed';
  } else {
    if (filters.needsAction) {
      params.needs_action = true;
    } else if (filters.status) {
      params.status = filters.status;
    }

    if (filters.source) {
      params.source = filters.source;
    }
    if (filters.deliveryMode) {
      params.delivery_mode = filters.deliveryMode;
    }
  }

  if (filters.search?.trim()) {
    params.search = filters.search.trim();
  }

  return params;
}

export function formatOrderSource(source?: string): string {
  if (source === 'pos') return 'Store (POS)';
  if (source === 'app') return 'Online (App)';
  return source ? source.toUpperCase() : 'Unknown';
}
