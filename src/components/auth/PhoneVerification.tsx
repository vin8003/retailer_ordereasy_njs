'use client';

import React, { useState, useEffect } from 'react';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { auth } from '@/services/firebase';
import { authService } from '@/services/api'; // Using authService
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Loader2, CheckCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface PhoneVerificationProps {
    isOpen: boolean;
    onClose: () => void;
    onVerified: () => void;
    initialPhone?: string;
}

export default function PhoneVerification({ isOpen, onClose, onVerified, initialPhone = '' }: PhoneVerificationProps) {
    const [step, setStep] = useState<'request' | 'verify'>('request');
    const [phone, setPhone] = useState(initialPhone);
    const [otp, setOtp] = useState('');
    const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setStep('request');
            setLoading(false);
            setOtp('');
            if (initialPhone) setPhone(initialPhone);
        }
    }, [isOpen, initialPhone]);

    useEffect(() => {
        if (!isOpen) return;

        // Short delay to ensure dialog content is rendered before attaching recaptcha
        const timer = setTimeout(() => {
            try {
                if (!window.recaptchaVerifier) {
                    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                        'size': 'normal',
                        'callback': () => {
                            // solved
                        },
                        'expired-callback': () => {
                            toast.error("Recaptcha expired");
                        }
                    });
                    window.recaptchaVerifier.render();
                }
            } catch (e) {
                console.error("Recaptcha init error:", e);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [isOpen]);

    const handleSendOtp = async () => {
        if (!phone || phone.length < 10) {
            toast.error('Please enter a valid phone number');
            return;
        }

        setLoading(true);
        try {
            const formattedPhone = phone.startsWith('+91') ? phone : `+91${phone}`;
            const appVerifier = window.recaptchaVerifier;

            const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
            setConfirmationResult(confirmation);
            setStep('verify');
            toast.success("OTP sent to " + formattedPhone);
        } catch (err: any) {
            console.error("Error sending OTP:", err);
            toast.error(err.message || 'Failed to send OTP');
            if (window.recaptchaVerifier) window.recaptchaVerifier.clear();
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp || otp.length < 6) {
            toast.error('Enter 6-digit OTP');
            return;
        }

        setLoading(true);
        try {
            if (!confirmationResult) throw new Error("Session expired");

            const result = await confirmationResult.confirm(otp);
            const user = result.user;
            const token = await user.getIdToken();

            // Send to backend
            await authService.verifyPhoneWithFirebase(phone, token);

            toast.success("Phone verified successfully!");
            onVerified();
            onClose();

        } catch (err: any) {
            console.error("Error verifying OTP:", err);
            toast.error('Invalid OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Verify Phone Number</DialogTitle>
                    <DialogDescription>
                        Complete verification to enable all features.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {step === 'request' ? (
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-gray-500">+91</span>
                                <Input
                                    value={phone.replace('+91', '')}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="Mobile Number"
                                    disabled={loading} // or !!initialPhone
                                />
                            </div>

                            <div id="recaptcha-container" className="mx-auto" />

                            <Button onClick={handleSendOtp} disabled={loading} className="w-full">
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Send OTP'}
                            </Button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            <div className="space-y-2">
                                <p className="text-sm text-center text-muted-foreground">
                                    Enter code sent to <b>{phone}</b>
                                </p>
                                <Input
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    placeholder="000000"
                                    className="text-center text-lg tracking-widest"
                                    maxLength={6}
                                />
                            </div>

                            <Button onClick={handleVerifyOtp} disabled={loading} className="w-full">
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Verify Code'}
                            </Button>

                            <Button variant="ghost" size="sm" onClick={() => setStep('request')} className="text-xs">
                                <RefreshCw className="mr-1 h-3 w-3" /> Change Number / Resend
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

declare global {
    interface Window {
        recaptchaVerifier: any;
    }
}
