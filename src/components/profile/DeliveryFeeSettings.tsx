'use client';

import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    DeliveryFeeMode,
    DeliveryFeeTierRow,
    MAX_DELIVERY_FEE_TIERS,
    previewDeliveryFee,
    previewDistances,
    validateDeliveryFeeSettings,
} from '@/lib/deliveryFees';

interface Props {
    disabled: boolean;
    mode: DeliveryFeeMode;
    tiers: DeliveryFeeTierRow[];
    perKm: number;
    flatCharge: number;
    freeDeliveryThreshold: number;
    radiusKm: number;
    hasMapPin: boolean;
    onChange: (next: { mode?: DeliveryFeeMode; tiers?: DeliveryFeeTierRow[]; perKm?: number; flatCharge?: number; freeDeliveryThreshold?: number }) => void;
}

const formatRupees = (n: number) => `₹${Number.isInteger(n) ? n : n.toFixed(2)}`;

export default function DeliveryFeeSettings({
    disabled,
    mode,
    tiers,
    perKm,
    flatCharge,
    freeDeliveryThreshold,
    radiusKm,
    hasMapPin,
    onChange,
}: Props) {
    const error = validateDeliveryFeeSettings(mode, tiers, perKm);
    const config = { mode, tiers, perKm, flatCharge, radiusKm };
    const lastEnd = tiers.reduce((max, t) => Math.max(max, Number(t.upToKm) || 0), 0);

    const updateTier = (index: number, patch: Partial<DeliveryFeeTierRow>) => {
        onChange({ tiers: tiers.map((t, i) => (i === index ? { ...t, ...patch } : t)) });
    };

    const addTier = () => {
        const nextEnd = lastEnd > 0 ? lastEnd + 2 : 2;
        onChange({ tiers: [...tiers, { upToKm: String(nextEnd), fee: '' }] });
    };

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Label>Fee type</Label>
                <Select
                    disabled={disabled}
                    value={mode}
                    onValueChange={val => onChange({ mode: val as DeliveryFeeMode })}
                >
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="flat">Flat fee</SelectItem>
                        <SelectItem value="distance">By distance (tiers)</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>{mode === 'distance' ? 'Fallback delivery charge' : 'Delivery Charge'}</Label>
                    <Input
                        type="number"
                        min={0}
                        disabled={disabled}
                        value={flatCharge || 0}
                        onChange={e => onChange({ flatCharge: parseFloat(e.target.value) })}
                    />
                    <p className="text-xs text-muted-foreground">
                        {mode === 'distance'
                            ? 'Used when the customer’s address has no map pin'
                            : 'Standard delivery fee'}
                    </p>
                </div>
                <div className="space-y-2">
                    <Label>Free Delivery Above</Label>
                    <Input
                        type="number"
                        min={0}
                        disabled={disabled}
                        value={freeDeliveryThreshold || 0}
                        onChange={e => onChange({ freeDeliveryThreshold: parseFloat(e.target.value) })}
                    />
                    <p className="text-xs text-muted-foreground">Order amount to waive delivery fee</p>
                </div>
            </div>

            {mode === 'distance' && (
                <div className="space-y-4">
                    {!hasMapPin && (
                        <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                            Set your shop&apos;s map pin above. Without it distance can&apos;t be measured, so
                            customers pay the fallback charge and find you by city and pincode.
                        </p>
                    )}

                    <div className="space-y-2">
                        <Label>Distance tiers</Label>
                        {tiers.length === 0 && (
                            <p className="text-sm text-muted-foreground">No tiers yet. Add one, or use only a per-km rate.</p>
                        )}
                        {tiers.map((tier, i) => (
                            <div key={i} className="flex items-end gap-2">
                                <div className="flex-1 space-y-1">
                                    <span className="text-xs text-muted-foreground">Up to (km)</span>
                                    <Input
                                        type="number"
                                        min={0}
                                        step="0.5"
                                        aria-label={`Tier ${i + 1} up to km`}
                                        disabled={disabled}
                                        value={tier.upToKm}
                                        onChange={e => updateTier(i, { upToKm: e.target.value })}
                                    />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <span className="text-xs text-muted-foreground">Fee (₹)</span>
                                    <Input
                                        type="number"
                                        min={0}
                                        aria-label={`Tier ${i + 1} fee`}
                                        disabled={disabled}
                                        value={tier.fee}
                                        onChange={e => updateTier(i, { fee: e.target.value })}
                                    />
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    aria-label={`Remove tier ${i + 1}`}
                                    disabled={disabled}
                                    onClick={() => onChange({ tiers: tiers.filter((_, j) => j !== i) })}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={disabled || tiers.length >= MAX_DELIVERY_FEE_TIERS}
                            onClick={addTier}
                        >
                            <Plus className="mr-1 h-4 w-4" /> Add tier
                        </Button>
                    </div>

                    <div className="space-y-2">
                        <Label>
                            Per-km rate beyond {lastEnd > 0 ? `${lastEnd} km` : 'the shop'}
                        </Label>
                        <Input
                            type="number"
                            min={0}
                            disabled={disabled}
                            value={Number.isFinite(perKm) ? perKm : 0}
                            onChange={e => onChange({ perKm: parseFloat(e.target.value) })}
                        />
                        <p className="text-xs text-muted-foreground">
                            {lastEnd > 0
                                ? 'Added to the last tier’s fee for every started km past it, up to your delivery radius. 0 keeps the last tier’s fee.'
                                : 'Added to the fallback charge for every started km from the shop.'}
                        </p>
                    </div>

                    {error ? (
                        <p className="text-sm text-destructive">{error}</p>
                    ) : (
                        <div className="rounded-md bg-muted px-3 py-2 text-sm">
                            <div className="mb-1 font-medium">What customers pay</div>
                            <ul className="space-y-0.5 text-muted-foreground">
                                {previewDistances(config).map(km => {
                                    const fee = previewDeliveryFee(config, km);
                                    return (
                                        <li key={km}>
                                            {km} km: {fee == null ? 'outside radius' : formatRupees(fee)}
                                        </li>
                                    );
                                })}
                            </ul>
                            {freeDeliveryThreshold > 0 && (
                                <div className="mt-1 text-xs text-muted-foreground">
                                    Free for orders of {formatRupees(freeDeliveryThreshold)} or more.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
