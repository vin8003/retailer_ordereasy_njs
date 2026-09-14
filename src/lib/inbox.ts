/** Inbox list query helpers (OE-135 / OE-131 / OE-152 / OE-282). */

export type InboxSourceFilter = '' | 'app' | 'pos';
export type InboxDeliveryModeFilter = '' | 'delivery' | 'pickup';

/** UI chip ids — Accepted maps to BE confirmed. Failed close-outs use cancelled. */
export type InboxStatusChip =
  | ''
  | 'pending'
  | 'accepted'
  | 'packed'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export interface InboxStatusChipOption {
  chip: InboxStatusChip;
  label: string;
}

export const INBOX_STATUS_CHIPS: InboxStatusChipOption[] = [
  { chip: '', label: 'All' },
  { chip: 'pending', label: 'Pending' },
  { chip: 'accepted', label: 'Accepted' },
  { chip: 'packed', label: 'Packed' },
  { chip: 'out_for_delivery', label: 'Out for delivery' },
  { chip: 'delivered', label: 'Delivered' },
  { chip: 'cancelled', label: 'Cancelled' },
];

const CHIP_TO_ORDER_STATUS: Record<Exclude<InboxStatusChip, ''>, string> = {
  pending: 'pending',
  accepted: 'confirmed',
  packed: 'packed',
  out_for_delivery: 'out_for_delivery',
  delivered: 'delivered',
  cancelled: 'cancelled',
};

export function inboxStatusChipToParam(
  chip: InboxStatusChip
): string | undefined {
  if (!chip) return undefined;
  return CHIP_TO_ORDER_STATUS[chip];
}

export function inboxStatusChipsForDeliveryMode(
  deliveryMode: InboxDeliveryModeFilter
): InboxStatusChipOption[] {
  if (deliveryMode === 'pickup') {
    return INBOX_STATUS_CHIPS.filter((option) => option.chip !== 'out_for_delivery');
  }
  return INBOX_STATUS_CHIPS;
}

export function sanitizeInboxStatusChip(
  chip: InboxStatusChip,
  deliveryMode: InboxDeliveryModeFilter
): InboxStatusChip {
  if (chip === 'out_for_delivery' && deliveryMode === 'pickup') {
    return '';
  }
  return chip;
}

export interface InboxFilters {
  needsAction?: boolean;
  source?: InboxSourceFilter;
  deliveryMode?: InboxDeliveryModeFilter;
  /** OE-152: packed pickup orders awaiting collection. */
  pickupQueue?: boolean;
  /** OE-282: one lifecycle chip; mapped to a single inbox status param. */
  statusChip?: InboxStatusChip;
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
    } else {
      const chip = sanitizeInboxStatusChip(
        filters.statusChip ?? '',
        filters.deliveryMode ?? ''
      );
      const status = inboxStatusChipToParam(chip);
      if (status) {
        params.status = status;
      }
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
