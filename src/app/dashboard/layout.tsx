'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';

function restoreQueryFromSession(pathname: string) {
    if (typeof window === 'undefined') return;
    if (window.location.search) return;
    const key = 'oe:qs:' + pathname.replace(/\/$/, '');
    try {
        const saved = sessionStorage.getItem(key);
        if (saved) {
            // replaceState only — never location.replace here (loop).
            history.replaceState(null, '', pathname + saved);
        }
    } catch (e) {}
}

export default function Layout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);

    // Restore before children render so details can read window.location.search
    // after Next hydrates with RSC "q":"" and wipes the address bar.
    if (typeof window !== 'undefined') {
        const { pathname } = window.location;
        if (pathname.endsWith('/')) {
            restoreQueryFromSession(pathname);
        }
    }

    useEffect(() => {
        const { pathname, search, hash } = window.location;
        // Next trailingSlash client/MPA redirect drops ?id= / ?number=.
        // Canonicalize with a full replace so the query and hash stay.
        // Do not use usePathname() — it strips the trailing slash.
        if (!pathname.endsWith('/')) {
            window.location.replace(pathname + '/' + search + hash);
            return;
        }

        // After slash check: if Next wiped search, restore from the
        // blocking-script snapshot. replaceState — not location.replace.
        restoreQueryFromSession(pathname);

        const token = localStorage.getItem('access_token');
        if (!token) {
            router.push('/login');
        } else {
            setIsAuthorized(true);
        }
    }, [router]);

    if (!isAuthorized) {
        return null; // Or a loading spinner
    }

    return <DashboardLayout>{children}</DashboardLayout>;
}
