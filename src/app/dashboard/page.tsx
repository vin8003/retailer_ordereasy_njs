"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
    Search, ShoppingCart, User, Plus, Package, 
    ArrowUpRight, TrendingUp, Users, ShoppingBag, 
    Loader2, IndianRupee, Star, Banknote, Smartphone,
    MonitorIcon, Globe
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
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
    recent_orders?: any[];
    cash_sales: number;
    digital_sales: number;
    pos_sales: number;
    online_sales: number;
}

export default function DashboardPage() {
    const router = useRouter();
    const [profile, setProfile] = useState<any>(null);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [demandInsights, setDemandInsights] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [timeRange, setTimeRange] = useState("all_time");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    useEffect(() => {
        // Fetch profile and demand insights only once
        Promise.all([fetchProfile(), loadDemandInsights()]);
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

    const timeLabel = timeRange === 'today' ? "Today" :
                      timeRange === 'this_week' ? "This Week" :
                      timeRange === 'this_month' ? "This Month" :
                      timeRange === 'custom' ? "Custom Range" : "All Time";

    return (
        <div className="space-y-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">Overview</h2>
                    <p className="text-muted-foreground mt-1 text-sm sm:text-lg">
                        Welcome back, <span className="text-primary font-semibold">{profile?.shop_name || profile?.username || "Retailer"}</span>! 
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                        className="p-2 sm:p-2.5 border border-border bg-white rounded-xl text-xs sm:text-sm font-medium shadow-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    >
                        <option value="all_time">All Time</option>
                        <option value="today">Today</option>
                        <option value="this_week">This Week</option>
                        <option value="this_month">This Month</option>
                        <option value="custom">Custom Range</option>
                    </select>

                    {timeRange === 'custom' && (
                        <div className="flex flex-col sm:flex-row items-center gap-1.5 bg-white p-1.5 rounded-xl border border-border shadow-sm w-full sm:w-auto">
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="p-1 bg-transparent text-xs sm:text-sm outline-none px-2 w-full sm:w-auto text-center sm:text-left font-medium"
                            />
                            <span className="text-muted-foreground text-[10px] font-black uppercase sm:px-1">to</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="p-1 bg-transparent text-xs sm:text-sm outline-none px-2 w-full sm:w-auto text-center sm:text-left font-medium"
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Orders"
                    value={stats?.total_orders ?? 0}
                    icon={ShoppingCart}
                    description={`${timeLabel} orders`}
                    color="bg-emerald-500"
                />
                <StatCard
                    title="Total Revenue"
                    value={`₹${Number(stats?.total_revenue || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                    icon={IndianRupee}
                    description={`${timeLabel} revenue`}
                    color="bg-blue-500"
                />
                <StatCard
                    title="Total Products"
                    value={stats?.total_products ?? 0}
                    icon={Package}
                    description="Active products"
                    color="bg-orange-500"
                />
                <StatCard
                    title="Avg Order Value"
                    value={`₹${Number(stats?.average_order_value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                    icon={TrendingUp}
                    description={`Average per order (${timeLabel})`}
                    color="bg-purple-500"
                />
            </div>

            <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
                {/* Payment Breakdown */}
                <Card className="border-none shadow-sm overflow-hidden bg-white dark:bg-gray-800">
                    <CardHeader className="pb-2 border-b border-border/50 bg-muted/10 p-4 sm:p-6">
                        <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
                            <Banknote className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500" />
                            Payment Breakdown
                        </CardTitle>
                        <CardDescription className="text-xs">Cash vs Digital split ({timeLabel})</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
                        <div className="space-y-4 sm:space-y-6">
                            <div className="flex justify-between items-end">
                                <div className="space-y-0.5">
                                    <p className="text-[10px] sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">Cash in Hand</p>
                                    <p className="text-xl sm:text-3xl font-black">₹{stats?.cash_sales?.toLocaleString() || 0}</p>
                                </div>
                                <div className="text-right space-y-0.5">
                                    <p className="text-[10px] sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">Digital</p>
                                    <p className="text-xl sm:text-3xl font-black">₹{stats?.digital_sales?.toLocaleString() || 0}</p>
                                </div>
                            </div>
                            
                            <div className="relative h-3 sm:h-4 w-full bg-blue-100 dark:bg-blue-900/30 rounded-full overflow-hidden flex">
                                <div 
                                    className="h-full bg-emerald-500 transition-all duration-1000 ease-out"
                                    style={{ 
                                        width: `${stats && stats.total_revenue > 0 ? (stats.cash_sales / stats.total_revenue) * 100 : 50}%` 
                                    }}
                                />
                                <div className="h-full bg-blue-500 flex-1 transition-all duration-1000 ease-out" />
                            </div>
                            
                            <div className="flex justify-between text-[8px] sm:text-[10px] font-bold uppercase tracking-widest">
                                <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                    <div className="size-1.5 sm:size-2 rounded-full bg-emerald-500" />
                                    {stats && stats.total_revenue > 0 ? ((stats.cash_sales / stats.total_revenue) * 100).toFixed(0) : 0}% Cash
                                </div>
                                <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                                    {stats && stats.total_revenue > 0 ? ((stats.digital_sales / stats.total_revenue) * 100).toFixed(0) : 0}% Digital
                                    <div className="size-1.5 sm:size-2 rounded-full bg-blue-500" />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Channel Performance */}
                <Card className="border-none shadow-sm overflow-hidden bg-white dark:bg-gray-800">
                    <CardHeader className="pb-2 border-b border-border/50 bg-muted/10 p-4 sm:p-6">
                        <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                            Channel Performance
                        </CardTitle>
                        <CardDescription className="text-xs">POS vs Online Store ({timeLabel})</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                            <div className="p-3 sm:p-4 rounded-2xl sm:rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center">
                                <div className="p-1.5 sm:p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm mb-2 sm:mb-3">
                                    <MonitorIcon className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600" />
                                </div>
                                <p className="text-[8px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5 sm:mb-1">POS Sales</p>
                                <p className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white">₹{stats?.pos_sales?.toLocaleString() || 0}</p>
                            </div>
                            <div className="p-3 sm:p-4 rounded-2xl sm:rounded-3xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/30 flex flex-col items-center justify-center text-center">
                                <div className="p-1.5 sm:p-2 bg-white dark:bg-indigo-900/30 rounded-xl shadow-sm mb-2 sm:mb-3">
                                    <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />
                                </div>
                                <p className="text-[8px] sm:text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-0.5 sm:mb-1">Online Store</p>
                                <p className="text-lg sm:text-2xl font-black text-indigo-900 dark:text-indigo-100">₹{stats?.online_sales?.toLocaleString() || 0}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-1 md:col-span-2 lg:col-span-4 overflow-hidden border-none">
                    <CardHeader className="border-b border-border/50 bg-muted/20 pb-4">
                        <CardTitle className="text-xl font-bold">Recent Sales</CardTitle>
                        <CardDescription>Latest transactions across your store</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {stats?.recent_orders && stats.recent_orders.length > 0 ? (
                            <div className="space-y-1 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {stats.recent_orders.map((order: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/30 transition-colors group">
                                        <div className="flex items-center gap-4">
                                            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                                #{order.order_number.toString().slice(-2)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">Order #{order.order_number}</p>
                                                <p className="text-xs text-muted-foreground">{order.customer_name || 'Customer'}</p>
                                            </div>
                                        </div>
                                        <div className="text-right flex flex-col items-end gap-1">
                                            <p className="text-sm font-bold text-foreground">₹{Number(order.total_amount).toLocaleString('en-IN')}</p>
                                            <Badge variant="outline" className={cn(
                                                "text-[10px] font-bold uppercase tracking-wider px-2 py-0 h-5 border shadow-none",
                                                order.status.toLowerCase() === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                order.status.toLowerCase() === 'confirmed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                order.status.toLowerCase() === 'delivered' ? 'bg-green-50 text-green-700 border-green-200' :
                                                order.status.toLowerCase() === 'cancelled' ? 'bg-red-50 text-red-700 border-red-200' :
                                                'bg-gray-50 text-gray-700 border-gray-200'
                                            )}>
                                                {order.status}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex h-[200px] flex-col items-center justify-center text-sm text-muted-foreground gap-2">
                                <ShoppingCart className="size-8 opacity-20" />
                                No recent sales for this period.
                            </div>
                        )}
                    </CardContent>
                </Card>
                <Card className="col-span-1 md:col-span-2 lg:col-span-3 overflow-hidden border-none">
                    <CardHeader className="border-b border-border/50 bg-muted/20 pb-4">
                        <CardTitle className="flex items-center gap-2 text-xl font-bold">
                            <Search className="h-5 w-5 text-primary" />
                            Unmet Demand
                        </CardTitle>
                        <CardDescription>Queries with zero results (Last 30 Days)</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {demandInsights && demandInsights.length > 0 ? (
                            <div className="space-y-1 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {demandInsights.map((insight: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/30 transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <div className="size-2 rounded-full bg-orange-400 group-hover:scale-150 transition-transform" />
                                            <span className="text-sm font-medium capitalize text-foreground group-hover:text-primary transition-colors">{insight.query}</span>
                                        </div>
                                        <div className="flex items-center text-[10px] px-3 py-1 bg-primary/10 rounded-full font-bold text-primary uppercase tracking-tighter shadow-sm shadow-primary/5">
                                            {insight.count} searches
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center text-center py-12 text-muted-foreground/60 bg-muted/5 rounded-2xl p-6 border border-dashed border-border/50">
                                <Search className="h-10 w-10 mb-3 opacity-20" />
                                <p className="text-sm font-bold text-foreground/70">Perfect Inventory!</p>
                                <p className="text-xs mt-1">Customers found everything recently.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card className="border-none overflow-hidden">
                <CardHeader className="border-b border-border/50 bg-muted/20 pb-4">
                    <CardTitle className="text-xl font-bold">Recent Reviews</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    {stats?.recent_reviews && stats.recent_reviews.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2">
                            {stats.recent_reviews.map((review: any, i: number) => (
                                <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-muted/20 border border-border/30 hover:bg-muted/40 transition-colors">
                                    <div className="bg-primary flex items-center justify-center size-10 rounded-xl shadow-lg shadow-primary/20 shrink-0">
                                        <span className="font-bold text-primary-foreground">{review.rating}</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-foreground">{review.customer_name || 'Customer'}</p>
                                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed italic line-clamp-2">"{review.comment}"</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-sm text-muted-foreground text-center py-12 bg-muted/5 rounded-2xl border border-dashed border-border/50">
                            <Star className="size-8 mx-auto mb-2 opacity-10" />
                            No recent reviews
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, description, color }: any) {
    return (
        <Card className="relative overflow-hidden group border-none">
            <div className={`absolute top-0 right-0 size-24 ${color} opacity-[0.03] blur-2xl rounded-full -mr-8 -mt-8 group-hover:opacity-10 transition-opacity`} />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 p-3 sm:p-6 sm:pb-2">
                <CardTitle className="text-[10px] sm:text-sm font-bold text-muted-foreground uppercase tracking-wider truncate">{title}</CardTitle>
                <div className={`p-1.5 sm:p-2 rounded-xl scale-90 sm:scale-95 group-hover:scale-100 transition-transform ${color} bg-opacity-10 ${color.replace('bg-', 'text-')} shrink-0`}>
                    <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </div>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                <div className="text-xl sm:text-3xl font-black text-foreground tracking-tight truncate">{value}</div>
                <div className="flex items-center gap-1.5 mt-1 sm:mt-2">
                    <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground/80 truncate">{description}</p>
                </div>
            </CardContent>
        </Card>
    );
}
