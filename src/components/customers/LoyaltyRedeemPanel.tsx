"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { rewardService } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  axiosRedeemError,
  buildRedeemOtpPayload,
  buildRedeemPayload,
  parseOtpSent,
  parseRedeemResult,
  pendingOrdersForRedeem,
  type RedeemResult,
  type RedeemableOrder,
} from "@/lib/loyaltyRedeem";

interface LoyaltyRedeemPanelProps {
  customerId?: number | null;
  locationId?: number | null;
  orders?: RedeemableOrder[] | null;
  canRedeem: boolean;
  compact?: boolean;
  onRedeemed?: (result: RedeemResult) => void;
}

export function LoyaltyRedeemPanel({
  customerId,
  locationId,
  orders,
  canRedeem,
  compact = false,
  onRedeemed,
}: LoyaltyRedeemPanelProps) {
  const pending = useMemo(() => pendingOrdersForRedeem(orders), [orders]);
  const [orderId, setOrderId] = useState<string>(
    pending[0] ? String(pending[0].id) : ""
  );
  const [otp, setOtp] = useState("");
  const [points, setPoints] = useState("");
  const [sending, setSending] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [otpHint, setOtpHint] = useState<string | null>(null);
  const [result, setResult] = useState<RedeemResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedId = Number(orderId) || pending[0]?.id || null;

  const sendOtp = async () => {
    const payload = buildRedeemOtpPayload({
      orderId: selectedId,
      customerId,
      locationId,
    });
    if (!payload) {
      setError("Pick a pending order or customer first.");
      return;
    }
    setSending(true);
    setError(null);
    try {
      const res = await rewardService.sendStaffRedeemOtp(payload);
      const parsed = parseOtpSent(res.data);
      setOtpHint(
        parsed?.expiresIn
          ? `OTP sent to the customer's registered mobile. Expires in ${parsed.expiresIn}s.`
          : "OTP sent to the customer's registered mobile."
      );
    } catch (err: unknown) {
      const mapped = axiosRedeemError(err as { response?: { status?: number; data?: { error?: string } } });
      setError(mapped.message);
      toast.error(mapped.message);
    } finally {
      setSending(false);
    }
  };

  const redeem = async () => {
    if (!selectedId) {
      setError("Pick a pending order to redeem against.");
      return;
    }
    const payload = buildRedeemPayload({
      orderId: selectedId,
      otpCode: otp,
      points: points.trim() === "" ? null : points,
    });
    if (!payload) {
      setError("Enter the OTP from the customer's phone.");
      return;
    }
    setRedeeming(true);
    setError(null);
    try {
      const res = await rewardService.redeemOnPendingOrder(payload);
      const parsed = parseRedeemResult(res.data);
      if (!parsed) {
        setError("Unexpected redeem payload.");
        return;
      }
      setResult(parsed);
      setOtp("");
      onRedeemed?.(parsed);
      toast.success(`Redeemed ${parsed.pointsRedeemed} points on order #${parsed.orderId}`);
    } catch (err: unknown) {
      const mapped = axiosRedeemError(err as { response?: { status?: number; data?: { error?: string } } });
      setError(mapped.message);
      toast.error(mapped.message);
    } finally {
      setRedeeming(false);
    }
  };

  if (!canRedeem) {
    return (
      <div className={compact ? "text-[11px] text-muted-foreground" : "text-sm text-muted-foreground"}>
        Redeem needs <code>orders.update</code> and the rewards module. Wallet earn is not configured here.
      </div>
    );
  }

  if (pending.length === 0) {
    return (
      <div className={compact ? "text-[11px] text-muted-foreground" : "text-sm text-muted-foreground"}>
        No pending order to redeem against. Staff redeem applies to a pending single-tender order — POS checkout burn is not on the current BE contract.
      </div>
    );
  }

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      <p className={compact ? "text-[10px] font-black uppercase tracking-widest text-gray-400" : "text-sm font-medium"}>
        Redeem rewards OTP
      </p>
      <div className={compact ? "space-y-2" : "grid gap-3 sm:grid-cols-2"}>
        <div className="space-y-1">
          <Label className="text-xs">Pending order</Label>
          <Select value={orderId || String(pending[0].id)} onValueChange={setOrderId}>
            <SelectTrigger>
              <SelectValue placeholder="Select pending order" />
            </SelectTrigger>
            <SelectContent>
              {pending.map((order) => (
                <SelectItem key={order.id} value={String(order.id)}>
                  #{order.order_number || order.id} · ₹{order.total_amount ?? "—"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Points (optional)</Label>
          <Input
            inputMode="numeric"
            placeholder="Max allowed if blank"
            value={points}
            onChange={(e) => setPoints(e.target.value.replace(/[^\d.]/g, ""))}
          />
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <Button type="button" variant="outline" onClick={sendOtp} disabled={sending}>
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send OTP"}
        </Button>
        <Input
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="OTP from customer phone"
          value={otp}
          maxLength={8}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
        />
        <Button type="button" onClick={redeem} disabled={redeeming}>
          {redeeming ? <Loader2 className="h-4 w-4 animate-spin" /> : "Redeem"}
        </Button>
      </div>
      {otpHint && <p className="text-xs text-muted-foreground">{otpHint}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {result && (
        <p className="text-xs text-green-700">
          Burned {result.pointsRedeemed} pts · discount ₹{result.discountFromPoints} · new total ₹{result.totalAmount}
        </p>
      )}
    </div>
  );
}
