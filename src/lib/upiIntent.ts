/** Dynamic exact-amount UPI intent helpers for POS billing (OE-279). */

export type PosPaymentMode = 'cash' | 'upi' | 'credit' | 'split';

export interface PosPaymentSplit {
  cash: number;
  upi: number;
  credit: number;
}

export interface UpiIntentInput {
  upiId: string;
  shopName: string;
  /** Rupees. Full bill total for UPI, or the UPI slice of a split. */
  amount: number;
  /** Order number once settled, otherwise the open bill reference. */
  billRef: string;
  txnRef: string;
}

export interface PosUpiQrInput {
  paymentMode: PosPaymentMode;
  total: number;
  paymentSplit: PosPaymentSplit;
  upiId?: string | null;
  shopName?: string | null;
  billRef: string;
}

export type PosUpiQr =
  /** Payment mode carries no UPI portion, or nothing payable yet. */
  | { status: 'hidden' }
  /** Shop profile has no `upi_id`, so no exact-amount intent can be built. */
  | { status: 'missing_upi_id' }
  | { status: 'ready'; amount: number; txnRef: string; intentUri: string };

export interface ReceiptUpiQrInput {
  upiId?: string | null;
  shopName?: string | null;
  amount: number;
  billRef: string;
}

export type ReceiptUpiQr =
  | { status: 'hidden' }
  | { status: 'missing_upi_id' }
  | { status: 'ready'; amount: number; txnRef: string; intentUri: string };

export type PrintUpiQrScope = 'pos' | 'orders';

/** UPI reference fields accept alphanumerics only, capped for scanner safety. */
const MAX_REF_LENGTH = 35;

function sanitizeRef(value: string): string {
  return value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, MAX_REF_LENGTH);
}

/** NPCI requires the amount as a two-decimal string, e.g. `499.50`. */
export function formatUpiAmount(amount: number): string {
  return (Math.round(amount * 100) / 100).toFixed(2);
}

/** The UPI-payable slice of the bill: full total for UPI, `paymentSplit.upi` for split. */
export function resolveUpiPayableAmount(input: {
  paymentMode: PosPaymentMode;
  total: number;
  paymentSplit: PosPaymentSplit;
}): number {
  if (input.paymentMode === 'upi') return Math.max(0, input.total);
  if (input.paymentMode === 'split') return Math.max(0, input.paymentSplit.upi);
  return 0;
}

/**
 * Transaction reference for a single QR. The bill reference is unique per bill
 * and the amount is included in paise, so a changed split UPI amount always
 * yields a different reference.
 */
export function buildUpiTxnRef(input: { billRef: string; amount: number }): string {
  const paise = Math.round(input.amount * 100);
  return sanitizeRef(`OE${input.billRef}${paise}`);
}

/** Builds the NPCI intent URI, or `null` when the shop or amount cannot fund one. */
export function buildUpiIntentUri(input: UpiIntentInput): string | null {
  const upiId = input.upiId.trim();
  if (!upiId) return null;
  if (!(input.amount > 0)) return null;

  const params = [
    `pa=${encodeURIComponent(upiId)}`,
    `pn=${encodeURIComponent(input.shopName.trim())}`,
    `am=${formatUpiAmount(input.amount)}`,
    'cu=INR',
    `tn=${encodeURIComponent(`OE-${input.billRef}`)}`,
    `tr=${encodeURIComponent(input.txnRef)}`,
  ];

  return `upi://pay?${params.join('&')}`;
}

/** Resolves what the POS should render for the current payment selection. */
export function buildPosUpiQr(input: PosUpiQrInput): PosUpiQr {
  if (input.paymentMode !== 'upi' && input.paymentMode !== 'split') {
    return { status: 'hidden' };
  }

  const upiId = input.upiId?.trim() ?? '';
  if (!upiId) return { status: 'missing_upi_id' };

  const amount = resolveUpiPayableAmount(input);
  if (amount <= 0) return { status: 'hidden' };

  const txnRef = buildUpiTxnRef({ billRef: input.billRef, amount });
  const intentUri = buildUpiIntentUri({
    upiId,
    shopName: input.shopName?.trim() || 'OrderEasy Store',
    amount,
    billRef: input.billRef,
    txnRef,
  });

  if (!intentUri) return { status: 'hidden' };

  return { status: 'ready', amount, txnRef, intentUri };
}

/** Builds the exact-amount UPI intent for thermal receipt printing. */
export function buildReceiptUpiQr(input: ReceiptUpiQrInput): ReceiptUpiQr {
  const upiId = input.upiId?.trim() ?? '';
  if (!upiId) return { status: 'missing_upi_id' };

  const amount = Math.max(0, input.amount);
  if (amount <= 0) return { status: 'hidden' };

  const txnRef = buildUpiTxnRef({ billRef: input.billRef, amount });
  const intentUri = buildUpiIntentUri({
    upiId,
    shopName: input.shopName?.trim() || 'OrderEasy Store',
    amount,
    billRef: input.billRef,
    txnRef,
  });

  if (!intentUri) return { status: 'hidden' };

  return { status: 'ready', amount, txnRef, intentUri };
}

/** Whether a printed receipt should include the dynamic UPI QR. */
export function shouldPrintReceiptUpiQr(input: {
  enabled?: boolean;
  scope: PrintUpiQrScope;
  paymentMode?: string | null;
}): boolean {
  if (!input.enabled) return false;
  if (input.scope === 'orders') return true;
  return String(input.paymentMode ?? '').toLowerCase() === 'upi';
}
