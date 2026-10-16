import { AlertCircle } from "lucide-react";
import type { CreditLockReason, KhataMapping } from "@/lib/creditLock";
import {
  REASON_CREDIT_LIMIT,
  REASON_CREDIT_OVERDUE,
  formatCreditLockMessage,
} from "@/lib/creditLock";

interface CreditLockBannerProps {
  mapping: KhataMapping;
  reasons: CreditLockReason[];
  canOverride: boolean;
  override: boolean;
  onOverrideChange: (next: boolean) => void;
}

export function CreditLockBanner({
  mapping,
  reasons,
  canOverride,
  override,
  onOverrideChange,
}: CreditLockBannerProps) {
  if (reasons.length === 0) return null;
  return (
    <div className="mt-3 rounded-2xl border border-orange-200 bg-orange-50 p-3 space-y-2">
      <div className="flex items-start gap-2 text-orange-800">
        <AlertCircle size={16} className="mt-0.5 shrink-0" />
        <div>
          <p className="text-xs font-black uppercase tracking-widest">Khata credit locked</p>
          <p className="text-xs font-medium mt-1">{formatCreditLockMessage(mapping, reasons)}</p>
          <p className="text-[10px] text-orange-700/80 mt-1">
            {reasons.includes(REASON_CREDIT_LIMIT) && "Over limit. "}
            {reasons.includes(REASON_CREDIT_OVERDUE) && "Past due days. "}
            Cash / UPI and recording a payment stay allowed.
          </p>
        </div>
      </div>
      {canOverride ? (
        <label className="flex items-start gap-2 text-xs font-semibold text-orange-900 cursor-pointer">
          <input
            type="checkbox"
            checked={override}
            onChange={(e) => onOverrideChange(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            Override lock for this sale (audited). Requires <code>orders.update</code>.
          </span>
        </label>
      ) : (
        <p className="text-[10px] font-bold text-orange-800">
          Override needs orders.update. Complete bill stays blocked for credit.
        </p>
      )}
    </div>
  );
}
