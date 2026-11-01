'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Flag, Loader2, PackageX, RefreshCw, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

import { adminService, API_ORIGIN, authService } from '@/services/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
    cleanReason,
    isAutoHold,
    MODERATION_LABEL,
    productActionsFor,
    REPORT_ACTION_META,
    reportActionLabel,
    reportActionsFor,
    type ModerationStatus,
    type ProductModerateAction,
    type ReportAction,
    type ReportGroup,
    type ReviewProduct,
} from '@/components/moderation/moderationModel';

const PAGE_SIZE = 50; // the backend's page size for both lists
type View = 'reports' | 'products';
type ReportStatus = 'open' | 'actioned' | 'dismissed';
type HeldStatus = Exclude<ModerationStatus, 'ok'>;

const PRODUCT_ACTION_META: Record<ProductModerateAction, { label: string; needsReason: boolean; tone: 'green' | 'neutral' | 'red' }> = {
    approve: { label: 'Approve (allow this text)', needsReason: false, tone: 'green' },
    hide: { label: 'Hide', needsReason: true, tone: 'neutral' },
    remove: { label: 'Remove', needsReason: true, tone: 'red' },
};

const mediaUrl = (url: string | null) => (url && url.startsWith('/') ? `${API_ORIGIN}${url}` : url);
const errorText = (err: unknown, fallback: string) =>
    (err as { response?: { data?: { error?: string } } })?.response?.data?.error || fallback;

function ActionBox<A extends string>({
    id,
    actions,
    meta,
    busy,
    onAct,
}: {
    id: string;
    actions: A[];
    meta: Record<A, { label: string; needsReason: boolean; tone: string }>;
    busy: boolean;
    onAct: (action: A, reason: string) => void;
}) {
    const [reason, setReason] = useState('');
    if (actions.length === 0) return null;
    const act = (a: A) => {
        if (meta[a].needsReason && !reason.trim()) {
            toast.error('Write a reason first. The retailer sees it.');
            return;
        }
        onAct(a, reason.trim());
    };
    return (
        <div className="space-y-2 pt-2">
            <Textarea
                rows={2}
                data-testid={`reason-${id}`}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason (the retailer sees it). Needed for hide, remove and strike."
            />
            <div className="flex flex-wrap gap-2">
                {actions.map((a) => (
                    <Button
                        key={a}
                        size="sm"
                        disabled={busy}
                        data-testid={`act-${id}-${a}`}
                        variant={meta[a].tone === 'red' ? 'destructive' : meta[a].tone === 'green' ? 'default' : 'outline'}
                        className={meta[a].tone === 'green' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}
                        onClick={() => act(a)}
                    >
                        {meta[a].label}
                    </Button>
                ))}
            </div>
        </div>
    );
}

