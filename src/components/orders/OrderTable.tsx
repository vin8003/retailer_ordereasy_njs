"use client";

import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Eye, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

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
    customer_average_rating?: number;
    source?: string;
    refund_amount: number;
    net_amount: number;
    is_returned: boolean;
}

interface OrderTableProps {
    orders: Order[];
    isLoading: boolean;
}

export function OrderTable({ orders, isLoading }: OrderTableProps) {
    const router = useRouter();

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100';
            case 'waiting_for_customer_approval': return 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100';
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

    const getSourceBadge = (source?: string) => {
        if (source === 'pos') {
            return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 shadow-none text-[10px] px-1.5 py-0 mt-1.5">Store Order 🏪</Badge>;
        }
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 shadow-none text-[10px] px-1.5 py-0 mt-1.5">Online Order 📱</Badge>;
    };

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground">Loading orders...</div>;
    }

    if (orders.length === 0) {
        return <div className="p-8 text-center text-muted-foreground">No orders found.</div>;
    }

    return (
        <div className="space-y-4">
            {/* Desktop Table View */}
            <div className="hidden md:block rounded-md border">
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
                                <TableCell className="font-medium">
                                    <div className="flex flex-col items-start leading-tight">
                                        <span>{order.order_number}</span>
                                        {getSourceBadge(order.source)}
                                    </div>
                                </TableCell>
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
                                    <div className="font-medium">
                                        {order.customer_name || 
                                         (order.customer?.first_name 
                                            ? `${order.customer.first_name} ${order.customer.last_name || ''}` 
                                            : 'Customer')}
                                    </div>
                                    {order.customer_average_rating !== undefined && order.customer_average_rating > 0 ? (
                                        <div className={cn(
                                            "flex items-center gap-1 text-xs font-semibold mt-1",
                                            order.customer_average_rating > 4 ? "text-green-600" :
                                            order.customer_average_rating > 2.5 ? "text-yellow-600" :
                                            "text-red-600"
                                        )}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-star"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                                            {Number(order.customer_average_rating).toFixed(1)}
                                        </div>
                                    ) : (
                                        <div className="text-[10px] text-muted-foreground mt-1 font-medium italic">No rating yet</div>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-1 items-start">
                                        <Badge variant="outline" className={cn("font-bold border shadow-none", getStatusColor(order.status))}>
                                            {order.status === 'waiting_for_customer_approval' ? 'WAITING APPROVAL' : order.status.toUpperCase()}
                                        </Badge>
                                        {order.is_returned && (
                                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 shadow-none text-[10px] px-1.5 py-0 font-black">
                                                PARTIAL RETURN ↩️
                                            </Badge>
                                        )}
                                        {order.feedback && (
                                            <div className="flex items-center gap-1 text-xs text-yellow-600 font-medium">
                                                <span>{order.feedback.overall_rating}</span>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="#facc15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-star"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                                            </div>
                                        )}
                                    </div>
                                </TableCell>
                                 <TableCell className="text-right">
                                    <div className="flex flex-col items-end">
                                        <span className={cn("font-bold", order.is_returned && "text-gray-400 line-through text-xs font-medium decoration-red-400")}>
                                            ₹{Number(order.total_amount).toLocaleString('en-IN')}
                                        </span>
                                        {order.is_returned && (
                                            <span className="text-sm font-black text-gray-900 bg-yellow-50 px-2 py-0.5 rounded-lg border border-yellow-100">
                                                ₹{Number(order.net_amount).toLocaleString('en-IN')}
                                            </span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                className="h-12 w-12 p-0 min-h-[48px] min-w-[48px]"
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
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Mobile Card List View */}
            <div className="block md:hidden space-y-3">
                {orders.map((order) => (
                    <div
                        key={order.id}
                        onClick={() => router.push(`/dashboard/orders/details?id=${order.id}`)}
                        className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm active:bg-gray-50 transition-colors flex flex-col gap-3 cursor-pointer"
                    >
                        <div className="flex justify-between items-start">
                            <div className="flex flex-col gap-1">
                                <span className="font-bold text-gray-800 text-[15px]">{order.order_number}</span>
                                <div className="flex gap-1.5 items-center">
                                    {getSourceBadge(order.source)}
                                    <span className="text-[10px] text-muted-foreground font-semibold">
                                        {format(new Date(order.created_at), "MMM d, h:mm a")}
                                    </span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className={cn("font-extrabold text-base text-gray-900", order.is_returned && "text-gray-400 line-through text-xs font-semibold decoration-red-400")}>
                                    ₹{Number(order.total_amount).toLocaleString('en-IN')}
                                </span>
                                {order.is_returned && (
                                    <span className="text-sm font-black text-gray-900 bg-yellow-50 px-2 py-0.5 rounded-lg border border-yellow-100 mt-1">
                                        ₹{Number(order.net_amount).toLocaleString('en-IN')}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-gray-600">
                                    {order.customer_name || 
                                     (order.customer?.first_name 
                                        ? `${order.customer.first_name} ${order.customer.last_name || ''}` 
                                        : 'Customer')}
                                </span>
                                {order.customer_average_rating !== undefined && order.customer_average_rating > 0 && (
                                    <div className="flex items-center gap-1 text-[10px] font-bold text-yellow-600 mt-0.5">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" className="lucide lucide-star"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                                        {Number(order.customer_average_rating).toFixed(1)} Rating
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col gap-1 items-end">
                                <Badge variant="outline" className={cn("font-black border shadow-none text-[9px] px-2 py-0.5", getStatusColor(order.status))}>
                                    {order.status === 'waiting_for_customer_approval' ? 'WAITING' : order.status.toUpperCase()}
                                </Badge>
                                {order.is_returned && (
                                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 shadow-none text-[8px] px-1.5 py-0 font-black">
                                        RETURN ↩️
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
