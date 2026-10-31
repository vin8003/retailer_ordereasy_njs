'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Circle, FileUp, Loader2, Lock, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

import { authService, notifyVerificationChanged, verificationService } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import VerificationStatusCard from '@/components/verification/VerificationStatusCard';
import {
    deriveStage,
    PROOF_OPTIONS,
    STEP_HINDI,
    STEP_LINKS,
    stepsDone,
    type VerificationData,
    type VerificationDocument,
    type VerificationStep,
} from '@/components/verification/verificationModel';

const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

function UploadButton({
    label,
    kind,
    existing,
    onUploaded,
    testId,
}: {
    label: string;
    kind: 'proof' | 'owner_id' | 'selfie';
    existing?: VerificationDocument;
    onUploaded: () => void;
    testId: string;
}) {
    const input = useRef<HTMLInputElement>(null);
    const [busy, setBusy] = useState(false);
    const pick = async (file: File | undefined) => {
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            toast.error('File must be 5 MB or smaller.');
            return;
        }
        setBusy(true);
        try {
            await verificationService.uploadDocument(kind, file);
            toast.success('Uploaded');
            onUploaded();
        } catch {
            /* the API layer shows the error */
        } finally {
            setBusy(false);
            if (input.current) input.current.value = '';
        }
    };
    return (
        <div className="flex flex-wrap items-center gap-3">
            <input
                ref={input}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                capture={kind === 'selfie' ? 'user' : undefined}
                className="hidden"
                data-testid={testId}
                onChange={(e) => pick(e.target.files?.[0])}
            />
            <Button type="button" variant={existing ? 'outline' : 'default'} size="sm" disabled={busy} onClick={() => input.current?.click()} className="gap-2">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
                {existing ? 'Replace file' : label}
            </Button>
            {existing && (
                <span className="text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Uploaded {new Date(existing.uploaded_at).toLocaleDateString()}
                </span>
            )}
        </div>
    );
}

