'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function Layout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            router.push('/login');
            return;
        }
        setIsAuthorized(true);

        // Head IIFE already slash-canonicalizes. Do not location.replace here:
        // if Next wiped search first, a slash-replace hard-navs to the empty URL.
        // history.replaceState restore is ACTION_RESTORE → MPA location.replace(empty).
        // Re-sync via Next router so canonicalUrl keeps the query. Profile (no oe:qs) no-op.
        const { pathname, search } = window.location;
        if (search) return;
        const key = 'oe:qs:' + pathname.replace(/\/$/, '');
        let saved = '';
        try { saved = sessionStorage.getItem(key) || ''; } catch (e) {}
        if (saved) {
            router.replace(pathname + saved);
        }
    }, [router]);

    if (!isAuthorized) {
        return null; // Or a loading spinner
    }

    return <DashboardLayout>{children}</DashboardLayout>;
}
