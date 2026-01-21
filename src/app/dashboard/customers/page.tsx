'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { customerService, api } from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface RetailerCustomer {
    customerId: number;
    customerName: string;
    phoneNumber?: string;
    profileImage?: string;
    totalOrders: number;
    totalSpent: number;
    averageRating: number;
    joinedDate?: string;
    lastOrderDate?: string;
    isBlacklisted: boolean;
}

export default function CustomersPage() {
    const router = useRouter();
    const [customers, setCustomers] = useState<RetailerCustomer[]>([]);
    const [filteredCustomers, setFilteredCustomers] = useState<RetailerCustomer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filter States
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [sortBy, setSortBy] = useState('Joined Date');

    const fetchCustomers = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await customerService.getRetailerCustomers();
            if (response.status === 200) {
                // Map snake_case to camelCase
                const mappedData = response.data.map((item: any) => ({
                    customerId: item.customer_id,
                    customerName: item.customer_name,
                    phoneNumber: item.phone_number,
                    profileImage: item.profile_image,
                    totalOrders: item.total_orders,
                    totalSpent: item.total_spent ? parseFloat(item.total_spent) : 0,
                    averageRating: item.average_rating ? parseFloat(item.average_rating) : 0,
                    joinedDate: item.joined_date,
                    lastOrderDate: item.last_order_date,
                    isBlacklisted: item.is_blacklisted,
                }));
                setCustomers(mappedData);
            } else {
                throw new Error('Failed to load customers');
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'An error occurred');
            toast.error('Failed to load customers');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    useEffect(() => {
        let result = [...customers];

        // 1. Search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                (c) =>
                    (c.customerName && c.customerName.toLowerCase().includes(query)) ||
                    (c.phoneNumber && c.phoneNumber.includes(query)) ||
                    (c.customerId && c.customerId.toString().includes(query))
            );
        }

        // 2. Status Filter
        if (statusFilter !== 'All') {
            const isBlacklisted = statusFilter === 'Blacklisted';
            result = result.filter((c) => c.isBlacklisted === isBlacklisted);
        }

        // 3. Sort
        result.sort((a, b) => {
            switch (sortBy) {
                case 'Most Orders':
                    return b.totalOrders - a.totalOrders;
                case 'Highest Spent':
                    return b.totalSpent - a.totalSpent;
                case 'Lowest Rating':
                    return a.averageRating - b.averageRating;
                case 'Recent Activity':
                    const dateA = a.lastOrderDate ? new Date(a.lastOrderDate).getTime() : 0;
                    const dateB = b.lastOrderDate ? new Date(b.lastOrderDate).getTime() : 0;
                    return dateB - dateA;
                case 'Joined Date':
                default:
                    const joinedA = a.joinedDate ? new Date(a.joinedDate).getTime() : 0;
                    const joinedB = b.joinedDate ? new Date(b.joinedDate).getTime() : 0;
                    return joinedB - joinedA;
            }
        });

        setFilteredCustomers(result);
    }, [customers, searchQuery, statusFilter, sortBy]);

    // Analytics
    const totalCustomers = customers.length;
    const totalBlacklisted = customers.filter(c => c.isBlacklisted).length;
    const avgRating = customers.length
        ? customers.reduce((sum, c) => sum + (c.averageRating || 0), 0) / customers.length
        : 0;
    const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);

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
            <div className="flex justify-center items-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col justify-center items-center h-96 gap-4">
                <p className="text-red-500">Error: {error}</p>
                <Button onClick={fetchCustomers}>Retry</Button>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
            </div>

            {/* Analytics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Total Customers" value={totalCustomers.toString()} icon="users" color="text-blue-600" />
                <StatCard title="Avg Rating" value={avgRating.toFixed(1)} icon="star" color="text-yellow-500" />
                <StatCard title="Total Revenue" value={formatCurrency(totalRevenue)} icon="indian-rupee" color="text-green-600" />
                <StatCard title="Blacklisted" value={totalBlacklisted.toString()} icon="ban" color="text-red-600" />
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name, ID, phone..."
                            className="pl-8"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="All">All Status</SelectItem>
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="Blacklisted">Blacklisted</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Sort By" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Joined Date">Joined Date</SelectItem>
                            <SelectItem value="Most Orders">Most Orders</SelectItem>
                            <SelectItem value="Highest Spent">Highest Spent</SelectItem>
                            <SelectItem value="Lowest Rating">Lowest Rating</SelectItem>
                            <SelectItem value="Recent Activity">Recent Activity</SelectItem>
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Customer</TableHead>
                                <TableHead>Rating</TableHead>
                                <TableHead>Orders</TableHead>
                                <TableHead>Spent</TableHead>
                                <TableHead>Last Active</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredCustomers.length === 0 ? (
                                <TableRow key="no-customers">
                                    <TableCell colSpan={6} className="text-center h-24">
                                        No customers found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredCustomers.map((customer) => (
                                    <TableRow
                                        key={customer.customerId}
                                        className="cursor-pointer hover:bg-slate-50"
                                        onClick={() => router.push(`/dashboard/customers/${customer.customerId}`)}
                                    >
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar>
                                                    <AvatarImage src={formatImageUrl(customer.profileImage)} />
                                                    <AvatarFallback>{customer.customerName?.[0]?.toUpperCase() || 'C'}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{customer.customerName}</span>
                                                    <span className="text-xs text-muted-foreground">ID: {customer.customerId}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <span className="text-yellow-500">★</span>
                                                <span>{(customer.averageRating || 0).toFixed(1)}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{customer.totalOrders}</TableCell>
                                        <TableCell>{formatCurrency(customer.totalSpent)}</TableCell>
                                        <TableCell>
                                            {customer.lastOrderDate
                                                ? new Date(customer.lastOrderDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })
                                                : '-'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={customer.isBlacklisted ? "destructive" : "secondary"} className={!customer.isBlacklisted ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}>
                                                {customer.isBlacklisted ? 'Blacklisted' : 'Active'}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

function StatCard({ title, value, icon, color }: { title: string; value: string; icon: string; color: string }) {
    // Icons mapping for simplicity (using lucide names properly if importing dynamically, but here hardcoded)
    // Actually, let's keep it simple.
    return (
        <Card>
            <CardContent className="p-6">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <p className="text-2xl font-bold">{value}</p>
                    </div>
                    {/* We could render icon here based on string, but for now just text or simple placeholder if icon lib not fully set up for dynamic */}
                </div>
            </CardContent>
        </Card>
    );
}
