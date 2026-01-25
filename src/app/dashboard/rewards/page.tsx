"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Loader2, Save, Award, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { rewardService } from "@/services/api";

interface RewardConfig {
    is_active: boolean;
    cashback_percentage: string;
    max_reward_usage_percent: string;
    max_reward_usage_flat: string;
    conversion_rate: string;
    is_referral_enabled: boolean;
    referral_reward_points: string;
    referee_reward_points: string;
    min_referral_order_amount: string;
}

export default function RewardsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<RewardConfig>({
        defaultValues: {
            is_active: true,
            is_referral_enabled: false,
        }
    });

    const isActive = watch("is_active");
    const isReferralEnabled = watch("is_referral_enabled");

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const response = await rewardService.getRewardConfig();
            // Convert numbers to strings for inputs
            const data = response.data;
            reset({
                ...data,
                cashback_percentage: data.cashback_percentage?.toString() || "",
                max_reward_usage_percent: data.max_reward_usage_percent?.toString() || "",
                max_reward_usage_flat: data.max_reward_usage_flat?.toString() || "",
                conversion_rate: data.conversion_rate?.toString() || "",
                referral_reward_points: data.referral_reward_points?.toString() || "",
                referee_reward_points: data.referee_reward_points?.toString() || "",
                min_referral_order_amount: data.min_referral_order_amount?.toString() || "",
            });
        } catch (error) {
            console.error("Failed to fetch reward config:", error);
            toast.error("Failed to load reward settings");
        } finally {
            setIsLoading(false);
        }
    };

    const onSubmit = async (data: RewardConfig) => {
        setIsSaving(true);
        try {
            // Convert strings back to numbers for API if needed, but usually APIs accept strings for decimal fields or handle it.
            // Let's ensure we send what typical Django Rest Framework expects (it handles string-decimals fine).
            await rewardService.updateRewardConfig({
                ...data,
                cashback_percentage: parseFloat(data.cashback_percentage) || 0,
                max_reward_usage_percent: parseFloat(data.max_reward_usage_percent) || 0,
                max_reward_usage_flat: parseFloat(data.max_reward_usage_flat) || 0,
                conversion_rate: parseFloat(data.conversion_rate) || 1,
                referral_reward_points: parseFloat(data.referral_reward_points) || 0,
                referee_reward_points: parseFloat(data.referee_reward_points) || 0,
                min_referral_order_amount: parseFloat(data.min_referral_order_amount) || 0,
            });
            toast.success("Reward settings saved successfully");
            fetchConfig(); // Refresh
        } catch (error) {
            console.error("Failed to save reward config:", error);
            toast.error("Failed to save settings");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground">Loading settings...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Reward Settings</h2>
                <p className="text-muted-foreground">
                    Configure your loyalty program and referral rewards.
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                {/* Loyalty Program Section */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Award className="h-5 w-5 text-primary" />
                                <CardTitle>Loyalty Program</CardTitle>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="loyalty-active"
                                    checked={isActive}
                                    onCheckedChange={(checked) => setValue("is_active", checked)}
                                />
                                <Label htmlFor="loyalty-active">
                                    {isActive ? "Enabled" : "Disabled"}
                                </Label>
                            </div>
                        </div>
                        <CardDescription>
                            Reward customers with points for every purchase.
                        </CardDescription>
                    </CardHeader>
                    {isActive && (
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="cashback">Cashback Percentage (%)</Label>
                                    <Input
                                        id="cashback"
                                        type="number"
                                        step="0.01"
                                        placeholder="e.g. 5"
                                        {...register("cashback_percentage", { required: true, min: 0 })}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Percentage of order value given as points.
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="conversion">Conversion Rate (₹ per Point)</Label>
                                    <Input
                                        id="conversion"
                                        type="number"
                                        step="0.01"
                                        placeholder="e.g. 1"
                                        {...register("conversion_rate", { required: true, min: 0.1 })}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Value of 1 reward point in currency.
                                    </p>
                                </div>
                            </div>

                            <Separator />

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="max_usage_percent">Max Usage Percentage (%)</Label>
                                    <Input
                                        id="max_usage_percent"
                                        type="number"
                                        step="0.01"
                                        placeholder="e.g. 50"
                                        {...register("max_reward_usage_percent", { required: true, min: 0, max: 100 })}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Max % of order value payable with points.
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="max_usage_flat">Max Usage Flat Amount (₹)</Label>
                                    <Input
                                        id="max_usage_flat"
                                        type="number"
                                        step="0.1"
                                        placeholder="e.g. 500"
                                        {...register("max_reward_usage_flat", { required: true, min: 0 })}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Max flat amount payable with points per order.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    )}
                </Card>

                {/* Referral Program Section */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-primary" />
                                <CardTitle>Referral Program</CardTitle>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="referral-active"
                                    checked={isReferralEnabled}
                                    onCheckedChange={(checked) => setValue("is_referral_enabled", checked)}
                                />
                                <Label htmlFor="referral-active">
                                    {isReferralEnabled ? "Enabled" : "Disabled"}
                                </Label>
                            </div>
                        </div>
                        <CardDescription>
                            Incentivize customers to refer new users.
                        </CardDescription>
                    </CardHeader>
                    {isReferralEnabled && (
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="referrer_reward">Referrer Reward (Points)</Label>
                                    <Input
                                        id="referrer_reward"
                                        type="number"
                                        placeholder="e.g. 100"
                                        {...register("referral_reward_points", { required: true, min: 0 })}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Points given to the person who refers.
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="referee_reward">Referee Reward (Points)</Label>
                                    <Input
                                        id="referee_reward"
                                        type="number"
                                        placeholder="e.g. 50"
                                        {...register("referee_reward_points", { required: true, min: 0 })}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Points given to the new user joining.
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="min_referral_order">Min Order Amount (₹)</Label>
                                <Input
                                    id="min_referral_order"
                                    type="number"
                                    placeholder="e.g. 200"
                                    {...register("min_referral_order_amount", { required: true, min: 0 })}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Minimum first order value to trigger referral rewards.
                                </p>
                            </div>
                        </CardContent>
                    )}
                </Card>

                <div className="flex justify-end">
                    <Button type="submit" size="lg" disabled={isSaving}>
                        {isSaving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Save Changes
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
