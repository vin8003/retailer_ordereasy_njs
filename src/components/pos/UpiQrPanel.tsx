'use client';

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, AlertCircle } from 'lucide-react';
import {
    buildPosUpiQr,
    formatUpiAmount,
    type PosPaymentMode,
    type PosPaymentSplit,
} from '@/lib/upiIntent';

interface UpiQrPanelProps {
    paymentMode: PosPaymentMode;
    total: number;
    paymentSplit: PosPaymentSplit;
    upiId?: string | null;
    shopName?: string | null;
    billRef: string;
}

/** Dynamic exact-amount UPI QR for the current bill or its split UPI portion (OE-279). */
export function UpiQrPanel({ paymentMode, total, paymentSplit, upiId, shopName, billRef }: UpiQrPanelProps) {
    const qr = buildPosUpiQr({ paymentMode, total, paymentSplit, upiId, shopName, billRef });

    if (qr.status === 'hidden') return null;

    if (qr.status === 'missing_upi_id') {
        return (
            <div
                data-testid="upi-qr-empty"
                className="mt-4 p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-200"
            >
                <AlertCircle size={18} className="text-amber-500 mt-0.5 shrink-0" />
                <div>
                    <p className="text-xs font-black text-amber-700 uppercase tracking-widest">No UPI ID on file</p>
                    <p className="text-[11px] text-amber-600 font-medium mt-1">
                        Add a UPI ID in Settings → Profile to show a scannable exact-amount QR here.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div
            data-testid="upi-qr-ready"
            className="mt-4 p-4 bg-primary/5 rounded-2xl border border-primary/10 flex items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-200"
        >
            <div className="bg-white p-2 rounded-xl border border-primary/10 shrink-0">
                <QRCodeSVG value={qr.intentUri} size={128} level="M" />
            </div>
            <div className="min-w-0">
                <p className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-1.5">
                    <QrCode size={13} /> Scan to pay
                </p>
                <p className="text-3xl font-black text-gray-900 tracking-tighter mt-1">₹{formatUpiAmount(qr.amount)}</p>
                <p className="text-[11px] text-gray-500 font-medium mt-1">
                    {paymentMode === 'split' ? 'UPI portion of this split bill' : 'Full bill amount'}
                </p>
                <p className="text-[10px] text-gray-400 font-mono mt-1 truncate">{upiId} · OE-{billRef}</p>
            </div>
        </div>
    );
}
