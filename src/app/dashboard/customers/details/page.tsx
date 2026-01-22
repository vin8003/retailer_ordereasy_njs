'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api, { customerService } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft, Star, ShoppingBag, Wallet, Calendar, ShieldBan, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface CustomerDetail {
    customerId: number;
    customerName: string;
    phoneNumber?: string;
    email?: string;
    profileImage?: string;
    totalOrders: number;
    totalSpent: number;
    points: number;
    averageRating: number;
    joinedDate?: string;
    isBlacklisted: boolean;
    recentOrders: any[];
    rewardHistory: any[];
}

function CustomerDetailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const idParam = searchParams.get('id');
    const id = idParam ? parseInt(idParam) : null;

    const [customer, setCustomer] = useState<CustomerDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Actions State
    const [showBlacklistConfirm, setShowBlacklistConfirm] = useState(false);
    const [showRatingDialog, setShowRatingDialog] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
    const [rating, setRating] = useState(5);
    const [ratingComment, setRatingComment] = useState('');
    const [actionLoading, setActionLoading] = useState(false);


    const fetchDetails = async () => {
        if (!id) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const response = await customerService.getRetailerCustomerDetail(id);
            if (response.status === 200) {
                const data = response.data;
                setCustomer({
                    customerId: data.customer_id,
                    customerName: data.customer_name,
                    phoneNumber: data.phone_number,
                    email: data.email,
                    profileImage: data.profile_image,
                    totalOrders: data.total_orders,
                    totalSpent: data.total_spent ? parseFloat(data.total_spent) : 0,
                    points: data.points ? parseFloat(data.points) : 0,
                    averageRating: data.average_rating ? parseFloat(data.average_rating) : 0,
                    joinedDate: data.joined_date,
                    isBlacklisted: data.is_blacklisted,
                    recentOrders: data.recent_orders || [],
                    rewardHistory: data.reward_history || [],
                });
            } else {
                throw new Error('Failed to load details');
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Error loading details');
            toast.error('Failed to load customer details');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchDetails();
        }
    }, [id]);

    const handleToggleBlacklist = async () => {
        if (!customer || !id) return;
        setActionLoading(true);
        try {
            const action = customer.isBlacklisted ? 'unblacklist' : 'blacklist';
            const reason = customer.isBlacklisted ? 'Manual removal' : 'Manual blacklist by retailer';

            const response = await customerService.toggleRetailerBlacklist(id, action, reason);

            if (response.status === 200) {
                toast.success(response.data.message || 'Status updated');
                setShowBlacklistConfirm(false);
                fetchDetails(); // Refresh
            }
        } catch (err: any) {
            toast.error(err.message || 'Failed to update status');
        } finally {
            setActionLoading(false);
        }
    };

    const handleSubmitRating = async () => {
        if (!selectedOrderId) return;
        try {
            const response = await customerService.rateCustomer(selectedOrderId, rating, ratingComment);
            if (response.status === 200 || response.status === 201) {
                toast.success('Rating submitted details');
                setShowRatingDialog(false);
                setRating(5);
                setRatingComment('');
                fetchDetails();
            }
        } catch (err: any) {
            toast.error('Failed to submit rating');
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatImageUrl = (path?: string) => {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        const baseUrl = 'https://api.ordereasy.win';
        return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !customer) {
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-4">
                <p className="text-red-500">{error || 'Customer not found'}</p>
                <Button onClick={() => router.back()}>Go Back</Button>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
            <Button variant="ghost" className="mb-4 pl-0 hover:bg-transparent hover:underline" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Customers
            </Button>

            {/* Header Profile Card */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                            <AvatarImage src={formatImageUrl(customer.profileImage)} />
                            <AvatarFallback className="text-2xl">{customer.customerName?.[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>

                        <div className="flex-1 text-center md:text-left space-y-2">
                            <h1 className="text-3xl font-bold">{customer.customerName}</h1>
                            <p className="text-muted-foreground">{customer.phoneNumber || customer.email || 'No contact info'}</p>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                            <Badge variant={customer.isBlacklisted ? "destructive" : "secondary"} className={`px-4 py-1.5 text-sm ${!customer.isBlacklisted ? 'bg-green-100 text-green-800' : ''}`}>
                                {customer.isBlacklisted ? (
                                    <><ShieldBan className="mr-2 h-4 w-4" /> Blacklisted</>
                                ) : (
                                    <><CheckCircle className="mr-2 h-4 w-4" /> Active Customer</>
                                )}
                            </Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Sidebar: Stats & Actions */}
                <div className="md:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Stats Overview</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <StatRow icon={Wallet} label="Total Spent" value={formatCurrency(customer.totalSpent)} />
                            <StatRow icon={ShoppingBag} label="Total Orders" value={customer.totalOrders.toString()} />
                            <StatRow icon={Star} label="Avg Rating" value={(customer.averageRating || 0).toFixed(1)} />
                            <StatRow icon={Calendar} label="Joined" value={customer.joinedDate ? new Date(customer.joinedDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '-'} />

                            <div className="pt-4">
                                <Button
                                    variant={customer.isBlacklisted ? "outline" : "destructive"}
                                    className="w-full"
                                    onClick={() => setShowBlacklistConfirm(true)}
                                >
                                    {customer.isBlacklisted ? 'Unblacklist Customer' : 'Blacklist Customer'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Main Content: Tabs */}
                <div className="md:col-span-2">
                    <Card className="h-full">
                        <CardContent className="p-6">
                            <Tabs defaultValue="orders">
                                <TabsList className="w-full justify-start mb-6">
                                    <TabsTrigger value="orders">Order History</TabsTrigger>
                                    <TabsTrigger value="rewards">Reward History</TabsTrigger>
                                </TabsList>

                                <TabsContent value="orders" className="space-y-4">
                                    {customer.recentOrders?.length === 0 ? (
                                        <div className="text-center py-10 text-muted-foreground">No recent orders found.</div>
                                    ) : (
                                        customer.recentOrders.map((order) => (
                                            <div key={order.order_number} className="flex justify-between items-center p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                                                <div>
                                                    <div className="font-semibold">Order #{order.order_number}</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {new Date(order.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                    {order.my_rating && (
                                                        <div className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                                                            <Star className="h-3 w-3 fill-current" /> You rated: {order.my_rating}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="text-right flex flex-col items-end gap-1">
                                                    <div className="font-bold">{formatCurrency(order.total_amount)}</div>
                                                    <Badge variant="outline" className="text-xs capitalize">{order.status}</Badge>

                                                    {(order.status?.toLowerCase() === 'delivered' && !order.my_rating) && (
                                                        <Button size="sm" variant="ghost" className="h-6 mt-1 text-xs text-blue-600 px-2" onClick={() => {
                                                            setSelectedOrderId(order.id);
                                                            setShowRatingDialog(true);
                                                        }}>
                                                            Rate
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </TabsContent>

                                <TabsContent value="rewards">
                                    {customer.rewardHistory?.length === 0 ? (
                                        <div className="text-center py-10 text-muted-foreground">No reward history.</div>
                                    ) : (
                                        customer.rewardHistory.map((reward, i) => (
                                            <div key={i} className="flex justify-between items-center p-4 border-b last:border-0 hover:bg-slate-50">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-orange-100 p-2 rounded-full">
                                                        <Star className="h-4 w-4 text-orange-600" />
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-sm">
                                                            {reward.type === 'earned' ? 'Earned' : 'Redeemed'}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            Order: {reward.order_number || '-'}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className={`font-bold ${reward.type === 'earned' ? 'text-green-600' : 'text-red-600'}`}>
                                                        {reward.type === 'earned' ? '+' : '-'}{reward.points}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {new Date(reward.date).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Dialogs */}
            <AlertDialog open={showBlacklistConfirm} onOpenChange={setShowBlacklistConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {customer.isBlacklisted ? 'Remove from Blacklist?' : 'Blacklist Customer?'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {customer.isBlacklisted
                                ? 'This customer will be able to place orders again.'
                                : 'This customer will be blocked from placing orders at your shop.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleToggleBlacklist} className={customer.isBlacklisted ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}>
                            {actionLoading ? <Loader2 className="animate-spin" /> : (customer.isBlacklisted ? 'Unblacklist' : 'Blacklist')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={showRatingDialog} onOpenChange={setShowRatingDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rate Customer</DialogTitle>
                        <DialogDescription>Rate your experience with this customer for this order.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="flex justify-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button key={star} onClick={() => setRating(star)} className="focus:outline-none transition-transform hover:scale-110">
                                    <Star className={`h-8 w-8 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                                </button>
                            ))}
                        </div>
                        <div className="space-y-2">
                            <Label>Comment (Optional)</Label>
                            <Input value={ratingComment} onChange={(e) => setRatingComment(e.target.value)} placeholder="Any specific feedback?" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowRatingDialog(false)}>Cancel</Button>
                        <Button onClick={handleSubmitRating}>Submit Rating</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default function CustomerDetailPage() {
    return (
        <Suspense fallback={
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <CustomerDetailContent />
        </Suspense>
    );
}

function StatRow({ icon: Icon, label, value }: { icon: any, label: string, value: string }) {
    return (
        <div className="flex items-center gap-4">
            <div className="bg-slate-100 p-2.5 rounded-lg">
                <Icon className="h-5 w-5 text-slate-600" />
            </div>
            <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="font-semibold">{value}</p>
            </div>
        </div>
    )
}