export default function AdminModerationPage() {
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
    const [view, setView] = useState<View>('reports');
    const [reportStatus, setReportStatus] = useState<ReportStatus>('open');
    const [productStatus, setProductStatus] = useState<HeldStatus>('pending_review');
    const [groups, setGroups] = useState<ReportGroup[]>([]);
    const [products, setProducts] = useState<ReviewProduct[]>([]);
    const [counts, setCounts] = useState<Record<HeldStatus, number>>({ pending_review: 0, hidden: 0, removed: 0 });
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const loadSeq = useRef(0);
    const [busyKey, setBusyKey] = useState<string | null>(null);

    useEffect(() => {
        authService
            .fetchAuthProfile()
            .then((res) => setIsAdmin(Boolean(res.data?.is_admin)))
            .catch(() => setIsAdmin(false));
    }, []);

    const load = useCallback(async () => {
        // Switching tabs quickly can finish out of order; only the latest request may write.
        const seq = ++loadSeq.current;
        setLoading(true);
        try {
            if (view === 'reports') {
                const res = await adminService.fetchReports({ status: reportStatus });
                if (seq !== loadSeq.current) return;
                setGroups(res.data?.results || []);
                setTotal(res.data?.count ?? (res.data?.results || []).length);
            } else {
                const res = await adminService.fetchProductReview({ status: productStatus });
                if (seq !== loadSeq.current) return;
                setProducts(res.data?.results || []);
                setTotal(res.data?.count ?? (res.data?.results || []).length);
                if (res.data?.counts) setCounts(res.data.counts);
            }
        } catch (err) {
            if (seq === loadSeq.current) toast.error(errorText(err, 'Could not load the list.'));
        } finally {
            if (seq === loadSeq.current) setLoading(false);
        }
    }, [view, reportStatus, productStatus]);

    useEffect(() => {
        if (isAdmin) load();
    }, [isAdmin, load]);

    const onReportAction = async (g: ReportGroup, action: ReportAction, reason: string) => {
        const key = `${g.retailer_id}-${g.product_id ?? 'shop'}`;
        setBusyKey(key);
        try {
            const res = await adminService.reportAction({
                retailer_id: g.retailer_id,
                product_id: g.product_id,
                action,
                reason: reason || undefined,
            });
            const flagged = res.data?.flagged_for_review
                ? ` ${g.shop_name} now has ${res.data.strikes_in_90_days} strikes in 90 days and is flagged for a suspend decision.`
                : '';
            toast.success(`${reportActionLabel(action, g.target_type)}: done.${flagged}`);
            await load();
        } catch (err) {
            toast.error(errorText(err, 'Action failed.'));
        } finally {
            setBusyKey(null);
        }
    };

    const onProductAction = async (p: ReviewProduct, action: ProductModerateAction, reason: string) => {
        setBusyKey(`p-${p.id}`);
        try {
            await adminService.moderateProduct(p.id, { action, reason: reason || undefined });
            toast.success(`${p.name}: ${PRODUCT_ACTION_META[action].label.toLowerCase()} done.`);
            await load();
        } catch (err) {
            toast.error(errorText(err, 'Action failed.'));
        } finally {
            setBusyKey(null);
        }
    };

    if (isAdmin === null) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    if (!isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-3" data-testid="moderation-denied">
                <AlertTriangle className="h-10 w-10 text-red-600" />
                <h2 className="text-2xl font-bold">Access Restricted</h2>
                <p className="text-muted-foreground">Only platform admins can see reports and the product queue.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6" data-testid="moderation-page">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <Flag className="h-6 w-6 text-primary" />
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Reports and products</h1>
                    </div>
                    <p className="text-muted-foreground text-sm mt-1">
                        Reports never hide anything by themselves. You decide here. Flagged shops also show in{' '}
                        <Link className="underline" href="/dashboard/admin/verifications">Retailer Verifications</Link> under Changed.
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-2 self-start sm:self-auto">
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                </Button>
            </div>

            <Tabs value={view} onValueChange={(v) => setView(v as View)}>
                <TabsList>
                    <TabsTrigger value="reports" data-testid="view-reports">Customer reports</TabsTrigger>
                    <TabsTrigger value="products" data-testid="view-products">Product queue</TabsTrigger>
                </TabsList>
            </Tabs>

            {view === 'reports' ? (
                <>
                    <Tabs value={reportStatus} onValueChange={(v) => setReportStatus(v as ReportStatus)}>
                        <TabsList>
                            <TabsTrigger value="open">Open</TabsTrigger>
                            <TabsTrigger value="actioned">Actioned</TabsTrigger>
                            <TabsTrigger value="dismissed">Dismissed</TabsTrigger>
                        </TabsList>
                    </Tabs>
                    {loading ? (
                        <div className="flex h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
                    ) : groups.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-10 text-center" data-testid="reports-empty">No {reportStatus} reports.</p>
                    ) : (
                        <div className="space-y-3">
                            {groups.map((g) => {
                                const key = `${g.retailer_id}-${g.product_id ?? 'shop'}`;
                                return (
                                    <Card key={key} data-testid={`report-group-${key}`} data-needs-review={g.needs_review}>
                                        <CardContent className="p-4 space-y-2">
                                            <div className="flex flex-wrap items-start gap-3">
                                                {g.product_image && (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={mediaUrl(g.product_image) || ''} alt="" className="h-14 w-14 rounded-md object-cover border" />
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-semibold">
                                                        {g.target_type === 'product' ? g.product_name : `Shop: ${g.shop_name}`}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {g.target_type === 'product' && <>{g.shop_name} · </>}
                                                        {g.reporters} customer{g.reporters === 1 ? '' : 's'} · {g.reports} report{g.reports === 1 ? '' : 's'} · strikes in 90 days: {g.strikes_in_90_days}
                                                        {g.shop_status && g.shop_status !== 'approved' && <> · shop {g.shop_status.replace('_', ' ')}</>}
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap gap-1">
                                                    {g.needs_review && reportStatus === 'open' && (
                                                        <Badge className="bg-amber-500 text-white" data-testid="needs-review">Needs review</Badge>
                                                    )}
                                                    {g.product_moderation_status && g.product_moderation_status !== 'ok' ? (
                                                        <Badge variant="destructive">{MODERATION_LABEL[g.product_moderation_status]}</Badge>
                                                    ) : g.target_type === 'product' ? (
                                                        <Badge variant="outline" className="text-emerald-700 border-emerald-300">Still live</Badge>
                                                    ) : null}
                                                </div>
                                            </div>
                                            <ul className="text-sm space-y-1">
                                                {g.recent.map((r, i) => (
                                                    <li key={i} className="border-l-2 pl-2">
                                                        <span className="font-medium">{r.reason}</span>
                                                        <span className="text-xs text-muted-foreground"> · {new Date(r.created_at).toLocaleString()}</span>
                                                        {r.text && <div className="text-muted-foreground">{r.text}</div>}
                                                    </li>
                                                ))}
                                            </ul>
                                            <ActionBox
                                                id={key}
                                                actions={reportActionsFor(g.target_type, reportStatus)}
                                                meta={{
                                                    ...REPORT_ACTION_META,
                                                    strike: { ...REPORT_ACTION_META.strike, label: reportActionLabel('strike', g.target_type) },
                                                }}
                                                busy={busyKey === key}
                                                onAct={(a, reason) => onReportAction(g, a, reason)}
                                            />
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                    {!loading && total > PAGE_SIZE && (
                        <p className="text-xs text-muted-foreground text-center" data-testid="more-results">
                            Showing the first {PAGE_SIZE} of {total}. Resolve some to see the rest.
                        </p>
                    )}
                </>
            ) : (
                <>
                    <Tabs value={productStatus} onValueChange={(v) => setProductStatus(v as HeldStatus)}>
                        <TabsList>
                            {(['pending_review', 'hidden', 'removed'] as HeldStatus[]).map((s) => (
                                <TabsTrigger key={s} value={s} data-testid={`queue-${s}`}>
                                    {MODERATION_LABEL[s]} ({counts[s] ?? 0})
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </Tabs>
                    {loading ? (
                        <div className="flex h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
                    ) : products.length === 0 ? (
                        <div className="py-10 text-center text-sm text-muted-foreground" data-testid="queue-empty">
                            <PackageX className="h-8 w-8 mx-auto mb-2 opacity-50" /> Nothing here.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {products.map((p) => (
                                <Card key={p.id} data-testid={`queue-product-${p.id}`}>
                                    <CardContent className="p-4 space-y-2">
                                        <div className="flex flex-wrap items-start gap-3">
                                            {p.image ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={mediaUrl(p.image) || ''} alt="" className="h-16 w-16 rounded-md object-cover border" />
                                            ) : (
                                                <div className="h-16 w-16 rounded-md border grid place-items-center text-xs text-muted-foreground">No photo</div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="font-semibold">{p.name}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {p.shop_name} · {p.category || 'No category'} · ₹{p.price}
                                                </div>
                                                {p.description && <div className="text-sm text-muted-foreground mt-1 line-clamp-3">{p.description}</div>}
                                                <div className="text-sm mt-1">
                                                    <ShieldCheck className="inline h-3.5 w-3.5 mr-1" />
                                                    {isAutoHold(p.moderation_reason) ? 'Automatic check: ' : 'Admin: '}
                                                    {cleanReason(p.moderation_reason) || '—'}
                                                </div>
                                            </div>
                                        </div>
                                        <ActionBox
                                            id={`p-${p.id}`}
                                            actions={productActionsFor(p.moderation_status)}
                                            meta={PRODUCT_ACTION_META}
                                            busy={busyKey === `p-${p.id}`}
                                            onAct={(a, reason) => onProductAction(p, a, reason)}
                                        />
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                    {!loading && total > PAGE_SIZE && (
                        <p className="text-xs text-muted-foreground text-center" data-testid="more-results">
                            Showing the first {PAGE_SIZE} of {total}. Resolve some to see the rest.
                        </p>
                    )}
                </>
            )}
        </div>
    );
}
