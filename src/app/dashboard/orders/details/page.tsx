"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, MapPin, User, FileText, Phone, Mail, Loader2, MessageCircle } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { OrderItems } from "@/components/orders/OrderItems";
import { OrderStatusUpdate } from "@/components/orders/OrderStatusUpdate";
import { orderService } from "@/services/api";

function OrderDetailContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [order, setOrder] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchOrderDetails = async () => {
        setIsLoading(true);
        try {
            const id = Number(searchParams.get('id'));
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

    useEffect(() => {
        if (searchParams.get('id')) {
            fetchOrderDetails();
        }
    }, [searchParams]);

    if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading order details...</div>;
    if (error || !order) return <div className="p-8 text-center text-red-500">{error || "Order not found"}</div>;

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending': return 'bg-yellow-500';
            case 'confirmed': return 'bg-blue-500';
            case 'processing': return 'bg-indigo-500';
            case 'packed': return 'bg-teal-500';
            case 'out_for_delivery': return 'bg-purple-500';
            case 'delivered': return 'bg-green-500';
            case 'cancelled': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <Button variant="ghost" className="w-fit pl-0 hover:bg-transparent" onClick={() => router.back()}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Orders
                    </Button>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight">Order #{order.order_number}</h1>
                        <Badge className={getStatusColor(order.status)}>{order.status.toUpperCase()}</Badge>
                    </div>
                    <p className="text-muted-foreground">
                        Placed on {format(new Date(order.created_at), "MMM d, yyyy • h:mm a")}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.push(`/dashboard/orders/chat?id=${order.id}`)}>
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Chat with Customer
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Main Content (Items & Summary) */}
                <div className="md:col-span-2 space-y-6">
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
                            {Number(order.discount_amount || 0) > 0 && (
                                <div className="flex justify-between text-sm text-green-600">
                                    <span>Discount</span>
                                    <span>- ₹{Number(order.discount_amount).toFixed(2)}</span>
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
                        </CardContent>
                    </Card>

                    {/* Customer Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <User className="h-5 w-5" /> Customer
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="font-medium">{order.customer_name || order.customer?.first_name}</p>
                                <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-xs">Verified Customer</Badge>
                                </p>
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

                    {/* Delivery Address */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <MapPin className="h-5 w-5" /> Delivery Address
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm leading-relaxed">
                                {order.delivery_address_map?.address_line_1 || order.delivery_address_text || "No address provided"}
                                <br />
                                {order.delivery_address_map?.city}, {order.delivery_address_map?.state} - {order.delivery_address_map?.pincode}
                            </p>
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
        </div>
    );
}

export default function OrderDetailPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading order details...</div>}>
            <OrderDetailContent />
        </Suspense>
    );
}
