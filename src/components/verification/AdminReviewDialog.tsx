'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, FileText, Loader2, MapPin } from 'lucide-react';
import { toast } from 'sonner';

import { adminService, API_ORIGIN } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    ADMIN_ACTION_META,
    adminActionsFor,
    CHECK_LABEL,
    STATUS_LABEL,
    type AdminAction,
    type CheckResult,
    type VerificationCheck,
    type VerificationStatus,
} from './verificationModel';

interface Detail {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    is_phone_verified: boolean;
    shop_name: string;
    shop_description: string;
    shop_image: string | null;
    address_line1: string;
    address_line2: string;
    city: string;
    state: string;
    pincode: string;
    latitude: string | null;
    longitude: string | null;
    business_type: string;
    gst_number: string;
    pan_number: string;
    upi_id: string;
    proof_type: string;
    proof_number: string;
    verification_status: VerificationStatus;
    rejection_reason: string;
    review_needed: boolean;
    submitted_at: string | null;
    created_at: string;
    checks: VerificationCheck[];
    documents: { id: number; kind: string; content_type: string; uploaded_at: string }[];
    events: {
        id: number;
        action: string;
        from_status: string;
        to_status: string;
        reason: string;
        details: { changed?: Record<string, { from: string; to: string }> };
        actor: string | null;
        created_at: string;
    }[];
}

const CHIP: Record<CheckResult, string> = {
    pass: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
    fail: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-800',
    flag: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-800',
    manual: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800',
};

const DOC_LABEL: Record<string, string> = { proof: 'Business proof', owner_id: 'Owner ID', selfie: 'Selfie at shop' };

