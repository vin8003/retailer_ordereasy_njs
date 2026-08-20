"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, MapPin, User, FileText, Phone, Mail, Loader2, MessageCircle, Star, UserCheck, RotateCcw, Calendar, History, Banknote } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { OrderItems } from "@/components/orders/OrderItems";
import { OrderStatusUpdate } from "@/components/orders/OrderStatusUpdate";

import { orderService, customerService } from "@/services/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Printer } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { useRef } from "react";
import { ThermalReceipt } from "@/components/pos/ThermalReceipt";
import { authService } from "@/services/api";


/** Static export hydrates with RSC "q":"", so useSearchParams is empty
 *  even when the address bar (or the blocking-script snapshot) still has
 *  ?id= / ?number=. Prefer Next searchParams, then window.location.search,
 *  then sessionStorage['oe:qs:'+pathname]. */
function resolveOrderQuery(searchParams: ReturnType<typeof useSearchParams>) {
    const fromNextId = searchParams.get("id");
    const fromNextNumber = searchParams.get("number");
    if (fromNextId || fromNextNumber) {
        return { id: fromNextId, number: fromNextNumber };
    }
    if (typeof window === "undefined") {
        return { id: fromNextId, number: fromNextNumber };
    }
    const fromWin = new URLSearchParams(window.location.search);
    const winId = fromWin.get("id");
    const winNumber = fromWin.get("number");
    if (winId || winNumber) {
        return { id: winId, number: winNumber };
    }
    try {
        const key = "oe:qs:" + window.location.pathname.replace(/\/$/, "");
        const saved = sessionStorage.getItem(key);
        if (saved) {
            const q = saved.split("#")[0];
            const fromSaved = new URLSearchParams(q.startsWith("?") ? q.slice(1) : q);
            return { id: fromSaved.get("id"), number: fromSaved.get("number") };
        }
    } catch (e) {}
    return { id: fromNextId, number: fromNextNumber };
}

function OrderDetailContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [order, setOrder] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Rating State
    const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [isSubmittingRating, setIsSubmittingRating] = useState(false);

    // ETA State
    const [isEtaModalOpen, setIsEtaModalOpen] = useState(false);
    const [etaMinutes, setEtaMinutes] = useState("");
    const [isUpdatingEta, setIsUpdatingEta] = useState(false);
    const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
    const [retailerProfile, setRetailerProfile] = useState<any>(null);

    // Print Logic
    const receiptRef = useRef<HTMLDivElement>(null);
    const handlePrint = useReactToPrint({
        contentRef: receiptRef,
    });

    const fetchOrderDetails = async () => {
        setIsLoading(true);
        try {
            const q = resolveOrderQuery(searchParams);
            let id = Number(q.id);
            const orderNumber = q.number;
            if (!id && orderNumber) {
                const listRes = await orderService.fetchOrders({ search: orderNumber });
                const list = listRes.data.results || listRes.data || [];
                const match = list.find((o: any) => String(o.order_number) === String(orderNumber)) || list[0];
                id = Number(match?.id);
            }
            if (!id) throw new Error("Invalid Order ID");
            const response = await orderService.fetchOrderDetails(id);
            setOrder(response.data);
        } catch (err: any) {
            console.error("Failed to load order", err);
            setError("Failed to load order details");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRateCustomer = async () => {
        if (!rating) return;
        setIsSubmittingRating(true);
        try {
            await customerService.rateCustomer(order.id, rating, comment);
            setIsRatingModalOpen(false);
            fetchOrderDetails();
        } catch (err) {
            console.error("Failed to rate customer", err);
        } finally {
            setIsSubmittingRating(false);
        }
    };

    const handleUpdateEta = async () => {
        if (!etaMinutes || parseInt(etaMinutes) <= 0) return;
        setIsUpdatingEta(true);
        try {
            await orderService.updateEstimatedTime(order.id, parseInt(etaMinutes));
            toast.success("Estimated time updated");
            setIsEtaModalOpen(false);
            fetchOrderDetails();
        } catch (err: any) {
            console.error("Failed to update ETA", err);
            toast.error("Failed to update estimated time");
        } finally {
            setIsUpdatingEta(false);
        }
    };

    const handleVerifyPayment = async (action: 'verify' | 'fail') => {
        setIsVerifyingPayment(true);
        try {
            await orderService.verifyOrderPayment(order.id, action);
            toast.success(`Payment ${action === 'verify' ? 'verified' : 'marked as failed'}`);
            fetchOrderDetails();
        } catch (err: any) {
            console.error(`Failed to ${action} payment`, err);
            toast.error(`Failed to ${action} payment`);
        } finally {
            setIsVerifyingPayment(false);
        }
    };

    const fetchRetailerProfile = async () => {
        try {
            const response = await authService.fetchProfile();
            setRetailerProfile(response.data);
        } catch (err) {
            console.error("Failed to fetch retailer profile", err);
        }
    };

    useEffect(() => {
        const { id, number } = resolveOrderQuery(searchParams);
        if (id || number) {
            fetchOrderDetails();
            fetchRetailerProfile();
        }

        const handleFcmUpdate = (event: any) => {
            const payload = event.detail;
            const updatedOrderId = payload.data?.order_id || payload.data?.id;

            if (Number(updatedOrderId) === Number(id)) {
                fetchOrderDetails();
            }
        };

        window.addEventListener('fcm_order_update', handleFcmUpdate);
        return () => {
            window.removeEventListener('fcm_order_update', handleFcmUpdate);
        };
    }, [searchParams]);

    if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading order details...</div>;
    if (error || !order) return <div className="p-8 text-center text-red-500">{error || "Order not found"}</div>;

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100';
            case 'confirmed': return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100';
            case 'processing': return 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100';
            case 'packed': return 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100';
            case 'out_for_delivery': return 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100';
            case 'delivered': return 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100';
            case 'cancelled': return 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100';
            case 'returned': return 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100';
            default: return 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100';
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <Button variant="ghost" className="w-fit pl-0 hover:bg-transparent hover:text-primary hover:underline transition-all" onClick={() => router.back()}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Orders
                    </Button>
                    <div className="flex items-center gap-3 flex-wrap">
                        <h1 className="text-3xl font-bold tracking-tight">Order #{order.order_number}</h1>
                        <Badge variant="outline" className={cn("font-bold border shadow-none", getStatusColor(order.status))}>{order.status.toUpperCase()}</Badge>
                        <Badge variant="outline" className={cn("font-bold border shadow-none", order.source === 'pos' ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-primary/10 text-primary border-primary/20')}>
                            {order.source === 'pos' ? 'STORE ORDER' : 'ONLINE ORDER'}
                        </Badge>
                        {order.status.toLowerCase() === 'cancelled' && order.cancelled_by && (
                            <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">
                                By {order.cancelled_by.charAt(0).toUpperCase() + order.cancelled_by.slice(1)}
                            </Badge>
                        )}
                    </div>
                    <p className="text-muted-foreground">
                        Placed on {format(new Date(order.created_at), "MMM d, yyyy • h:mm a")}
                    </p>
                    {order.expected_processing_start && order.status === 'pending' && (
                        <div className="flex items-center gap-2 text-orange-600 bg-orange-50 border border-orange-200 px-3 py-2 rounded-md mt-1 w-fit">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                            <span className="text-sm font-medium">
                                Received outside business hours. Processing starts {format(new Date(order.expected_processing_start), "MMM d, h:mm a")}.
                            </span>
                        </div>
                    )}
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => handlePrint()}>
                        <Printer className="h-4 w-4 mr-2" />
                        Print Bill
                    </Button>
                    <Button variant="outline" onClick={() => router.push(`/dashboard/orders/chat?id=${order.id}`)}>
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Chat with Customer
                    </Button>
                    {order.status.toLowerCase() === 'pending' && (
                        <Button
                            variant="default"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                            onClick={() => router.push(`/dashboard/orders/edit?id=${order.id}`)}
                        >
                            <FileText className="h-4 w-4 mr-2" />
                            Edit Order
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Main Content (Items & Summary) */}
                <div className="md:col-span-2 space-y-6">
                    {/* Hidden Receipt for Printing */}
                    {order && retailerProfile && (
                        <ThermalReceipt 
                            ref={receiptRef}
                            order={{
                                order_number: order.order_number,
                                created_at: order.created_at,
                                items: order.items.map((item: any) => ({
                                    product_name: item.product_name,
                                    quantity: item.quantity,
                                    unit_price: item.price || (item.total_price / item.quantity),
                                    total_price: item.total_price,
                                    mrp: item.mrp || null,
                                    product_price: item.product_price || null,
                                })),
                                subtotal: order.subtotal,
                                discount_amount: order.discount_amount || 0,
                                total_amount: order.total_amount,
                                payment_mode: order.payment_mode || 'COD',
                                payment_status: order.payment_status === 'paid' ? 'PAID' : 'COD/UNPAID',
                                customer_name: order.customer_name || order.user?.name || order.guest_name,
                                customer_phone: order.user?.phone || order.customer_mobile || order.guest_mobile,
                                retailer_name: retailerProfile?.shop_name || order.retailer_name,
                                retailer_address: retailerProfile ? `${retailerProfile.address_line1}, ${retailerProfile.city}` : order.retailer_address,
                                retailer_phone: retailerProfile?.contact_phone || order.retailer_phone,
                                retailer_gst_number: order.retailer_gst_number || retailerProfile?.gst_number,
                                retailer_receipt_footer: order.retailer_receipt_footer || retailerProfile?.receipt_footer,
                                retailer_show_gst: order.retailer_show_gst ?? (retailerProfile?.show_gst_on_receipt || false),
                                order_source: order.source === 'pos' ? 'Store Order' : 'Online Order',
                                delivery_address: order.order_type === 'delivery' || order.delivery_mode === 'delivery'
                                    ? (order.shipping_address?.address_line1 || order.delivery_address_text || 'Address not provided') 
                                    : 'Self Pickup',
                                retailer_printer_size: order.retailer_printer_size || retailerProfile?.printer_size || '80mm',
                                ledger_previous_balance: order.ledger_previous_balance,
                                ledger_new_balance: order.ledger_new_balance,
                            }}
                        />
                    )}

                    <OrderItems items={order.items} />

                    {/* Financial Summary */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Order Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span>₹{Number(order.subtotal || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Delivery Fee</span>
                                <span>+ ₹{Number(order.delivery_fee || 0).toFixed(2)}</span>
                            </div>
                            {/* Points Redeemed */}
                            {Number(order.discount_from_points || 0) > 0 && (
                                <div className="flex justify-between text-sm text-green-600">
                                    <span>Points Redeemed ({Number(order.points_redeemed)})</span>
                                    <span>- ₹{Number(order.discount_from_points).toFixed(2)}</span>
                                </div>
                            )}

                            {/* Offers */}
                            {order.applied_offers && order.applied_offers.length > 0 && (
                                <div className="space-y-1 py-1">
                                    {order.applied_offers.map((offer: any, idx: number) => (
                                        <div key={idx} className="flex justify-between text-sm text-green-600">
                                            <span className="flex items-center gap-1">
                                                <Badge variant="outline" className="text-[10px] h-4 px-1 py-0 border-green-200 text-green-700 bg-green-50">OFFER</Badge>
                                                {offer.name}
                                            </span>
                                            <span>- ₹{Number(offer.discount).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Generic Discount Fallback (if no specific offers but amount exists) */}
                            {!order.applied_offers?.length && Number(order.discount_amount || 0) > 0 && (
                                <div className="flex justify-between text-sm text-green-600">
                                    <span>Discount</span>
                                    <span>- ₹{Number(order.discount_amount).toFixed(2)}</span>
                                </div>
                            )}

                            {/* Points Earned Info */}
                            {Number(order.points_earned || 0) > 0 && (
                                <div className="mt-2 pt-2 border-t border-dashed">
                                    <div className="flex justify-between text-sm text-blue-600 font-medium">
                                        <span>Points Earned</span>
                                        <span>+{Number(order.points_earned)} pts</span>
                                    </div>
                                </div>
                            )}
                            <Separator />
                            <div className="flex justify-between font-bold text-lg">
                                <span>Total Amount</span>
                                <span>₹{Number(order.total_amount).toFixed(2)}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar (Actions, Customer, Address) */}
                <div className="space-y-6">
                    {/* Status Actions */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Manage Order</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-4">
                                <p className="text-sm text-muted-foreground mb-2">Update Status:</p>
                                <OrderStatusUpdate
                                    orderId={order.id}
                                    currentStatus={order.status}
                                    deliveryMode={order.delivery_mode}
                                    onStatusUpdate={fetchOrderDetails}
                                />
                            </div>

                            {/* Update ETA Button */}
                            {['confirmed', 'processing'].includes(order.status.toLowerCase()) && (
                                <>
                                    <Separator className="my-4" />
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-2">Estimated Ready Time:</p>
                                        <p className="text-sm font-medium mb-3">
                                            {order.preparation_time_minutes ? `${order.preparation_time_minutes} min` : 'Not set'}
                                        </p>
                                        <Button variant="outline" className="w-full" onClick={() => {
                                            setEtaMinutes(order.preparation_time_minutes?.toString() || "30");
                                            setIsEtaModalOpen(true);
                                        }}>
                                            Update Time
                                        </Button>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Payment Details */}
                    {order.payment_mode === 'upi' && (
                        <Card className="border-primary/20 bg-primary/5 shadow-none">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg flex items-center gap-2 text-primary">
                                    <FileText className="h-5 w-5" /> Payment info
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-muted-foreground">Method:</span>
                                        <Badge variant="outline" className="font-bold border-primary/30 text-primary">UPI</Badge>
                                    </div>

                                    {order.payment_edit_count > 1 && (
                                        <div className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-1 rounded w-fit animate-pulse">
                                            CUSTOMER UPDATED TRANSACTION ID
                                        </div>
                                    )}

                                    <div className="flex flex-col gap-1">
                                        <span className="text-sm text-muted-foreground">Transaction ID:</span>
                                        {order.payment_reference_id ? (
                                            <div className="flex items-center justify-between p-2 bg-white rounded border border-primary/20">
                                                <code className="text-sm font-bold text-primary break-all">{order.payment_reference_id}</code>
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="h-6 px-2 text-[10px] shrink-0"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(order.payment_reference_id);
                                                        toast.success("Transaction ID copied!");
                                                    }}
                                                >
                                                    Copy
                                                </Button>
                                            </div>
                                        ) : (
                                            <span className="text-sm font-medium text-amber-600 italic bg-amber-50 p-2 rounded border border-amber-100">
                                                Pending Submission
                                            </span>
                                        )}
                                    </div>

                                    <div className="pt-2 flex flex-col gap-2">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs text-muted-foreground font-bold uppercase">Status:</span>
                                            <Badge variant="outline" className={cn(
                                                "text-[10px] font-bold",
                                                order.payment_status === 'verified' ? "bg-green-50 text-green-700 border-green-200" :
                                                order.payment_status === 'failed' ? "bg-red-50 text-red-700 border-red-200" :
                                                "bg-blue-50 text-blue-700 border-blue-200"
                                            )}>
                                                {(order.payment_status || 'pending').replace('_', ' ').toUpperCase()}
                                            </Badge>
                                        </div>

                                        {order.payment_status === 'pending_verification' && (
                                            <div className="grid grid-cols-2 gap-2 mt-2">
                                                <Button 
                                                    size="sm" 
                                                    className="bg-green-600 hover:bg-green-700 text-white h-8 text-xs"
                                                    onClick={() => handleVerifyPayment('verify')}
                                                    disabled={isVerifyingPayment}
                                                >
                                                    {isVerifyingPayment ? <Loader2 className="h-3 w-3 animate-spin" /> : "Verify"}
                                                </Button>
                                                <Button 
                                                    size="sm" 
                                                    variant="destructive" 
                                                    className="h-8 text-xs"
                                                    onClick={() => handleVerifyPayment('fail')}
                                                    disabled={isVerifyingPayment}
                                                >
                                                    {isVerifyingPayment ? <Loader2 className="h-3 w-3 animate-spin" /> : "Fail"}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Customer Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <User className="h-5 w-5" /> Customer
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="font-medium">{order.customer_name || (order.customer?.first_name ? `${order.customer.first_name} ${order.customer.last_name || ''}` : 'Customer')}</p>
                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                    <Badge variant="outline" className="text-xs">Verified Customer</Badge>
                                    {order.customer_average_rating !== undefined && order.customer_average_rating > 0 ? (
                                        <Badge variant="outline" className={cn(
                                            "text-xs flex items-center gap-1",
                                            order.customer_average_rating > 4 ? "text-green-700 border-green-200 bg-green-50" :
                                            order.customer_average_rating > 2.5 ? "text-yellow-700 border-yellow-200 bg-yellow-50" :
                                            "text-red-700 border-red-200 bg-red-50"
                                        )}>
                                            <Star className="h-3 w-3 fill-current" />
                                            {Number(order.customer_average_rating).toFixed(1)} Rating
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-xs text-muted-foreground bg-muted/50 font-medium">No rating yet</Badge>
                                    )}
                                </div>
                            </div>
                            <Separator />
                            <div className="space-y-2 text-sm">
                                {order.customer_phone && (
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                        <span>{order.customer_phone}</span>
                                    </div>
                                )}
                                {order.customer_email && (
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        <span>{order.customer_email}</span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Customer Feedback Card */}
                    {order.feedback && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" /> Customer Feedback
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Star
                                                key={star}
                                                size={16}
                                                className={order.feedback.overall_rating >= star ? 'text-yellow-400' : 'text-gray-300'}
                                                fill={order.feedback.overall_rating >= star ? '#facc15' : 'none'}
                                            />
                                        ))}
                                    </div>
                                    {order.feedback.comment && (
                                        <p className="text-sm italic text-muted-foreground p-3 bg-muted/50 rounded-md">
                                            "{order.feedback.comment}"
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Rate Customer Card */}
                    {['delivered', 'cancelled', 'returned'].includes(order.status) && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Star className="h-5 w-5" /> Rate Customer
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {!order.has_retailer_rating ? (
                                    <Button
                                        className="w-full"
                                        variant="outline"
                                        onClick={() => setIsRatingModalOpen(true)}
                                    >
                                        Rate this Customer
                                    </Button>
                                ) : (
                                    <div className="flex items-center justify-center p-3 bg-green-50 text-green-700 rounded-md border border-green-200 text-sm font-medium">
                                        <UserCheck className="h-4 w-4 mr-2" />
                                        Customer Rated
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Delivery Address */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <MapPin className="h-5 w-5" /> Delivery Address
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm leading-relaxed mb-4">
                                {order.delivery_address_map?.address_line_1 || order.delivery_address_text || "No address provided"}
                                <br />
                                {order.delivery_address_map?.city}, {order.delivery_address_map?.state} - {order.delivery_address_map?.pincode}
                            </p>

                            {/* Map & Navigation */}
                            {order.delivery_latitude && order.delivery_longitude && (
                                <div className="space-y-3 mb-4">
                                    <div className="aspect-video w-full rounded-md overflow-hidden bg-muted border relative">
                                        <iframe
                                            width="100%"
                                            height="100%"
                                            frameBorder="0"
                                            scrolling="no"
                                            marginHeight={0}
                                            marginWidth={0}
                                            src={`https://maps.google.com/maps?q=${order.delivery_latitude},${order.delivery_longitude}&z=15&output=embed`}
                                            title="Customer Location"
                                        ></iframe>
                                    </div>
                                    <Button
                                        variant="outline"
                                        className="w-full gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                                        onClick={() => window.open(
                                            `https://www.google.com/maps/dir/?api=1&destination=${order.delivery_latitude},${order.delivery_longitude}`,
                                            '_blank'
                                        )}
                                    >
                                        <MapPin className="h-4 w-4" /> Start Navigation
                                    </Button>
                                </div>
                            )}

                            {order.special_instructions && (
                                <div className="mt-4 p-3 bg-muted rounded-md border text-sm">
                                    <p className="font-medium mb-1 flex items-center gap-2">
                                        <FileText className="h-3 w-3" /> Note:
                                    </p>
                                    <p className="text-muted-foreground">{order.special_instructions}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Dialog open={isRatingModalOpen} onOpenChange={setIsRatingModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rate Customer</DialogTitle>
                        <DialogDescription>
                            How was your experience with {order.customer_name || "this customer"}?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="flex justify-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    className="focus:outline-none transition-transform active:scale-95"
                                >
                                    <Star
                                        size={32}
                                        className={rating >= star ? 'text-yellow-400' : 'text-gray-300'}
                                        fill={rating >= star ? '#facc15' : 'none'}
                                    />
                                </button>
                            ))}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="comment">Comment (Optional)</Label>
                            <Textarea
                                id="comment"
                                placeholder="Add a note about this customer..."
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsRatingModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleRateCustomer} disabled={isSubmittingRating}>
                            {isSubmittingRating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Rating"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isEtaModalOpen} onOpenChange={setIsEtaModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Update Estimated Time</DialogTitle>
                        <DialogDescription>
                            Enter the new estimated preparation time in minutes.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="etaMinutes" className="text-right">Time (min)</Label>
                            <Input
                                id="etaMinutes"
                                type="number"
                                value={etaMinutes}
                                onChange={(e) => setEtaMinutes(e.target.value)}
                                className="col-span-3"
                                min="1"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEtaModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleUpdateEta} disabled={isUpdatingEta || !etaMinutes || parseInt(etaMinutes) <= 0}>
                            {isUpdatingEta ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update Time"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
}

export default function OrderDetailPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading order details...</div>}>
            <OrderDetailContent />
        </Suspense>
    );
}
