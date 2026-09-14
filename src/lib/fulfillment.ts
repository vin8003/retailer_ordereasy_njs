import { format, parseISO } from "date-fns";

export interface DeliveryInfo {
  delivery_person_name: string;
  delivery_person_phone: string;
  estimated_delivery_time?: string | null;
  delivery_status?: string;
  actual_delivery_time?: string | null;
}

export interface FulfillmentSlotOption {
  slot_start: string;
  slot_end: string;
  slot_start_local?: string;
  slot_end_local?: string;
  capacity: number;
  booked: number;
  remaining: number;
  is_available: boolean;
}

export interface FulfillmentSlotConfigLocation {
  location_id: number;
  fulfillment_slot_capacity: number;
  timezone?: string;
}

export function formatFulfillmentSlot(
  slotStart?: string | null,
  slotEnd?: string | null
): string | null {
  if (!slotStart) return null;
  try {
    const start = parseISO(slotStart);
    const startLabel = format(start, "EEE, MMM d • h:mm a");
    if (slotEnd) {
      const end = parseISO(slotEnd);
      return `${startLabel} – ${format(end, "h:mm a")}`;
    }
    return startLabel;
  } catch {
    return slotStart;
  }
}

export function formatSlotOptionLabel(slot: FulfillmentSlotOption): string {
  const start = slot.slot_start_local || slot.slot_start;
  const end = slot.slot_end_local || slot.slot_end;
  const formatted = formatFulfillmentSlot(start, end);
  if (!formatted) return "Unknown slot";
  if (!slot.is_available) return `${formatted} (full)`;
  return `${formatted} (${slot.remaining} left)`;
}

export interface StatusUpdatePayload {
  status: string;
  preparation_time_minutes?: number;
  delivery_person_name?: string;
  delivery_person_phone?: string;
  estimated_delivery_time?: string;
}

export function buildInboxDispatchPayload(courier: {
  name: string;
  phone: string;
  estimatedDeliveryTime?: string;
}) {
  return {
    action: 'dispatch' as const,
    delivery_person_name: courier.name.trim(),
    delivery_person_phone: courier.phone.trim(),
    ...(courier.estimatedDeliveryTime
      ? { estimated_delivery_time: courier.estimatedDeliveryTime }
      : {}),
  };
}

export function buildInboxMarkDeliveredPayload(pickup: {
  pickupCode: string;
  customerId?: number;
}) {
  const payload: Record<string, unknown> = {
    action: 'mark_delivered' as const,
    pickup_code: pickup.pickupCode.trim(),
  };
  if (pickup.customerId != null) {
    payload.customer_id = pickup.customerId;
  }
  return payload;
}

/** Shop close-out from OFD for delivery-mode orders (OE-281). Pickup stays on pickup_code. */
export function isOfdDeliveryCloseOut(
  status: string,
  deliveryMode?: string
): boolean {
  return (
    status.toLowerCase() === 'out_for_delivery' &&
    (deliveryMode ?? 'delivery') === 'delivery'
  );
}

/** Inbox mark_delivered without pickup_code — reuse #32 action for OFD delivery. */
export function buildInboxOfdMarkDeliveredPayload() {
  return {
    action: 'mark_delivered' as const,
  };
}

/** Retailer OFD shop close-out copy — delivery failed, not Cancel. Customer Failed label is out of scope. */
export const OFD_CLOSEOUT_COPY = {
  markFailedButton: 'Mark as failed',
  dialogTitle: 'Delivery failed',
  dialogDescription:
    'Shop close-out for this out-for-delivery order. A reason is required.',
  reasonLabel: 'Reason',
  reasonPlaceholder: 'Why did this delivery fail?',
  submit: 'Mark as failed',
  successToast: 'Marked as delivery failed',
} as const;

export const FAILED_REASON_REQUIRED = 'Reason is required';

export function validateFailedReason(reason: string): string | null {
  if (!reason.trim()) return FAILED_REASON_REQUIRED;
  return null;
}

export function buildInboxMarkFailedPayload(reason: string) {
  const validationError = validateFailedReason(reason);
  if (validationError) {
    throw new Error(validationError);
  }
  return {
    action: 'mark_failed' as const,
    reason: reason.trim(),
  };
}

export function buildDispatchPayload(
  status: string,
  courier: { name: string; phone: string; estimatedDeliveryTime?: string }
): StatusUpdatePayload {
  const payload: StatusUpdatePayload = {
    status,
    delivery_person_name: courier.name.trim(),
    delivery_person_phone: courier.phone.trim(),
  };
  if (courier.estimatedDeliveryTime) {
    payload.estimated_delivery_time = courier.estimatedDeliveryTime;
  }
  return payload;
}
