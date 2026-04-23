"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface OrderItem {
    id: number;
    product_name: string; // Mapped from productName
    quantity: number;
    price: number; // Mapped from totalPrice / quantity or unitPrice
    total_price: number; // Mapped from totalPrice
    product_unit?: string;
    product_image?: string;
}

// Ensure the interface matches what API returns or what we map it to
// Flutter: item.productName, item.quantity, item.productUnit, item.totalPrice
// API serializer: OrderItemSerializer usually has product_name, quantity, price, etc.
// Let's assume standard snake_case from backend based on previous files.

interface OrderItemsProps {
    items: any[]; // Using any to be safe initially, but ideally strictly typed
}

export function OrderItems({ items }: OrderItemsProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead className="text-right">Quantity</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items?.map((item, index) => (
                            <TableRow key={index}>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium">{item.product_name || item.product?.name}</span>
                                        {item.product_unit && (
                                            <span className="text-xs text-muted-foreground">
                                                Unit: {item.product_unit}
                                            </span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex flex-col items-end">
                                        {item.returned_quantity > 0 ? (
                                            <>
                                                <span className="text-xs text-gray-400 line-through decoration-red-400">
                                                    {item.quantity} {item.product_unit}
                                                </span>
                                                <span className="text-[10px] text-red-600 font-bold">
                                                    -{item.returned_quantity} returned
                                                </span>
                                                <span className="text-sm font-black text-gray-900 bg-yellow-50 px-2 py-0.5 rounded border border-yellow-100 mt-1">
                                                    {item.net_quantity} {item.product_unit}
                                                </span>
                                            </>
                                        ) : (
                                            <span>{item.quantity} {item.product_unit}</span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex flex-col items-end">
                                        <span className={cn(item.returned_quantity > 0 && "text-xs text-gray-400 line-through decoration-red-400")}>
                                            ₹{Number(item.total_price || item.price * item.quantity).toFixed(2)}
                                        </span>
                                        {item.returned_quantity > 0 && (
                                            <span className="text-sm font-black text-gray-900">
                                                ₹{(Number(item.net_quantity) * (Number(item.total_price) / Number(item.quantity))).toFixed(2)}
                                            </span>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
