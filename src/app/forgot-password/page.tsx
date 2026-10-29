"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { authService } from "@/services/api";
import {
    OTP_LENGTH,
    normalizeOtpInput,
    requestCodeSchema,
    resetErrorMessage,
    resetPasswordSchema,
} from "@/lib/passwordReset";

const DEFAULT_RESEND_SECONDS = 60;

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [step, setStep] = useState<"request" | "reset">("request");
    const [identifier, setIdentifier] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [resendAt, setResendAt] = useState(0);
    const [now, setNow] = useState(() => Date.now());

    const requestForm = useForm<z.infer<typeof requestCodeSchema>>({
        resolver: zodResolver(requestCodeSchema),
        defaultValues: { identifier: "" },
    });
    const resetForm = useForm<z.infer<typeof resetPasswordSchema>>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: { otp_code: "", new_password: "", confirm_password: "" },
    });

    const secondsLeft = Math.max(0, Math.ceil((resendAt - now) / 1000));

    function startCooldown(seconds: number) {
        const end = Date.now() + seconds * 1000;
        setResendAt(end);
        setNow(Date.now());
        const timer = setInterval(() => {
            setNow(Date.now());
            if (Date.now() >= end) clearInterval(timer);
        }, 1000);
    }

    async function sendCode(value: string) {
        setIsLoading(true);
        try {
            const response = await authService.forgotPassword(value);
            setIdentifier(value);
            setStep("reset");
            startCooldown(response.data?.resend_after ?? DEFAULT_RESEND_SECONDS);
            // The server answers the same whether or not an account matched.
            toast.success(response.data?.message || "If an account matches, we have sent you a code.");
        } catch (error) {
            toast.error(resetErrorMessage(error, "Could not send the code. Please try again."));
        } finally {
            setIsLoading(false);
        }
    }

    async function onResetSubmit(values: z.infer<typeof resetPasswordSchema>) {
        setIsLoading(true);
        try {
            await authService.resetPassword({ identifier, ...values });
            toast.success("Password reset. Please login with your new password.");
            router.push("/login");
        } catch (error) {
            toast.error(resetErrorMessage(error, "Could not reset your password. Please try again."));
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
            <Card className="w-full max-w-md shadow-2xl border-primary/10">
                <CardHeader className="space-y-4 relative flex flex-col items-center pt-8">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute left-0 top-0 mt-4 ml-4"
                        aria-label="Back"
                        onClick={() => (step === "reset" ? setStep("request") : router.back())}
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <Image
                        src="/logo.png"
                        alt="Order Easy Retailer Logo"
                        width={260}
                        height={80}
                        className="h-20 w-auto object-contain"
                        priority
                    />
                    <CardDescription className="text-center">
                        {step === "request"
                            ? "Enter your username, phone number or email and we will send you a code"
                            : "Enter the code we sent and choose a new password"}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {step === "request" ? (
                        <Form {...requestForm}>
                            <form
                                onSubmit={requestForm.handleSubmit((v) => sendCode(v.identifier.trim()))}
                                className="space-y-4"
                            >
                                <FormField
                                    control={requestForm.control}
                                    name="identifier"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Username, phone or email</FormLabel>
                                            <FormControl>
                                                <Input data-testid="forgot-identifier" placeholder="Enter your username, phone or email" autoComplete="username" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button data-testid="forgot-send" type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        "Send code"
                                    )}
                                </Button>
                            </form>
                        </Form>
                    ) : (
                        <Form {...resetForm}>
                            <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="space-y-4">
                                <FormField
                                    control={resetForm.control}
                                    name="otp_code"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Code</FormLabel>
                                            <FormControl>
                                                <Input
                                                    data-testid="reset-code"
                                                    inputMode="numeric"
                                                    autoComplete="one-time-code"
                                                    maxLength={OTP_LENGTH}
                                                    placeholder={`${OTP_LENGTH}-digit code`}
                                                    {...field}
                                                    onChange={(e) => field.onChange(normalizeOtpInput(e.target.value))}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                If an account matches, the code went to its registered phone number.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={resetForm.control}
                                    name="new_password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>New password</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input
                                                        type={showPassword ? "text" : "password"}
                                                        autoComplete="new-password"
                                                        data-testid="reset-new-password"
                                                        placeholder="Enter a new password"
                                                        {...field}
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                    >
                                                        {showPassword ? (
                                                            <EyeOff className="h-4 w-4 text-gray-500" />
                                                        ) : (
                                                            <Eye className="h-4 w-4 text-gray-500" />
                                                        )}
                                                    </Button>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={resetForm.control}
                                    name="confirm_password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Confirm new password</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type={showPassword ? "text" : "password"}
                                                    autoComplete="new-password"
                                                    data-testid="reset-confirm-password"
                                                    placeholder="Re-enter the new password"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button data-testid="reset-submit" type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Resetting...
                                        </>
                                    ) : (
                                        "Reset password"
                                    )}
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="w-full"
                                    disabled={isLoading || secondsLeft > 0}
                                    onClick={() => sendCode(identifier)}
                                >
                                    {secondsLeft > 0 ? `Resend code in ${secondsLeft}s` : "Resend code"}
                                </Button>
                            </form>
                        </Form>
                    )}
                    <div className="mt-4 text-center text-sm">
                        <Link href="/login" className="text-blue-600 hover:underline">
                            Back to login
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