export function CheckChip({ result }: { result: CheckResult }) {
    return <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-bold ${CHIP[result]}`}>{CHECK_LABEL[result]}</span>;
}

const mediaUrl = (url: string | null) => (url && url.startsWith('/') ? `${API_ORIGIN}${url}` : url);

interface Props {
    profileId: number | null;
    onClose: () => void;
    onChanged: () => void;
}

export default function AdminReviewDialog({ profileId, onClose, onChanged }: Props) {
    const [detail, setDetail] = useState<Detail | null>(null);
    const [loading, setLoading] = useState(false);
    const [docUrls, setDocUrls] = useState<Record<number, string>>({});
    const [reason, setReason] = useState('');
    const [busy, setBusy] = useState<AdminAction | null>(null);

    useEffect(() => {
        if (!profileId) return;
        let alive = true;
        const created: string[] = [];
        setLoading(true);
        setDetail(null);
        setDocUrls({});
        setReason('');
        adminService
            .fetchVerificationDetail(profileId)
            .then(async (res) => {
                if (!alive) return;
                const d: Detail = res.data;
                setDetail(d);
                // Private documents need the auth header, so fetch them as blobs.
                for (const doc of d.documents) {
                    try {
                        const blob = await adminService.fetchVerificationDocument(profileId, doc.id);
                        const url = URL.createObjectURL(blob.data);
                        created.push(url);
                        if (alive) setDocUrls((prev) => ({ ...prev, [doc.id]: url }));
                    } catch {
                        /* shown as unavailable */
                    }
                }
            })
            .catch(() => alive && toast.error('Could not load this shop.'))
            .finally(() => alive && setLoading(false));
        return () => {
            alive = false;
            created.forEach((u) => URL.revokeObjectURL(u));
        };
    }, [profileId]);

    const act = async (action: AdminAction) => {
        if (!detail) return;
        const meta = ADMIN_ACTION_META[action];
        if (meta.needsReason && !reason.trim()) {
            toast.error('Write a reason first. The retailer will see it.');
            return;
        }
        setBusy(action);
        try {
            const res = await adminService.verifyAction(detail.id, { action, reason: reason.trim() || undefined });
            toast.success(res.data?.message || 'Done');
            onChanged();
            onClose();
        } catch {
            /* the API layer shows the error */
        } finally {
            setBusy(null);
        }
    };

    const actions = detail ? adminActionsFor(detail.verification_status, detail.review_needed) : [];
    const allPass = detail?.checks.every((c) => c.result === 'pass' || c.result === 'manual');

    return (
        <Dialog open={profileId != null} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="verification-review">
                <DialogHeader>
                    <DialogTitle>{detail?.shop_name || 'Shop review'}</DialogTitle>
                    <DialogDescription>
                        {detail ? `${STATUS_LABEL[detail.verification_status]}${detail.submitted_at ? ` · submitted ${new Date(detail.submitted_at).toLocaleString()}` : ' · not submitted yet'}` : 'Loading…'}
                    </DialogDescription>
                </DialogHeader>

                {loading || !detail ? (
                    <div className="flex h-48 items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="space-y-5">
                        <div className="grid md:grid-cols-2 gap-5">
                            <div className="space-y-2 text-sm">
                                <h3 className="font-semibold">Shop details</h3>
                                <div>
                                    <span className="text-muted-foreground">Owner: </span>
                                    {`${detail.first_name} ${detail.last_name}`.trim() || detail.username} (@{detail.username})
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Phone: </span>
                                    {detail.phone_number || '—'} {detail.is_phone_verified ? '✓ verified' : '(not verified)'}
                                </div>
                                <div><span className="text-muted-foreground">Email: </span>{detail.email || '—'}</div>
                                <div>
                                    <span className="text-muted-foreground">Address: </span>
                                    {[detail.address_line1, detail.address_line2, detail.city, detail.state, detail.pincode].filter(Boolean).join(', ') || '—'}
                                    {detail.latitude && detail.longitude && (
                                        <a
                                            className="ml-2 inline-flex items-center gap-1 text-primary underline"
                                            href={`https://www.google.com/maps?q=${detail.latitude},${detail.longitude}`}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            <MapPin className="h-3.5 w-3.5" /> Map pin
                                        </a>
                                    )}
                                </div>
                                <div><span className="text-muted-foreground">Type: </span>{detail.business_type || '—'}</div>
                                <div><span className="text-muted-foreground">GSTIN: </span>{detail.gst_number || '—'} · <span className="text-muted-foreground">PAN: </span>{detail.pan_number || '—'}</div>
                                <div><span className="text-muted-foreground">Proof: </span>{detail.proof_type || '—'} {detail.proof_number}</div>
                                <div><span className="text-muted-foreground">UPI: </span>{detail.upi_id || '—'}</div>
                                {detail.shop_description && <div className="text-muted-foreground">{detail.shop_description}</div>}
                            </div>

                            <div className="space-y-2">
                                <h3 className="font-semibold text-sm">Automated checks</h3>
                                <table className="w-full text-sm">
                                    <tbody>
                                        {detail.checks.map((c) => (
                                            <tr key={c.key} className="border-b last:border-0" data-testid={`review-check-${c.key}`} data-result={c.result}>
                                                <td className="py-1.5 pr-2">{c.label}</td>
                                                <td className="py-1.5 pr-2"><CheckChip result={c.result} /></td>
                                                <td className="py-1.5 text-xs text-muted-foreground">{c.detail}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div>
                            <h3 className="font-semibold text-sm mb-2">Photos and documents</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <figure className="space-y-1">
                                    {detail.shop_image ? (
                                        <a href={mediaUrl(detail.shop_image) || '#'} target="_blank" rel="noreferrer">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={mediaUrl(detail.shop_image) || ''} alt="Storefront" className="h-32 w-full rounded-lg object-cover border" />
                                        </a>
                                    ) : (
                                        <div className="h-32 rounded-lg border border-dashed grid place-items-center text-xs text-muted-foreground">No photo</div>
                                    )}
                                    <figcaption className="text-xs text-muted-foreground">Storefront</figcaption>
                                </figure>
                                {detail.documents.map((d) => {
                                    const url = docUrls[d.id];
                                    const isPdf = d.content_type === 'application/pdf';
                                    return (
                                        <figure key={d.id} className="space-y-1">
                                            {!url ? (
                                                <div className="h-32 rounded-lg border grid place-items-center"><Loader2 className="h-4 w-4 animate-spin" /></div>
                                            ) : isPdf ? (
                                                <a href={url} target="_blank" rel="noreferrer" className="h-32 rounded-lg border grid place-items-center text-sm text-primary gap-1">
                                                    <FileText className="h-6 w-6" /> Open PDF <ExternalLink className="h-3 w-3" />
                                                </a>
                                            ) : (
                                                <a href={url} target="_blank" rel="noreferrer">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img src={url} alt={DOC_LABEL[d.kind] || d.kind} className="h-32 w-full rounded-lg object-cover border" />
                                                </a>
                                            )}
                                            <figcaption className="text-xs text-muted-foreground">{DOC_LABEL[d.kind] || d.kind} (private)</figcaption>
                                        </figure>
                                    );
                                })}
                            </div>
                        </div>

                        {actions.length > 0 && (
                            <div className="space-y-2 rounded-lg border p-3">
                                <Label htmlFor="review-reason">Message to the retailer (required to ask for changes, suspend or reject)</Label>
                                <Textarea
                                    id="review-reason"
                                    data-testid="review-reason"
                                    rows={2}
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="e.g. The shop photo is too dark. Please upload a clear photo of the shop front."
                                />
                                <div className="flex flex-wrap gap-2">
                                    {actions.map((a) => {
                                        const meta = ADMIN_ACTION_META[a];
                                        const label = a === 'approve' && allPass && detail.verification_status === 'pending' ? 'Quick approve' : meta.label;
                                        return (
                                            <Button
                                                key={a}
                                                size="sm"
                                                data-testid={`review-action-${a}`}
                                                variant={meta.tone === 'red' ? 'destructive' : meta.tone === 'green' ? 'default' : 'outline'}
                                                className={meta.tone === 'green' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}
                                                disabled={busy != null}
                                                onClick={() => act(a)}
                                            >
                                                {busy === a && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                                                {label}
                                            </Button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div>
                            <h3 className="font-semibold text-sm mb-2">History</h3>
                            {detail.events.length === 0 ? (
                                <p className="text-xs text-muted-foreground">No events yet.</p>
                            ) : (
                                <ul className="space-y-1.5 text-xs">
                                    {detail.events.map((e) => (
                                        <li key={e.id} className="border-b pb-1.5 last:border-0">
                                            <span className="text-muted-foreground">{new Date(e.created_at).toLocaleString()}</span>{' '}
                                            <span className="font-medium">{e.action.replace(/_/g, ' ')}</span>
                                            {e.from_status !== e.to_status && ` (${e.from_status.replace('_', ' ')} → ${e.to_status.replace('_', ' ')})`}
                                            {e.actor && <span className="text-muted-foreground"> by {e.actor}</span>}
                                            {e.reason && <div className="text-muted-foreground">“{e.reason}”</div>}
                                            {e.details?.changed && (
                                                <div className="text-muted-foreground">
                                                    {Object.entries(e.details.changed).map(([f, v]) => `${f}: ${v.from || '—'} → ${v.to || '—'}`).join('; ')}
                                                </div>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
