'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/** The site root has no screen of its own: it sends signed-in retailers to the dashboard and everyone else to login. */
export default function Home() {
    const router = useRouter();

    useEffect(() => {
        router.replace(localStorage.getItem('access_token') ? '/dashboard' : '/login');
    }, [router]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
}
