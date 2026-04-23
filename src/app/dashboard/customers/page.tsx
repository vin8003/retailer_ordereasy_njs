'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { customerService } from '@/services/api';
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import { InfiniteScrollTrigger } from '@/components/dashboard/InfiniteScrollTrigger';

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
    registrationStatus?: string;
    isPhoneVerified?: boolean;
    nickname?: string;
}

export default function CustomersPage() {
    const router = useRouter();
    const [customers, setCustomers] = useState<RetailerCustomer[]>([]);
    const [filteredCustomers, setFilteredCustomers] = useState<RetailerCustomer[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [nextPage, setNextPage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Filter States
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [sortBy, setSortBy] = useState('Joined Date');

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<RetailerCustomer | null>(null);
    const [editNickname, setEditNickname] = useState('');
    const [editNotes, setEditNotes] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    const fetchCustomers = useCallback(async (isAppend = false) => {
        if (isAppend) setIsFetchingMore(true);
        else setLoading(true);
        
        setError(null);
        try {
            const params: any = {};
            if (searchQuery) params.search = searchQuery;
            
            if (isAppend && nextPage) {
                const url = new URL(nextPage);
                const p = url.searchParams.get('page');
                if (p) params.page = p;
            }

            const response = await customerService.getRetailerCustomers(params);
            
            // Handle pagination structure
            const resultsData = response.data.results || response.data;
            const nextLink = response.data.next || null;

            const mappedData = resultsData.map((item: any) => ({
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
                registrationStatus: item.registration_status,
                isPhoneVerified: item.is_phone_verified,
                nickname: item.nickname,
            }));

            if (isAppend) {
                setCustomers(prev => [...prev, ...mappedData]);
            } else {
                setCustomers(mappedData);
            }
            setNextPage(nextLink);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'An error occurred');
            toast.error('Failed to load customers');
        } finally {
            setLoading(false);
            setIsFetchingMore(false);
        }
    }, [searchQuery, nextPage]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchCustomers(false);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        let result = [...customers];

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
    }, [customers, statusFilter, sortBy]);

    const handleEditClick = (e: React.MouseEvent, customer: RetailerCustomer) => {
        e.stopPropagation();
        setEditingCustomer(customer);
        setEditNickname(customer.nickname || '');
        setEditNotes(''); 
        setIsEditModalOpen(true);
    };

    const handleUpdateCustomer = async () => {
        if (!editingCustomer) return;
        setIsUpdating(true);
        try {
            const response = await customerService.updateRetailerCustomerMapping(editingCustomer.customerId, {
                nickname: editNickname,
                notes: editNotes
            });
            if (response.status === 200) {
                toast.success('Customer updated successfully');
                setIsEditModalOpen(false);
                fetchCustomers(false);
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to update customer');
        } finally {
            setIsUpdating(false);
        }
    };

    // Analytics (using only currently loaded customers for basic summary, or could fetch from backend)
    const totalCustomersCount = customers.length;
    const totalBlacklistedCount = customers.filter(c => c.isBlacklisted).length;
    const avgRatingValue = customers.length
        ? customers.reduce((sum, c) => sum + (c.averageRating || 0), 0) / customers.length
        : 0;
    const totalRevenueValue = customers.reduce((sum, c) => sum + c.totalSpent, 0);

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


    if (loading && customers.length === 0) {
        return (
            <div className="flex justify-center items-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error && customers.length === 0) {
        return (
            <div className="flex flex-col justify-center items-center h-96 gap-4">
                <p className="text-red-500">Error: {error}</p>
                <Button onClick={() => fetchCustomers(false)}>Retry</Button>
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
                <StatCard title="Total Customers" value={totalCustomersCount.toString()} icon="users" color="text-blue-600" />
                <StatCard title="Avg Rating" value={avgRatingValue.toFixed(1)} icon="star" color="text-yellow-500" />
                <StatCard title="Total Revenue" value={formatCurrency(totalRevenueValue)} icon="indian-rupee" color="text-green-600" />
                <StatCard title="Blacklisted" value={totalBlacklistedCount.toString()} icon="ban" color="text-red-600" />
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
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredCustomers.length === 0 ? (
                                <TableRow key="no-customers">
                                    <TableCell colSpan={7} className="text-center h-24">
                                        No customers found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredCustomers.map((customer) => (
                                    <TableRow
                                        key={customer.customerId}
                                        className="cursor-pointer hover:bg-slate-50 relative group"
                                        onClick={() => router.push(`/dashboard/customers/details?id=${customer.customerId}`)}
                                    >
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar>
                                                    <AvatarImage src={formatImageUrl(customer.profileImage)} />
                                                    <AvatarFallback>{customer.customerName?.[0]?.toUpperCase() || 'C'}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">{customer.customerName}</span>
                                                        <Badge variant="outline" className={`text-[10px] h-4 px-1 ${
                                                            (customer.registrationStatus === 'registered' || customer.isPhoneVerified) 
                                                            ? 'border-blue-200 text-blue-700 bg-blue-50' 
                                                            : 'border-slate-200 text-slate-600 bg-slate-50'
                                                        }`}>
                                                            {(customer.registrationStatus === 'registered' || customer.isPhoneVerified) ? 'App User' : 'Walk-in'}
                                                        </Badge>
                                                    </div>
                                                    <span className="text-xs text-muted-foreground">ID: {customer.customerId} • {customer.phoneNumber}</span>
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
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="opacity-0 group-hover:opacity-100"
                                                onClick={(e) => handleEditClick(e, customer)}
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <InfiniteScrollTrigger 
                onLoadMore={() => fetchCustomers(true)}
                hasMore={!!nextPage}
                isLoading={isFetchingMore}
            />

            {/* Edit Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Customer Info</DialogTitle>
                        <DialogDescription>
                            Update nickname and notes for {editingCustomer?.customerName}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="nickname">Nickname (Personal reference)</Label>
                            <Input
                                id="nickname"
                                value={editNickname}
                                onChange={(e) => setEditNickname(e.target.value)}
                                placeholder="e.g. Sharma Ji"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="notes">Private Notes (Only you can see this)</Label>
                            <Textarea
                                id="notes"
                                value={editNotes}
                                onChange={(e) => setEditNotes(e.target.value)}
                                placeholder="Enter any notes about this customer..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleUpdateCustomer} disabled={isUpdating}>
                            {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function StatCard({ title, value, icon, color }: { title: string; value: string; icon: string; color: string }) {
    return (
        <Card>
            <CardContent className="p-6">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <p className="text-2xl font-bold">{value}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
