'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Clock, XCircle } from 'lucide-react';
import { authService } from '@/services/api';

interface ProfileData {
  is_verified?: boolean;
  verification_status?: string;
  rejection_reason?: string;
}

export default function VerificationAlertBanner() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchStatus = async () => {
      try {
        const res = await authService.fetchProfile();
        if (isMounted && res.data) {
          setProfile(res.data);
        }
      } catch (err) {
        console.error('Failed to load profile for verification status', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchStatus();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading || !profile) return null;

  const isApproved = profile.is_verified === true || profile.verification_status === 'approved';
  if (isApproved) return null;

  const isRejected = profile.verification_status === 'rejected';

  if (isRejected) {
    return (
      <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm text-red-900 dark:bg-red-950/40 dark:border-red-900/60 dark:text-red-200">
        <div className="flex items-start gap-3">
          <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
          <div className="space-y-1 text-sm">
            <h4 className="font-semibold text-red-800 dark:text-red-300">
              वेरिफिकेशन अस्वीकृत / Verification Rejected
            </h4>
            <p className="leading-relaxed">
              आपकी प्रोफाइल वेरिफिकेशन को अस्वीकार कर दिया गया है।
              {profile.rejection_reason && (
                <span className="block mt-1 font-medium bg-red-100/70 dark:bg-red-900/40 px-2 py-1 rounded">
                  कारण / Reason: {profile.rejection_reason}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Pending verification banner (User's approved text)
  return (
    <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50/90 p-4 shadow-sm text-amber-950 dark:bg-amber-950/30 dark:border-amber-800/60 dark:text-amber-200">
      <div className="flex items-start gap-3">
        <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0 animate-pulse" />
        <div className="space-y-1.5 text-sm">
          <div className="font-semibold text-amber-900 dark:text-amber-300 flex items-center gap-2">
            <span>वेरिफिकेशन प्रक्रियाधीन / Verification Pending</span>
          </div>
          <p className="text-amber-900/90 dark:text-amber-200/90 leading-relaxed font-medium">
            अपनी दुकान की जानकारी भरें और अपने प्रोडक्ट्स सेटअप करें। आपकी प्रोफाइल का वेरिफिकेशन अभी लंबित है। एडमिन से अप्रूवल मिलने के बाद ही आपकी दुकान ग्राहकों को लाइव दिखाई देगी।
          </p>
          <p className="text-xs text-amber-800/80 dark:text-amber-300/80 italic">
            Fill in your store details and set up your products. Your profile verification is currently pending. Your store will be visible to customers only after approval by the admin.
          </p>
        </div>
      </div>
    </div>
  );
}
