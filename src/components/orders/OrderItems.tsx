"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
                                    {item.quantity}
                                </TableCell>
                                <TableCell className="text-right">
                                    ₹{Number(item.total_price || item.price * item.quantity).toFixed(2)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
