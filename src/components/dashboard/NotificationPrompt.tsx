'use client';

import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { usePushPermission } from '@/hooks/useNotifications';

const DISMISSED_KEY = 'oe:notification-prompt-dismissed';

/** Asks for notification permission from a tap, the only way browsers allow it. */
export default function NotificationPrompt() {
    const { permission, enable } = usePushPermission();
    const [dismissed, setDismissed] = useState(true);

    useEffect(() => {
        try {
            setDismissed(localStorage.getItem(DISMISSED_KEY) === '1');
        } catch {
            setDismissed(false);
        }
    }, []);

    if (permission !== 'default' || dismissed) return null;

    const dismiss = () => {
        setDismissed(true);
        try {
            localStorage.setItem(DISMISSED_KEY, '1');
        } catch {
            // The prompt just comes back next time.
        }
    };

    return (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3">
            <Bell className="h-5 w-5 shrink-0 text-primary" />
            <p className="flex-1 text-sm text-foreground">Get an alert when a new order arrives.</p>
            <button onClick={enable} className="rounded-lg bg-primary px-3 py-2 text-sm font-bold text-primary-foreground">
                Turn on
            </button>
            <button onClick={dismiss} className="px-2 py-2 text-xs text-muted-foreground" aria-label="Not now">
                Not now
            </button>
        </div>
    );
}
