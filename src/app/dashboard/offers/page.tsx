'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
    Plus, Search, Tag, Calendar, Percent, ShoppingBag, LayoutGrid,
    Loader2, Save, Award, Users, Settings
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";

import { rewardService, offerService } from "@/services/api";

// --- Types ---

interface Offer {
    id: number;
    name: string;
    offer_type: 'bxgy' | 'percentage' | 'flat_amount' | 'cart_value' | 'tiered_price' | 'flat_price';
    benefit_type?: 'discount' | 'credit_points';
    value: number;
    value_type: 'percent' | 'amount';
    start_date: string;
    end_date: string | null;
    is_active: boolean;
    current_redemptions: number;
}

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

export default function OffersPage() {
    // --- Offers State ---
    const [offers, setOffers] = useState<Offer[]>([]);
    const [isLoadingOffers, setIsLoadingOffers] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // --- Rewards Config State ---
    const [isSavingConfig, setIsSavingConfig] = useState(false);
    const [isLoadingConfig, setIsLoadingConfig] = useState(true);

    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors }
    } = useForm<RewardConfig>({
        defaultValues: {
            is_active: true,
            is_referral_enabled: false,
        }
    });

    const isLoyaltyActive = watch("is_active");
    const isReferralEnabled = watch("is_referral_enabled");

    // --- Effects ---
    useEffect(() => {
        fetchOffers();
        fetchConfig();
    }, []);

    // --- Fetch Logic ---

    const fetchOffers = async () => {
        setIsLoadingOffers(true);
        try {
            const response = await offerService.fetchOffers();
            const data = response.data;
            setOffers(data.results || data);
        } catch (error) {
            console.error('Failed to fetch offers:', error);
        } finally {
            setIsLoadingOffers(false);
        }
    };

    const fetchConfig = async () => {
        try {
            const response = await rewardService.getRewardConfig();
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
            // toast.error("Failed to load settings"); // silent fail or retry is better sometimes
        } finally {
            setIsLoadingConfig(false);
        }
    };

    // --- Handlers ---

    const onSubmitConfig = async (data: RewardConfig) => {
        setIsSavingConfig(true);
        try {
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
            toast.success("Settings saved successfully");
            fetchConfig();
        } catch (error) {
            console.error("Failed to save reward config:", error);
            toast.error("Failed to save settings");
        } finally {
            setIsSavingConfig(false);
        }
    };

    const getOfferIcon = (type: string) => {
        switch (type) {
            case 'bxgy': return <ShoppingBag className="w-5 h-5 text-blue-500" />;
            case 'percentage': return <Percent className="w-5 h-5 text-green-500" />;
            case 'flat_amount': return <Tag className="w-5 h-5 text-orange-500" />;
            case 'cart_value': return <LayoutGrid className="w-5 h-5 text-purple-500" />;
            default: return <Tag className="w-5 h-5 text-gray-500" />;
        }
    };

    const formatOfferType = (type: string) => {
        return type.replace('_', ' ').toUpperCase();
    };

    const filteredOffers = offers.filter(offer =>
        offer.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // --- Render ---

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Offers & Promotions</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your discounts, cashback offers, and loyalty settings.
                    </p>
                </div>
            </div>

            <Tabs defaultValue="offers" className="w-full animate-in fade-in duration-500">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                    <TabsTrigger value="offers">All Offers</TabsTrigger>
                    <TabsTrigger value="configuration">Settings</TabsTrigger>
                </TabsList>

                {/* --- Tab: All Offers --- */}
                <TabsContent value="offers" className="space-y-6 mt-6">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2 bg-card p-2 rounded-lg border w-full max-w-sm">
                            <Search className="w-5 h-5 text-muted-foreground" />
                            <Input
                                placeholder="Search offers..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="border-0 focus-visible:ring-0"
                            />
                        </div>
                        <Link href="/dashboard/offers/new">
                            <Button className="gap-2">
                                <Plus size={16} />
                                Create Offer
                            </Button>
                        </Link>
                    </div>

                    {isLoadingOffers ? (
                        <div className="text-center py-10">Loading offers...</div>
                    ) : filteredOffers.length === 0 ? (
                        <div className="text-center py-20 bg-muted/20 rounded-lg border border-dashed">
                            <Tag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-medium">No offers found</h3>
                            <p className="text-muted-foreground mb-4">Create your first promotion to attract customers.</p>
                            <Link href="/dashboard/offers/new">
                                <Button variant="outline">Create Offer</Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {filteredOffers.map((offer) => (
                                <Link
                                    key={offer.id}
                                    href={`/dashboard/offers/edit?id=${offer.id}`}
                                    className="bg-card hover:bg-muted/50 transition-colors rounded-lg border p-4 group"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-primary/10 rounded-full">
                                                {getOfferIcon(offer.offer_type)}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold group-hover:text-primary transition-colors">
                                                    {offer.name}
                                                </h3>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatOfferType(offer.offer_type)}
                                                    {offer.benefit_type === 'credit_points' && <span className="text-amber-600 font-medium ml-1"> • Cashback</span>}
                                                </p>
                                            </div>
                                        </div>
                                        <Badge variant={offer.is_active ? "default" : "secondary"}>
                                            {offer.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </div>

                                    <div className="space-y-2 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            <span>
                                                {new Date(offer.start_date).toLocaleDateString()}
                                                {offer.end_date ? ` - ${new Date(offer.end_date).toLocaleDateString()}` : ' (No End Date)'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Tag className="w-4 h-4" />
                                            <span>
                                                Redemptions: {offer.current_redemptions}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* --- Tab: Configuration --- */}
                <TabsContent value="configuration" className="mt-6">
                    {isLoadingConfig ? (
                        <div className="p-8 text-center text-muted-foreground">Loading settings...</div>
                    ) : (
                        <form onSubmit={handleSubmit(onSubmitConfig)} className="space-y-6 max-w-4xl">
                            {/* Loyalty Program Section */}
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Award className="h-5 w-5 text-primary" />
                                            <CardTitle>Loyalty Program Rules</CardTitle>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Switch
                                                id="loyalty-active"
                                                checked={isLoyaltyActive}
                                                onCheckedChange={(checked) => setValue("is_active", checked)}
                                            />
                                            <Label htmlFor="loyalty-active">
                                                {isLoyaltyActive ? "Enabled" : "Disabled"}
                                            </Label>
                                        </div>
                                    </div>
                                    <CardDescription>
                                        Define how points are redeemed and converted.
                                    </CardDescription>
                                </CardHeader>
                                {isLoyaltyActive && (
                                    <CardContent className="space-y-4">
                                        <div className="bg-muted p-4 rounded-md border text-sm text-muted-foreground mb-4 flex gap-3">
                                            <Settings className="w-5 h-5 mt-0.5 shrink-0" />
                                            <div>
                                                <p className="font-semibold text-foreground">Points Earning Config</p>
                                                <p className="mt-1">
                                                    To award points (Cashback), please create a new <strong>Cashback Offer</strong> in the "All Offers" tab.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid gap-4 md:grid-cols-2">
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

                            <div className="flex justify-start">
                                <Button type="submit" size="lg" disabled={isSavingConfig}>
                                    {isSavingConfig ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-4 w-4" />
                                            Save Settings
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
