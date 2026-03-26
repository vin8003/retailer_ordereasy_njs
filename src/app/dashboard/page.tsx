"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShoppingCart, IndianRupee, Package, Star, TrendingUp, Search } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { authService, productService } from "@/services/api";

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
    const [demandInsights, setDemandInsights] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Auth check is now handled by layout, but good to keep safe incase of direct access issues
        // or we can remove it if layout is reliable. Layout is reliable.
        // Fetch data
        Promise.all([fetchProfile(), fetchStats(), loadDemandInsights()]).finally(() => {
            setIsLoading(false);
        });
    }, []);

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
            const response = await authService.fetchStats();
            setStats(response.data);
        } catch (error: any) {
            console.error("Failed to fetch stats", error);
            const message = `Failed to load stats: ${error.response?.status} ${error.response?.statusText || error.message}`;
            toast.error(message);
            setError(message);
        }
    };

    const loadDemandInsights = async () => {
        try {
            const res = await productService.fetchDemandInsights();
            setDemandInsights(res.data);
        } catch (error) {
            console.error("Failed to load demand insights", error);
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

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Overview</h2>
                <p className="text-muted-foreground">
                    Welcome back, {profile?.shop_name || profile?.username || "Retailer"}!
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Orders"
                    value={stats?.total_orders ?? 0}
                    icon={ShoppingCart}
                    description="All time orders"
                />
                <StatCard
                    title="Total Revenue"
                    value={`₹${Number(stats?.total_revenue || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                    icon={IndianRupee}
                    description="Lifetime revenue"
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
                    description="Average per order"
                />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-1 md:col-span-2 lg:col-span-4">
                    <CardHeader>
                        <CardTitle>Recent Sales</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                            Chart Placeholder
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-1 md:col-span-2 lg:col-span-3 hover:shadow-md transition-shadow">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Search className="h-5 w-5 text-primary" />
                            Unmet Demand
                        </CardTitle>
                        <CardDescription>What customers searched for but couldn't find (Last 30 Days)</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {demandInsights && demandInsights.length > 0 ? (
                            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                                {demandInsights.map((insight: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between border-b border-border/50 pb-2 last:border-0 last:pb-0">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold capitalize">{insight.query}</span>
                                        </div>
                                        <div className="flex items-center text-xs px-2 py-1 bg-muted rounded-full font-medium text-muted-foreground">
                                            {insight.count} searches
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center text-center py-8 text-muted-foreground bg-muted/20 rounded-lg p-6">
                                <Search className="h-8 w-8 mb-2 opacity-20" />
                                <p className="text-sm font-medium">No Unmet Demand!</p>
                                <p className="text-xs mt-1">Customers found everything they searched for recently.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
                <Card className="col-span-1 md:col-span-2 lg:col-span-3">
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