export default function VerificationPage() {
    const [data, setData] = useState<VerificationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [proofType, setProofType] = useState<VerificationData['proof_type']>('');
    const [proofNumber, setProofNumber] = useState('');
    const [gst, setGst] = useState('');
    const [savingProof, setSavingProof] = useState(false);
    const [open, setOpen] = useState<VerificationStep['key'] | null>(null);

    const load = useCallback(async (initial = false) => {
        try {
            const res = await verificationService.fetchStatus();
            const d: VerificationData = res.data;
            setData(d);
            if (initial) {
                setProofType(d.proof_type || '');
                setProofNumber(d.proof_number || '');
                const profile = await authService.fetchProfile();
                setGst(profile.data?.gst_number || '');
                if (!d.proof_type && profile.data?.gst_number) setProofType('gst');
                const firstOpen = d.steps.find((s) => !s.done);
                setOpen(firstOpen ? firstOpen.key : null);
            }
        } catch (err) {
            console.error('Failed to load verification', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load(true);
    }, [load]);

    const refresh = async () => {
        await load();
        notifyVerificationChanged();
    };

    const saveProof = async () => {
        if (!proofType) {
            toast.error('Choose one proof.');
            return;
        }
        const payload: Record<string, string> = { proof_type: proofType };
        if (proofType === 'gst') {
            const g = gst.trim().toUpperCase();
            if (!GSTIN_RE.test(g)) {
                toast.error('Enter a valid 15-character GST number.');
                return;
            }
            payload.gst_number = g;
        } else if (proofType !== 'board') {
            if (!proofNumber.trim()) {
                toast.error('Enter the licence number.');
                return;
            }
            payload.proof_number = proofNumber.trim();
        }
        setSavingProof(true);
        try {
            await authService.updateProfile(payload);
            toast.success('Saved');
            await refresh();
        } catch {
            /* the API layer shows the error */
        } finally {
            setSavingProof(false);
        }
    };

    const submit = async () => {
        setSubmitting(true);
        try {
            await verificationService.submit();
            toast.success('Submitted. We will check your shop soon.');
        } catch {
            /* 400 lists the steps still missing; the API layer shows the message */
        } finally {
            setSubmitting(false);
            await refresh();
        }
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }
    if (!data) {
        return <p className="text-sm text-muted-foreground">Could not load your verification status. Please try again.</p>;
    }

    const stage = deriveStage(data);
    const canEdit = ['incomplete', 'ready', 'submitted', 'needs_changes'].includes(stage);
    const canSubmit = (stage === 'ready' || stage === 'needs_changes') && data.ready;
    const docs = Object.fromEntries((data.documents || []).map((d) => [d.kind, d])) as Partial<Record<VerificationDocument['kind'], VerificationDocument>>;
    const left = data.steps.length - stepsDone(data.steps);

    return (
        <div className="max-w-3xl mx-auto space-y-5" data-testid="verification-page">
            <div>
                <div className="flex items-center gap-2">
                    <ShieldCheck className="h-6 w-6 text-primary" />
                    <h1 className="text-2xl font-bold tracking-tight">Shop verification</h1>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                    दुकान वेरिफिकेशन · Five short steps. Customers see your shop after our team approves it once.
                </p>
            </div>

            <VerificationStatusCard data={data} showLink={false} />

            <div className="space-y-3">
                {data.steps.map((step, index) => {
                    const isOpen = open === step.key;
                    const link = STEP_LINKS[step.key];
                    return (
                        <Card key={step.key} data-testid={`verification-step-${step.key}`} data-done={step.done}>
                            <CardContent className="p-4">
                                <button
                                    type="button"
                                    className="w-full flex items-center gap-3 text-left"
                                    onClick={() => setOpen(isOpen ? null : step.key)}
                                    aria-expanded={isOpen}
                                >
                                    {step.done ? (
                                        <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
                                    ) : (
                                        <Circle className="h-6 w-6 text-muted-foreground shrink-0" />
                                    )}
                                    <div className="flex-1">
                                        <div className="font-semibold">
                                            {index + 1}. {step.label}
                                            <span className="ml-2 text-xs font-normal text-muted-foreground">{STEP_HINDI[step.key]}</span>
                                        </div>
                                        {!step.done && step.detail && <div className="text-sm text-red-700 dark:text-red-400">{step.detail}</div>}
                                    </div>
                                    <span className={`text-xs font-bold rounded-full px-2 py-0.5 ${step.done ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-muted text-muted-foreground'}`}>
                                        {step.done ? 'Done' : 'To do'}
                                    </span>
                                </button>

                                {isOpen && canEdit && (
                                    <div className="mt-4 pl-9 space-y-3">
                                        {link && (
                                            <>
                                                <p className="text-sm text-muted-foreground">
                                                    {step.key === 'phone' && 'Verify your mobile number with the OTP on your profile page.'}
                                                    {step.key === 'shop' && 'Set your real shop name and add a clear photo of the shop front.'}
                                                    {step.key === 'address' && 'Fill in your address and pincode, and drop the pin on the map where your shop is.'}
                                                </p>
                                                <Button asChild size="sm">
                                                    <Link href={`${link}?edit=1`}>Open profile</Link>
                                                </Button>
                                            </>
                                        )}

                                        {step.key === 'proof' && (
                                            <div className="space-y-3">
                                                <p className="text-sm text-muted-foreground">Any one is enough. GST is not required.</p>
                                                <div className="grid sm:grid-cols-2 gap-2">
                                                    {PROOF_OPTIONS.map((opt) => (
                                                        <label
                                                            key={opt.value}
                                                            className={`flex gap-2 rounded-lg border p-3 cursor-pointer text-sm ${proofType === opt.value ? 'border-primary bg-primary/5' : ''}`}
                                                        >
                                                            <input
                                                                type="radio"
                                                                name="proof_type"
                                                                value={opt.value}
                                                                checked={proofType === opt.value}
                                                                onChange={() => setProofType(opt.value)}
                                                                data-testid={`proof-type-${opt.value}`}
                                                            />
                                                            <span>
                                                                <span className="font-medium block">{opt.label}</span>
                                                                <span className="text-xs text-muted-foreground">{opt.hint}</span>
                                                            </span>
                                                        </label>
                                                    ))}
                                                </div>
                                                {proofType === 'gst' && (
                                                    <div className="space-y-1">
                                                        <Label htmlFor="gst">GST number</Label>
                                                        <Input
                                                            id="gst"
                                                            data-testid="proof-gst"
                                                            value={gst}
                                                            maxLength={15}
                                                            className="uppercase"
                                                            onChange={(e) => setGst(e.target.value.toUpperCase())}
                                                            placeholder="08AAAAA0000A1Z5"
                                                        />
                                                        {gst && !GSTIN_RE.test(gst) && <p className="text-xs text-red-600">Not a valid GST format yet.</p>}
                                                    </div>
                                                )}
                                                {(proofType === 'fssai' || proofType === 'licence') && (
                                                    <div className="space-y-1">
                                                        <Label htmlFor="proof-number">{proofType === 'fssai' ? 'FSSAI number' : 'Licence number'}</Label>
                                                        <Input id="proof-number" data-testid="proof-number" value={proofNumber} maxLength={30} onChange={(e) => setProofNumber(e.target.value)} />
                                                    </div>
                                                )}
                                                <Button size="sm" onClick={saveProof} disabled={savingProof || !proofType} data-testid="proof-save">
                                                    {savingProof && <Loader2 className="h-4 w-4 animate-spin mr-1" />} Save
                                                </Button>
                                                {proofType && proofType !== 'gst' && (
                                                    <UploadButton
                                                        label={proofType === 'board' ? 'Upload board photo' : 'Upload photo of licence'}
                                                        kind="proof"
                                                        existing={docs.proof}
                                                        onUploaded={refresh}
                                                        testId="upload-proof"
                                                    />
                                                )}
                                            </div>
                                        )}

                                        {step.key === 'owner_id' && (
                                            <div className="space-y-3">
                                                <p className="text-sm text-muted-foreground">
                                                    A photo of Aadhaar (cover the first 8 digits), PAN, voter ID or driving licence.
                                                </p>
                                                <UploadButton label="Upload ID" kind="owner_id" existing={docs.owner_id} onUploaded={refresh} testId="upload-owner-id" />
                                                <UploadButton label="Selfie at your shop (optional)" kind="selfie" existing={docs.selfie} onUploaded={refresh} testId="upload-selfie" />
                                                <p className="text-xs flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                                                    <Lock className="h-3.5 w-3.5" /> Only our team can see these. We never share them.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {canEdit && stage !== 'submitted' && (
                <Card>
                    <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex-1 text-sm">
                            {canSubmit
                                ? 'Everything is filled in. Submit to send your shop to our team.'
                                : `${left} step${left === 1 ? '' : 's'} left before you can submit.`}
                        </div>
                        <Button onClick={submit} disabled={!canSubmit || submitting} data-testid="verification-submit" className="gap-2">
                            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                            {stage === 'needs_changes' ? 'Resubmit' : 'Submit for checking'}
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
