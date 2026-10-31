import Link from 'next/link';
import { AlertCircle, CheckCircle2, Clock, PauseCircle, Send, XCircle } from 'lucide-react';
import { deriveStage, stepsDone, type VerificationData } from './verificationModel';

interface Props {
    data: Pick<VerificationData, 'verification_status' | 'submitted_at' | 'ready' | 'reason' | 'steps'>;
    /** Hide the "open checklist" button when already on the checklist page. */
    showLink?: boolean;
}

const tone = {
    amber: 'border-amber-200 bg-amber-50/90 text-amber-950 dark:bg-amber-950/30 dark:border-amber-800/60 dark:text-amber-200',
    red: 'border-red-200 bg-red-50 text-red-900 dark:bg-red-950/40 dark:border-red-900/60 dark:text-red-200',
    green: 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/30 dark:border-emerald-900/60 dark:text-emerald-200',
    blue: 'border-sky-200 bg-sky-50 text-sky-950 dark:bg-sky-950/30 dark:border-sky-900/60 dark:text-sky-200',
};

/** One status card for every verification state. Pure: safe to render on the server in tests. */
export default function VerificationStatusCard({ data, showLink = true }: Props) {
    const stage = deriveStage(data);
    const total = data.steps?.length || 5;
    const done = stepsDone(data.steps);

    let cls = tone.amber;
    let Icon = Clock;
    let title = '';
    let body: React.ReactNode = null;
    let cta: string | null = null;

    switch (stage) {
        case 'incomplete':
            title = 'दुकान लाइव करने के लिए स्टेप पूरे करें / Finish your steps to go live';
            body = `${done} of ${total} steps done. You can add products and bill customers in the POS meanwhile. Customers will see your shop after approval.`;
            cta = 'Continue verification';
            Icon = AlertCircle;
            break;
        case 'ready':
            title = 'सब तैयार है / Ready to submit';
            body = 'All steps are done. Submit your shop so our team can check it.';
            cta = 'Review and submit';
            cls = tone.blue;
            Icon = Send;
            break;
        case 'submitted':
            title = 'वेरिफिकेशन प्रक्रियाधीन / Being checked';
            body = 'We usually reply within 24 hours. You can add products and bill customers meanwhile.';
            cta = 'View checklist';
            break;
        case 'needs_changes':
            title = 'कृपया बदलाव करें / Please fix and resubmit';
            body = data.reason || 'Our team asked for a change.';
            cta = 'Fix now';
            cls = tone.red;
            Icon = AlertCircle;
            break;
        case 'suspended':
            title = 'दुकान रोकी गई / Shop paused';
            body = (
                <>
                    Customers cannot see your shop right now.
                    {data.reason && <span className="block mt-1 font-medium">Reason: {data.reason}</span>}
                    <span className="block mt-1">Finish open orders. Contact support to appeal.</span>
                </>
            );
            cls = tone.red;
            Icon = PauseCircle;
            break;
        case 'rejected':
            title = 'वेरिफिकेशन अस्वीकृत / Verification rejected';
            body = data.reason || 'Your shop was not approved.';
            cls = tone.red;
            Icon = XCircle;
            break;
        case 'approved':
            title = 'आपकी दुकान लाइव है / Your shop is live';
            body = 'Customers near you can see your shop and order.';
            cls = tone.green;
            Icon = CheckCircle2;
            break;
    }

    return (
        <div
            data-testid="verification-banner"
            data-status={data.verification_status}
            data-stage={stage}
            className={`mb-6 rounded-xl border p-4 shadow-sm ${cls}`}
        >
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-start gap-3 flex-1">
                    <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div className="space-y-1 text-sm">
                        <h4 className="font-semibold">{title}</h4>
                        <div className="leading-relaxed">{body}</div>
                        {stage === 'incomplete' && (
                            <div className="mt-2 h-1.5 w-full max-w-xs rounded-full bg-black/10 dark:bg-white/10" aria-hidden>
                                <div className="h-full rounded-full bg-emerald-600" style={{ width: `${(done / total) * 100}%` }} />
                            </div>
                        )}
                    </div>
                </div>
                {showLink && cta && (
                    <Link
                        href="/dashboard/verification"
                        data-testid="verification-banner-cta"
                        className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 shrink-0"
                    >
                        {cta}
                    </Link>
                )}
            </div>
        </div>
    );
}
