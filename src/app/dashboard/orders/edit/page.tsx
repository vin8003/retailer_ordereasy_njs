"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, Save, Trash2, Undo, Minus, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

import { orderService, rewardService } from "@/services/api";
import { ProductSelector } from "@/components/products/ProductSelector";

interface OrderItem {
    id: number;
    product_id: number;
    product_name: string;
    product_price: number;
    unit_price: number;
    quantity: number;
    product_unit: string;
    product_image?: string;
    total_price: number;
}

function OrderEditContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [order, setOrder] = useState<any>(null);
    const [rewardConfig, setRewardConfig] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Form State
    const [items, setItems] = useState<OrderItem[]>([]);
    const [deliveryMode, setDeliveryMode] = useState<string>("delivery");
    const [discountAmount, setDiscountAmount] = useState<number>(0);

    useEffect(() => {
        const id = searchParams.get('id');
        if (id) {
            fetchOrderDetails(Number(id));
            fetchRewardConfig();
        }
    }, [searchParams]);

    const fetchOrderDetails = async (id: number) => {
        setIsLoading(true);
        try {
            const response = await orderService.fetchOrderDetails(id);
            const orderData = response.data;
            setOrder(orderData);
            setItems(orderData.items.map((item: any) => ({
                ...item,
                product_id: item.product?.id || item.product_id
            })));
            setDeliveryMode(orderData.delivery_mode);
            setDiscountAmount(Number(orderData.discount_amount || 0));
        } catch (err) {
            console.error("Failed to load order", err);
            toast.error("Failed to load order details");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchRewardConfig = async () => {
        try {
            const response = await rewardService.getRewardConfig();
            setRewardConfig(response.data);
        } catch (err) {
            console.error("Failed to load reward config", err);
        }
    };

    const updateItemQuantity = (itemId: number, newQty: number) => {
        if (newQty < 1) return;
        setItems(prev => prev.map(item =>
            item.id === itemId ? { ...item, quantity: newQty } : item
        ));
    };

    const updateItemPrice = (itemId: number, newPrice: number) => {
        setItems(prev => prev.map(item =>
            item.id === itemId ? { ...item, unit_price: newPrice } : item
        ));
    };

    const removeItem = (itemId: number) => {
        setItems(prev => prev.map(item =>
            item.id === itemId ? { ...item, quantity: 0 } : item
        ));
    };

    const restoreItem = (itemId: number) => {
        setItems(prev => prev.map(item =>
            item.id === itemId ? { ...item, quantity: 1 } : item
        ));
    };

    const addProduct = (product: any) => {
        // Check if product already exists (even if marked for removal)
        const existing = items.find(item => item.product_id === product.id);
        if (existing) {
            if (existing.quantity === 0) {
                restoreItem(existing.id);
            } else {
                updateItemQuantity(existing.id, existing.quantity + 1);
            }
            return;
        }

        // Add as new item (use negative ID for temporary tracking if needed, 
        // but backend expects product_id for new items)
        const newItem: OrderItem = {
            id: -(Date.now()), // Temp ID
            product_id: product.id,
            product_name: product.name,
            product_price: product.price,
            unit_price: product.price,
            quantity: 1,
            product_unit: product.unit,
            product_image: product.image_display_url,
            total_price: product.price
        };
        setItems(prev => [...prev, newItem]);
    };

    const calculateSummary = () => {
        const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
        const deliveryFee = deliveryMode === 'delivery' ? 50 : 0;
        const totalBeforePoints = Math.max(0, subtotal + deliveryFee - discountAmount);

        let pointsRefundValue = 0;
        let finalPointsDiscount = 0;

        if (rewardConfig && order?.points_redeemed > 0) {
            const currentPointsValue = order.points_redeemed * rewardConfig.conversion_rate;
            const maxByPercent = (totalBeforePoints * rewardConfig.max_reward_usage_percent) / 100;
            const maxByFlat = rewardConfig.max_reward_usage_flat;

            let redeemableAmount = Math.min(currentPointsValue, maxByPercent, maxByFlat, totalBeforePoints);
            finalPointsDiscount = redeemableAmount;

            if (redeemableAmount < currentPointsValue) {
                pointsRefundValue = currentPointsValue - redeemableAmount;
            }
        }

        const total = totalBeforePoints - finalPointsDiscount;

        return {
            subtotal,
            deliveryFee,
            totalBeforePoints,
            finalPointsDiscount,
            pointsRefundValue,
            total
        };
    };

    const summary = calculateSummary();

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const payloadItems = items.map(item => {
                if (item.id < 0) {
                    return { product_id: item.product_id, quantity: item.quantity };
                }
                return { id: item.id, quantity: item.quantity, unit_price: item.unit_price };
            });

            await orderService.modifyOrder(order.id, {
                items: payloadItems,
                delivery_mode: deliveryMode,
                discount_amount: discountAmount
            });

            toast.success("Order request sent to customer for approval");
            router.push(`/dashboard/orders/details?id=${order.id}`);
        } catch (err: any) {
            console.error("Failed to save order", err);
            toast.error(err.response?.data?.error || "Failed to save order");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="p-8 text-center"><Loader2 className="animate-spin inline mr-2" /> Loading order details...</div>;
    if (!order) return <div className="p-8 text-center text-red-500">Order not found</div>;

    return (
        <div className="space-y-6 container mx-auto max-w-5xl py-6">
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-2">
                    <Button variant="ghost" className="w-fit pl-0" onClick={() => router.back()}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                    <h1 className="text-3xl font-bold tracking-tight">Edit Order #{order.order_number}</h1>
                </div>
                <Button onClick={handleSave} disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700">
                    {isSaving ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Changes
                </Button>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Order Items</CardTitle>
                            <ProductSelector
                                onSelect={addProduct}
                                excludeIds={items.filter(i => i.quantity > 0).map(i => i.product_id)}
                            />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {items.map((item) => (
                                <div key={item.id} className={`p-4 border rounded-lg ${item.quantity === 0 ? 'bg-red-50 opacity-60' : item.id < 0 ? 'bg-green-50 border-green-200' : ''}`}>
                                    <div className="flex gap-4">
                                        <div className="w-16 h-16 bg-muted rounded flex items-center justify-center overflow-hidden border">
                                            {item.product_image ? (
                                                <img src={item.product_image} alt={item.product_name} className="object-cover w-full h-full" />
                                            ) : (
                                                <Minus className="text-muted-foreground" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between">
                                                <div>
                                                    <h4 className="font-semibold">{item.product_name}</h4>
                                                    <p className="text-sm text-muted-foreground">{item.product_unit}</p>
                                                    {item.id < 0 && <Badge variant="secondary" className="bg-green-100 text-green-700 mt-1">NEW ITEM</Badge>}
                                                </div>
                                                {item.quantity === 0 ? (
                                                    <Button variant="outline" size="sm" onClick={() => restoreItem(item.id)}>
                                                        <Undo className="h-4 w-4 mr-2" /> Restore
                                                    </Button>
                                                ) : (
                                                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => removeItem(item.id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>

                                            {item.quantity > 0 && (
                                                <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                                                    <div className="flex items-center border rounded-md">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                                                            disabled={item.quantity <= 1}
                                                        >
                                                            <Minus className="h-3 w-3" />
                                                        </Button>
                                                        <span className="w-10 text-center text-sm">{item.quantity}</span>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                                                        >
                                                            <Plus className="h-3 w-3" />
                                                        </Button>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <Label className="text-xs">Unit Price:</Label>
                                                        <div className="relative w-24">
                                                            <span className="absolute left-2 top-2 text-muted-foreground text-xs">₹</span>
                                                            <Input
                                                                type="number"
                                                                className="h-8 pl-5 text-sm"
                                                                value={item.unit_price}
                                                                onChange={(e) => updateItemPrice(item.id, Number(e.target.value))}
                                                                disabled={item.id < 0}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="text-right flex-1 min-w-[100px]">
                                                        <p className="text-xs text-muted-foreground">Subtotal</p>
                                                        <p className="font-semibold text-indigo-600">₹{(item.quantity * item.unit_price).toFixed(2)}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Order Options</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Delivery Mode</Label>
                                <Select value={deliveryMode} onValueChange={setDeliveryMode}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select mode" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="delivery">Delivery</SelectItem>
                                        <SelectItem value="pickup">Pickup</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Additional Discount (₹)</Label>
                                <Input
                                    type="number"
                                    value={discountAmount}
                                    onChange={(e) => setDiscountAmount(Number(e.target.value))}
                                />
                                <p className="text-[10px] text-muted-foreground">Adjust manually if needed</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-50">
                        <CardHeader>
                            <CardTitle>Summary Preview</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Items Total</span>
                                <span>₹{summary.subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Delivery Fee</span>
                                <span>+ ₹{summary.deliveryFee.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-green-600 font-medium">
                                <span>Manual Discount</span>
                                <span>- ₹{summary.deliveryFee > 0 && discountAmount > 0 ? discountAmount.toFixed(2) : discountAmount.toFixed(2)}</span>
                            </div>
                            {summary.finalPointsDiscount > 0 && (
                                <div className="flex justify-between text-sm text-blue-600 font-medium">
                                    <span>Points Discount</span>
                                    <span>- ₹{summary.finalPointsDiscount.toFixed(2)}</span>
                                </div>
                            )}
                            <Separator />
                            <div className="flex justify-between font-bold text-lg text-indigo-900">
                                <span>Estimated Total</span>
                                <span>₹{summary.total.toFixed(2)}</span>
                            </div>

                            {summary.pointsRefundValue > 0 && (
                                <div className="mt-4 p-3 bg-orange-50 border border-orange-100 rounded-md text-orange-800 text-xs shadow-sm">
                                    <p className="font-semibold mb-1 flex items-center gap-1">
                                        <Undo className="h-3 w-3" /> Point Refund Required
                                    </p>
                                    <p>₹{summary.pointsRefundValue.toFixed(2)} worth of points will be refunded to the customer as the order value decreased below redemption limits.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default function OrderEditPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading...</div>}>
            <OrderEditContent />
        </Suspense>
    );
}
