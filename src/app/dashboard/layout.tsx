'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function Layout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        // Static export has no Next server 308. trailingSlash pages live at
        // /dashboard/profile/. A typed / hard-refresh URL without the slash
        // does not match that tree; the App Router then MPA-replaces
        // (location.replace) to a prefetched sibling — QA landed on
        // /dashboard/orders. Read window.location (usePathname may strip
        // the slash) and canonicalize before auth so Profile stays.
        const { pathname: locPath, search, hash } = window.location;
        if (locPath.startsWith('/dashboard') && !locPath.endsWith('/')) {
            router.replace(`${locPath}/${search}${hash}`);
            return;
        }

        const token = localStorage.getItem('access_token');
        if (!token) {
            router.push('/login');
        } else {
            setIsAuthorized(true);
        }
    }, [router, pathname]);

    if (!isAuthorized) {
        return null; // Or a loading spinner
    }

    return <DashboardLayout>{children}</DashboardLayout>;
}
