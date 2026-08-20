'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function Layout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        const { pathname, search, hash } = window.location;
        // Next trailingSlash client/MPA redirect drops ?id= / ?number=.
        // Canonicalize with a full replace so the query and hash stay.
        // Do not use usePathname() — it strips the trailing slash.
        if (!pathname.endsWith('/')) {
            window.location.replace(pathname + '/' + search + hash);
            return;
        }

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
