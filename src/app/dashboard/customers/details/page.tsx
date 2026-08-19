'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { orderDetailsHref } from '@/lib/orderLinks';
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
import { 
    Loader2, 
    ArrowLeft, 
    Star, 
    ShoppingBag, 
    Wallet, 
    Calendar, 
    ShieldBan, 
    CheckCircle, 
    History,
    IndianRupee,
    CreditCard,
    PlusCircle
} from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
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
    creditLimit: number;
    currentBalance: number;
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

    // Ledger state
    const [ledger, setLedger] = useState<any[]>([]);
    const [ledgerLoading, setLedgerLoading] = useState(false);

    // Actions State
    const [showBlacklistConfirm, setShowBlacklistConfirm] = useState(false);
    const [showRatingDialog, setShowRatingDialog] = useState(false);
    const [showPaymentDialog, setShowPaymentDialog] = useState(false);
    const [showCreditLimitDialog, setShowCreditLimitDialog] = useState(false);

    const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
    const [rating, setRating] = useState(5);
    const [ratingComment, setRatingComment] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    // Payment state
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMode, setPaymentMode] = useState('cash');
    const [paymentNotes, setPaymentNotes] = useState('');

    // Credit Limit state
    const [newCreditLimit, setNewCreditLimit] = useState('');


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
                    creditLimit: data.credit_limit ? parseFloat(data.credit_limit) : 0,
                    currentBalance: data.current_balance ? parseFloat(data.current_balance) : 0,
                    recentOrders: data.recent_orders || [],
                    rewardHistory: data.reward_history || [],
                });
                setNewCreditLimit(data.credit_limit?.toString() || '0');
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

    const fetchLedger = async () => {
        if (!id) return;
        setLedgerLoading(true);
        try {
            const response = await customerService.fetchLedger(id);
            if (response.status === 200) {
                setLedger(response.data.results || response.data || []);
            }
        } catch (err) {
            toast.error('Failed to load ledger history');
        } finally {
            setLedgerLoading(false);
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
                toast.success('Rating submitted successfully');
                setShowRatingDialog(false);
                setRating(5);
                setRatingComment('');
                fetchDetails();
            }
        } catch (err: any) {
            toast.error('Failed to submit rating');
        }
    };

    const handleRecordPayment = async () => {
        if (!id || !paymentAmount) return;
        setActionLoading(true);
        try {
            await customerService.recordPayment({
                customer_id: id,
                amount: parseFloat(paymentAmount),
                payment_mode: paymentMode,
                notes: paymentNotes
            });
            toast.success('Payment recorded successfully');
            setShowPaymentDialog(false);
            setPaymentAmount('');
            setPaymentNotes('');
            fetchDetails();
            fetchLedger();
        } catch (err) {
            toast.error('Failed to record payment');
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdateCreditLimit = async () => {
        if (!id || !newCreditLimit) return;
        setActionLoading(true);
        try {
            await customerService.updateCreditLimit(id, parseFloat(newCreditLimit));
            toast.success('Credit limit updated successfully');
            setShowCreditLimitDialog(false);
            fetchDetails();
        } catch (err) {
            toast.error('Failed to update credit limit');
        } finally {
            setActionLoading(false);
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
            <Button variant="ghost" className="mb-4 pl-0 hover:bg-transparent hover:text-primary hover:underline transition-all" onClick={() => router.back()}>
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
                            <StatRow 
                                icon={IndianRupee} 
                                label="Current Balance" 
                                value={formatCurrency(customer.currentBalance)} 
                                valueClassName={customer.currentBalance > 0 ? "text-red-600" : "text-green-600"}
                            />
                            <StatRow icon={CreditCard} label="Credit Limit" value={formatCurrency(customer.creditLimit)} />
                            <StatRow icon={ShoppingBag} label="Total Orders" value={customer.customerName === "Walking Customer" ? "POS Only" : customer.totalOrders.toString()} />
                            <StatRow icon={Star} label="Avg Rating" value={(customer.averageRating || 0).toFixed(1)} />

                            <div className="pt-4 space-y-3">
                                <Button
                                    className="w-full gap-2"
                                    onClick={() => setShowPaymentDialog(true)}
                                >
                                    <PlusCircle className="h-4 w-4" /> Record Payment
                                </Button>
                                
                                <Button
                                    variant="outline"
                                    className="w-full gap-2"
                                    onClick={() => setShowCreditLimitDialog(true)}
                                >
                                    <ShieldBan className="h-4 w-4" /> Set Credit Limit
                                </Button>

                                <Button
                                    variant={customer.isBlacklisted ? "outline" : "destructive"}
                                    className="w-full mt-4"
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
                                    <TabsTrigger value="khata" onClick={fetchLedger}>Khata / Ledger</TabsTrigger>
                                    <TabsTrigger value="rewards">Reward History</TabsTrigger>
                                </TabsList>

                                <TabsContent value="orders" className="space-y-4">
                                    {customer.recentOrders?.length === 0 ? (
                                        <div className="text-center py-10 text-muted-foreground">No recent orders found.</div>
                                    ) : (
                                        customer.recentOrders.map((order) => (
                                            <div
                                                key={order.order_number}
                                                className="flex justify-between items-center p-4 border rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                                                role="link"
                                                onClick={() => {
                                                    const href = orderDetailsHref({ id: order.id, orderNumber: order.order_number });
                                                    if (href) router.push(href);
                                                }}
                                            >
                                                <div>
                                                    <div className="font-semibold text-primary hover:underline">Order #{order.order_number}</div>
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
                                                        <Button size="sm" variant="ghost" className="h-6 mt-1 text-xs text-blue-600 px-2" onClick={(e) => {
                                                            e.stopPropagation();
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

                                <TabsContent value="khata" className="space-y-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold flex items-center gap-2">
                                            <History className="h-5 w-5 text-primary" /> Transaction Ledger
                                        </h3>
                                        <div className="text-sm text-muted-foreground">
                                            Showing last 50 transactions
                                        </div>
                                    </div>

                                    {ledgerLoading ? (
                                        <div className="flex justify-center py-10">
                                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                        </div>
                                    ) : ledger.length === 0 ? (
                                        <div className="text-center py-10 text-muted-foreground border rounded-lg border-dashed">
                                            No ledger entries found for this customer.
                                        </div>
                                    ) : (
                                        <>
                                            {/* Desktop Ledger Table */}
                                            <div className="hidden md:block border rounded-lg overflow-hidden">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow className="bg-slate-50">
                                                            <TableHead>Date</TableHead>
                                                            <TableHead>Type</TableHead>
                                                            <TableHead>Details</TableHead>
                                                            <TableHead className="text-right">Amount</TableHead>
                                                            <TableHead className="text-right">Balance</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {ledger.map((entry: any) => (
                                                            <TableRow key={entry.id}>
                                                                <TableCell className="text-xs">
                                                                    {new Date(entry.created_at).toLocaleDateString('en-IN', {
                                                                        day: '2-digit',
                                                                        month: 'short',
                                                                        year: '2-digit',
                                                                        hour: '2-digit',
                                                                        minute: '2-digit'
                                                                    })}
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Badge variant={entry.transaction_type === 'PAYMENT' ? "secondary" : "outline"} className={entry.transaction_type === 'PAYMENT' ? "bg-green-100 text-green-700" : ""}>
                                                                        {entry.transaction_type}
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <div className="text-sm">
                                                                        {entry.order_number ? (
                                                                            <Link
                                                                                href={orderDetailsHref({ id: entry.order, orderNumber: entry.order_number }) || '#'}
                                                                                className="text-primary font-semibold hover:underline"
                                                                            >
                                                                                {`Order #${entry.order_number}`}
                                                                            </Link>
                                                                        ) : entry.notes}
                                                                    </div>
                                                                    {entry.payment_mode && (
                                                                        <div className="text-[10px] text-muted-foreground uppercase">
                                                                            Mode: {entry.payment_mode}
                                                                        </div>
                                                                    )}
                                                                </TableCell>
                                                                <TableCell className={`text-right font-medium ${entry.transaction_type === 'PAYMENT' ? "text-green-600" : "text-red-600"}`}>
                                                                    {entry.transaction_type === 'PAYMENT' ? '-' : '+'}{formatCurrency(entry.amount)}
                                                                </TableCell>
                                                                <TableCell className="text-right font-bold">
                                                                    {formatCurrency(entry.balance_after)}
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>

                                            {/* Mobile Ledger List */}
                                            <div className="block md:hidden space-y-3">
                                                {ledger.map((entry: any) => (
                                                    <div 
                                                        key={entry.id} 
                                                        className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm flex flex-col gap-2.5"
                                                    >
                                                        <div className="flex justify-between items-center">
                                                            <div className="flex items-center gap-2">
                                                                <Badge variant={entry.transaction_type === 'PAYMENT' ? "secondary" : "outline"} className={`text-[9px] font-black uppercase tracking-wider border-none h-4 px-1.5 py-0 ${entry.transaction_type === 'PAYMENT' ? "bg-green-50 text-green-700" : ""}`}>
                                                                    {entry.transaction_type}
                                                                </Badge>
                                                                <span className="text-[10px] text-muted-foreground font-semibold">
                                                                    {new Date(entry.created_at).toLocaleDateString('en-IN', {
                                                                        day: '2-digit',
                                                                        month: 'short',
                                                                        year: '2-digit',
                                                                        hour: '2-digit',
                                                                        minute: '2-digit'
                                                                    })}
                                                                </span>
                                                            </div>
                                                            <span className={`text-sm font-extrabold ${entry.transaction_type === 'PAYMENT' ? "text-green-600" : "text-red-600"}`}>
                                                                {entry.transaction_type === 'PAYMENT' ? '-' : '+'}{formatCurrency(entry.amount)}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between items-center text-xs pt-1.5 border-t border-slate-50">
                                                            <div className="flex flex-col gap-0.5 min-w-0">
                                                                <span className="font-bold text-gray-700 truncate">
                                                                    {entry.order_number ? (
                                                                        <Link
                                                                            href={orderDetailsHref({ id: entry.order, orderNumber: entry.order_number }) || '#'}
                                                                            className="text-primary hover:underline"
                                                                        >
                                                                            {`Order #${entry.order_number}`}
                                                                        </Link>
                                                                    ) : (entry.notes || 'No description')}
                                                                </span>
                                                                {entry.payment_mode && (
                                                                    <span className="text-[9px] text-muted-foreground uppercase font-semibold">
                                                                        Mode: {entry.payment_mode}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex flex-col items-end shrink-0">
                                                                <span className="text-[9px] text-muted-foreground uppercase font-bold">Balance</span>
                                                                <span className="font-extrabold text-gray-900">{formatCurrency(entry.balance_after)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
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
                                                            {reward.order_number ? (
                                                                <Link
                                                                    href={orderDetailsHref({ orderNumber: reward.order_number }) || '#'}
                                                                    className="text-primary hover:underline"
                                                                >
                                                                    Order: {reward.order_number}
                                                                </Link>
                                                            ) : 'Order: -'}
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

            {/* Record Payment Dialog */}
            <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Record Payment</DialogTitle>
                        <DialogDescription>
                            Enter the amount received from {customer.customerName} to settle their balance.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-slate-50 rounded-lg border">
                                <Label className="text-xs text-muted-foreground">Current Balance</Label>
                                <div className="text-xl font-bold text-red-600">{formatCurrency(customer.currentBalance)}</div>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg border">
                                <Label className="text-xs text-muted-foreground">Remaining Limit</Label>
                                <div className="text-xl font-bold text-slate-700">{formatCurrency(customer.creditLimit - customer.currentBalance)}</div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="pay-amount">Payment Amount (₹) *</Label>
                            <Input
                                id="pay-amount"
                                type="number"
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(e.target.value)}
                                placeholder="0.00"
                                className="text-lg font-semibold"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Payment Mode</Label>
                            <select 
                                className="w-full h-10 px-3 rounded-md border border-input bg-background"
                                value={paymentMode}
                                onChange={(e) => setPaymentMode(e.target.value)}
                            >
                                <option value="cash">Cash</option>
                                <option value="upi">UPI / Online</option>
                                <option value="card">Card</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="pay-notes">Notes</Label>
                            <Input
                                id="pay-notes"
                                value={paymentNotes}
                                onChange={(e) => setPaymentNotes(e.target.value)}
                                placeholder="e.g. Paid in cash at shop"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>Cancel</Button>
                        <Button 
                            onClick={handleRecordPayment} 
                            disabled={!paymentAmount || parseFloat(paymentAmount) <= 0 || actionLoading}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {actionLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                            Record Payment
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Set Credit Limit Dialog */}
            <Dialog open={showCreditLimitDialog} onOpenChange={setShowCreditLimitDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Update Credit Limit</DialogTitle>
                        <DialogDescription>
                            Set the maximum credit amount allowed for this customer.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="credit-limit">Credit Limit (₹)</Label>
                            <Input
                                id="credit-limit"
                                type="number"
                                value={newCreditLimit}
                                onChange={(e) => setNewCreditLimit(e.target.value)}
                                placeholder="0.00"
                            />
                            <p className="text-xs text-muted-foreground italic">
                                Currently set to {formatCurrency(customer.creditLimit)}
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCreditLimitDialog(false)}>Cancel</Button>
                        <Button onClick={handleUpdateCreditLimit} disabled={actionLoading}>
                            {actionLoading && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                            Update Limit
                        </Button>
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

function StatRow({ icon: Icon, label, value, valueClassName }: { icon: any, label: string, value: string, valueClassName?: string }) {
    return (
        <div className="flex items-center gap-4">
            <div className="bg-slate-100 p-2.5 rounded-lg">
                <Icon className="h-5 w-5 text-slate-600" />
            </div>
            <div className="flex-1">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className={`font-semibold ${valueClassName || ''}`}>{value}</p>
            </div>
        </div>
    )
}
