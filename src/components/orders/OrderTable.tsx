"use client";

import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Eye, MoreHorizontal } from "lucide-react";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Order {
    id: number;
    order_number: string;
    customer_name?: string; // Mapped from customer object if needed
    customer?: { first_name: string; last_name: string; username: string };
    total_amount: number;
    status: string;
    created_at: string;
    items_count?: number;
    expected_processing_start?: string;
    feedback?: {
        overall_rating: number;
        comment: string;
    };
}

interface OrderTableProps {
    orders: Order[];
    isLoading: boolean;
}

export function OrderTable({ orders, isLoading }: OrderTableProps) {
    const router = useRouter();

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending': return 'bg-yellow-500 hover:bg-yellow-600';
            case 'confirmed': return 'bg-blue-500 hover:bg-blue-600';
            case 'processing': return 'bg-indigo-500 hover:bg-indigo-600';
            case 'packed': return 'bg-teal-500 hover:bg-teal-600';
            case 'out_for_delivery': return 'bg-purple-500 hover:bg-purple-600';
            case 'delivered': return 'bg-green-500 hover:bg-green-600';
            case 'cancelled': return 'bg-red-500 hover:bg-red-600';
            case 'returned': return 'bg-orange-800 hover:bg-orange-900';
            default: return 'bg-gray-500 hover:bg-gray-600';
        }
    };

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground">Loading orders...</div>;
    }

    if (orders.length === 0) {
        return <div className="p-8 text-center text-muted-foreground">No orders found.</div>;
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Order #</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {orders.map((order) => (
                        <TableRow
                            key={order.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => router.push(`/dashboard/orders/details?id=${order.id}`)}
                        >
                            <TableCell className="font-medium">{order.order_number}</TableCell>
                            <TableCell>
                                <div className="flex flex-col">
                                    <span>{format(new Date(order.created_at), "MMM d, yyyy")}</span>
                                    {order.expected_processing_start && order.status === 'pending' && (
                                        <span className="text-xs text-orange-600 flex items-center font-medium mt-1">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                                            Process later
                                        </span>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell>
                                {order.customer?.first_name
                                    ? `${order.customer.first_name} ${order.customer.last_name || ''}`
                                    : order.customer_name || 'Customer'}
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col gap-1 items-start">
                                    <Badge className={getStatusColor(order.status)}>
                                        {order.status.toUpperCase()}
                                    </Badge>
                                    {order.feedback && (
                                        <div className="flex items-center gap-1 text-xs text-yellow-600 font-medium">
                                            <span>{order.feedback.overall_rating}</span>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="#facc15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-star"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                                        </div>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell className="text-right">
                                ₹{Number(order.total_amount).toLocaleString('en-IN')}
                            </TableCell>
                            <TableCell>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            className="h-8 w-8 p-0"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <span className="sr-only">Open menu</span>
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuItem
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                router.push(`/dashboard/orders/details?id=${order.id}`);
                                            }}
                                        >
                                            <Eye className="mr-2 h-4 w-4" />
                                            View Details
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        {/* Add more actions like quick status update here later */}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
