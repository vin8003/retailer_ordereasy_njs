'use client';

import { useEffect, useState } from 'react';
import { authService } from '@/services/api';

/** Platform-admin flag: the cached profile first (no flicker), then the server's answer. */
export function useIsAdmin(): boolean {
    const [isAdmin, setIsAdmin] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            try {
                const saved = localStorage.getItem('user_profile');
                if (saved) return Boolean(JSON.parse(saved).is_admin);
            } catch {
                /* ignore a broken cache */
            }
        }
        return false;
    });

    useEffect(() => {
        authService
            .fetchAuthProfile()
            .then((res) => {
                if (res.data && typeof res.data.is_admin === 'boolean') {
                    setIsAdmin(res.data.is_admin);
                    try {
                        const saved = localStorage.getItem('user_profile');
                        const current = saved ? JSON.parse(saved) : {};
                        localStorage.setItem('user_profile', JSON.stringify({ ...current, ...res.data }));
                    } catch {
                        /* ignore */
                    }
                }
            })
            .catch(() => {});
    }, []);

    return isAdmin;
}

/** Admin-only navigation entries, shared by the sidebar and the mobile menu. */
export const ADMIN_NAV = [
    { label: 'Admin Panel', href: '/dashboard/admin/verifications' },
    { label: 'Reports & Products', href: '/dashboard/admin/moderation' },
] as const;
