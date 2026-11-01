'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { authService, verificationService, VERIFICATION_CHANGED_EVENT } from '@/services/api';
import VerificationStatusCard from '@/components/verification/VerificationStatusCard';
import type { VerificationData } from '@/components/verification/verificationModel';

/**
 * Dashboard status card for shops that are not live yet (or were paused).
 * Approved shops see nothing. The checklist page shows its own card.
 */
export default function VerificationAlertBanner() {
    const pathname = usePathname();
    const [data, setData] = useState<VerificationData | null>(null);

    useEffect(() => {
        let isMounted = true;
        const load = async () => {
            try {
                // The cached profile tells us cheaply whether the shop is already approved.
                const profile = await authService.fetchProfile();
                if (!isMounted) return;
                if (profile.data?.verification_status === 'approved') {
                    setData(null);
                    return;
                }
                const res = await verificationService.fetchStatus();
                if (isMounted) setData(res.data);
            } catch (err) {
                console.error('Failed to load verification status', err);
            }
        };
        load();
        window.addEventListener(VERIFICATION_CHANGED_EVENT, load);
        return () => {
            isMounted = false;
            window.removeEventListener(VERIFICATION_CHANGED_EVENT, load);
        };
    }, []);

    if (!data || data.verification_status === 'approved') return null;
    if (pathname?.startsWith('/dashboard/verification')) return null;
    return <VerificationStatusCard data={data} />;
}
