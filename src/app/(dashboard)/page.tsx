"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShoppingCart, IndianRupee, Package, Star, TrendingUp } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authService } from "@/services/api";

interface DashboardStats {
    total_orders: number;
    total_revenue: number;
    total_products: number;
    average_rating: number;
    average_order_value: number;
    recent_reviews?: any[];
}

export default function DashboardPage() {
    const router = useRouter();
    const [profile, setProfile] = useState<any>(null);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [timeRange, setTimeRange] = useState("all_time");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    useEffect(() => {
        // Fetch profile only once
        fetchProfile();
    }, []);

    useEffect(() => {
        if (timeRange === 'custom' && (!startDate || !endDate)) {
            return;
        }
        setIsLoading(true);
        fetchStats().finally(() => {
            setIsLoading(false);
        });
    }, [timeRange, startDate, endDate]);

    const fetchProfile = async () => {
        try {
            const response = await authService.fetchProfile();
            setProfile(response.data);
        } catch (error) {
            console.error("Failed to fetch profile", error);
        }
    };

    const fetchStats = async () => {
        try {
            const params: any = {};
            if (timeRange !== 'all_time') {
                params.time_range = timeRange;
            }
            if (timeRange === 'custom') {
                params.start_date = startDate;
                params.end_date = endDate;
            }
            const response = await authService.fetchStats(params);
            setStats(response.data);
        } catch (error: any) {
            console.error("Failed to fetch stats", error);
            const message = `Failed to load stats: ${error.response?.status} ${error.response?.statusText || error.message}`;
            toast.error(message);
            setError(message);
        }
    };

    if (isLoading) {
        return (
            <div className="flex bg-gray-50 dark:bg-gray-900 h-full w-full items-center justify-center min-h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
                <div className="text-red-500 font-medium">{error}</div>
                <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
                >
                    Retry
                </button>
            </div>
        );
    }

    const timeLabel = timeRange === 'today' ? "Today" :
                      timeRange === 'this_week' ? "This Week" :
                      timeRange === 'this_month' ? "This Month" :
                      timeRange === 'custom' ? "Custom Range" : "All Time";

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Overview</h2>
                    <p className="text-muted-foreground">
                        Welcome back, {profile?.shop_name || profile?.username || "Retailer"}!
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2">
                    <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                        className="p-2 border rounded-md bg-background text-sm"
                    >
                        <option value="all_time">All Time</option>
                        <option value="today">Today</option>
                        <option value="this_week">This Week</option>
                        <option value="this_month">This Month</option>
                        <option value="custom">Custom Range</option>
                    </select>

                    {timeRange === 'custom' && (
                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="p-2 border rounded-md bg-background text-sm"
                            />
                            <span className="text-muted-foreground">to</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="p-2 border rounded-md bg-background text-sm"
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Orders"
                    value={stats?.total_orders ?? 0}
                    icon={ShoppingCart}
                    description={`${timeLabel} orders`}
                />
                <StatCard
                    title="Total Revenue"
                    value={`₹${Number(stats?.total_revenue || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                    icon={IndianRupee}
                    description={`${timeLabel} revenue`}
                />
                <StatCard
                    title="Total Products"
                    value={stats?.total_products ?? 0}
                    icon={Package}
                    description="Active products"
                />
                <StatCard
                    title="Avg Order Value"
                    value={`₹${Number(stats?.average_order_value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                    icon={TrendingUp}
                    description={`Average per order (${timeLabel})`}
                />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Recent Sales</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                            Chart Placeholder
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Recent Reviews</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {stats?.recent_reviews && stats.recent_reviews.length > 0 ? (
                            <div className="space-y-4">
                                {stats.recent_reviews.map((review: any, i: number) => (
                                    <div key={i} className="flex items-start gap-4">
                                        <div className="bg-primary/10 p-2 rounded-full">
                                            <span className="font-bold text-primary">{review.rating}</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">{review.customer_name || 'Customer'}</p>
                                            <p className="text-xs text-muted-foreground line-clamp-2">{review.comment}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-sm text-muted-foreground text-center py-8">
                                No recent reviews
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, description }: any) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-muted-foreground">{description}</p>
            </CardContent>
        </Card>
    );
}
