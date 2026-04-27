'use client';

import React, { useState, useEffect, useCallback } from 'react';
import api from '@/services/api';
import Link from 'next/link';
import { Package, Plus, IndianRupee, TrendingUp, AlertCircle, Calendar, Truck, ArrowRight, Pencil, ChevronDown, RotateCcw } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import PurchaseReturnModal from '@/components/dashboard/PurchaseReturnModal';
import { InfiniteScrollTrigger } from '@/components/dashboard/InfiniteScrollTrigger';

type FilterType = 'all' | 'today' | 'this_week' | 'this_month' | 'custom';

function getDateRange(filter: FilterType): { start: string; end: string } | null {
    const today = new Date();
    const fmt = (d: Date) => d.toISOString().split('T')[0];

    if (filter === 'today') {
        return { start: fmt(today), end: fmt(today) };
    }
    if (filter === 'this_week') {
        const day = today.getDay();
        const mon = new Date(today); mon.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
        return { start: fmt(mon), end: fmt(today) };
    }
    if (filter === 'this_month') {
        const start = new Date(today.getFullYear(), today.getMonth(), 1);
        return { start: fmt(start), end: fmt(today) };
    }
    return null;
}

export default function PurchasesPage() {
    const [invoices, setInvoices] = useState<any[]>([]);
    const [dashboardStats, setDashboardStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [nextPage, setNextPage] = useState<string | null>(null);
    const [filter, setFilter] = useState<FilterType>('all');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [showCustom, setShowCustom] = useState(false);
    
    // Return Modal State
    const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
    const [selectedInvoiceForReturn, setSelectedInvoiceForReturn] = useState<number | undefined>(undefined);

    const fetchData = useCallback(async (isAppend = false) => {
        if (isAppend) setIsFetchingMore(true);
        else setIsLoading(true);

        try {
            const params: Record<string, string> = {};
            if (filter !== 'all' && filter !== 'custom') {
                const range = getDateRange(filter);
                if (range) { params.start_date = range.start; params.end_date = range.end; }
            } else if (filter === 'custom' && customStart && customEnd) {
                params.start_date = customStart;
                params.end_date = customEnd;
            }

            // Simplification for merging: fetch both without infinite scroll pagination for now,
            // or just rely on next from invoices if we really need it.
            // Ideally we'd need a unified backend endpoint for true infinite scroll across mixed types.
            // For now, we fetch both and merge.
            const [invRes, retRes, dashRes] = await Promise.all([
                api.get('/products/erp/purchase-invoices/', { params }),
                api.get('/returns/purchase/', { params }),
                isAppend ? Promise.resolve(null) : api.get('/products/erp/dashboard/summary/')
            ]);
            
            const invData = (invRes.data.results ?? invRes.data).map((item: any) => ({...item, type: 'invoice'}));
            const retData = (retRes.data.results ?? retRes.data).map((item: any) => ({...item, type: 'return'}));
            
            const merged = [...invData, ...retData].sort((a: any, b: any) => {
                const dateA = new Date(a.created_at).getTime();
                const dateB = new Date(b.created_at).getTime();
                return dateB - dateA;
            });

            // We will disable infinite scroll for the merged view as it requires complex backend coordination
            setInvoices(merged);
            setNextPage(null);
            
            if (dashRes) setDashboardStats(dashRes.data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load purchase history");
        } finally {
            setIsLoading(false);
            setIsFetchingMore(false);
        }
    }, [filter, customStart, customEnd]);

    useEffect(() => { fetchData(false); }, [filter, customStart, customEnd]);

    const FILTERS: { key: FilterType; label: string }[] = [
        { key: 'all', label: 'All Time' },
        { key: 'today', label: 'Today' },
        { key: 'this_week', label: 'This Week' },
        { key: 'this_month', label: 'This Month' },
        { key: 'custom', label: 'Custom Range' },
    ];

    const handleFilterChange = (key: FilterType) => {
        setFilter(key);
        setShowCustom(key === 'custom');
    };

    const totalPurchases = invoices.reduce((s, i) => s + Number(i.total_amount), 0);
    const unpaidBalance = invoices.reduce((s, i) => s + (Number(i.total_amount) - Number(i.paid_amount)), 0);

    return (
        <div className="p-8 max-w-7xl mx-auto font-sans">
            <Toaster position="top-right" />

            {/* Header */}
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <div className="p-2.5 bg-primary/10 text-primary rounded-xl"><Package size={28} /></div>
                        Purchase Invoices
                    </h1>
                    <p className="text-gray-500 mt-2 ml-14">Track distributor stock inwards and manage supplier khata.</p>
                </div>
                <div className="flex gap-4">
                    <button 
                        onClick={() => {
                            setSelectedInvoiceForReturn(undefined);
                            setIsReturnModalOpen(true);
                        }}
                        className="bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95"
                    >
                        <RotateCcw size={20} /> Create Return
                    </button>
                    <Link href="/dashboard/purchases/new">
                        <button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95 hover:-translate-y-0.5">
                            <Plus size={20} /> Record Inward Stock
                        </button>
                    </Link>
                </div>
            </div>

            {/* Date Filter Bar */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6 flex flex-wrap items-center gap-3">
                <Calendar size={16} className="text-gray-400 shrink-0" />
                <span className="text-xs font-black text-gray-400 uppercase tracking-widest shrink-0">Filter by Date:</span>
                <div className="flex flex-wrap gap-2">
                    {FILTERS.map(f => (
                        <button
                            key={f.key}
                            onClick={() => handleFilterChange(f.key)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                                filter === f.key
                                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
                {showCustom && (
                    <div className="flex items-center gap-2 ml-auto flex-wrap">
                        <input
                            type="date"
                            value={customStart}
                            onChange={e => setCustomStart(e.target.value)}
                            className="border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        />
                        <span className="text-gray-400 text-sm font-bold">to</span>
                        <input
                            type="date"
                            value={customEnd}
                            onChange={e => setCustomEnd(e.target.value)}
                            className="border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        />
                    </div>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-3xl border border-red-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute -right-6 -top-6 bg-red-50 w-24 h-24 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Total Khata Debt</p>
                        <h3 className="text-3xl font-black text-red-600">₹{dashboardStats?.total_outstanding_debt?.toLocaleString('en-IN') || 0}</h3>
                        <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold">LIFETIME ALL SUPPLIERS</p>
                    </div>
                </div>
                {dashboardStats?.total_advance_paid > 0 && (
                    <div className="bg-white p-6 rounded-3xl border border-green-100 shadow-sm relative overflow-hidden group col-span-1">
                        <div className="absolute -right-6 -top-6 bg-green-50 w-24 h-24 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
                        <div className="relative z-10">
                            <p className="text-[10px] font-black text-green-500 uppercase tracking-widest mb-1">Advance Paid</p>
                            <h3 className="text-3xl font-black text-green-600">₹{dashboardStats.total_advance_paid.toLocaleString('en-IN')}</h3>
                        </div>
                    </div>
                )}
                <div className={`bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group ${dashboardStats?.total_advance_paid > 0 ? '' : 'md:col-span-1'}`}>
                    <div className="absolute -right-6 -top-6 bg-blue-50 w-24 h-24 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
                    <div className="relative z-10">
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Listed Purchases</p>
                        <h3 className="text-3xl font-black text-gray-900">₹{totalPurchases.toLocaleString('en-IN')}</h3>
                        <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold text-ellipsis line-clamp-1">For Filtered Dates</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute -right-6 -top-6 bg-orange-50 w-24 h-24 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
                    <div className="relative z-10">
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Listed Unpaid</p>
                        <h3 className="text-3xl font-black text-gray-900">₹{unpaidBalance.toLocaleString('en-IN')}</h3>
                        <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold">For Filtered Dates</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group hidden md:block">
                    <div className="absolute -right-6 -top-6 bg-gray-50 w-24 h-24 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
                    <div className="relative z-10">
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Invoices Found</p>
                        <h3 className="text-3xl font-black text-gray-900">{invoices.length}</h3>
                    </div>
                </div>
            </div>

            {/* Invoices List */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <IndianRupee className="text-gray-400" /> Purchase Bills
                    </h3>
                    {filter !== 'all' && (
                        <span className="text-xs font-bold bg-primary/10 text-primary px-3 py-1 rounded-full uppercase tracking-wider">
                            {FILTERS.find(f => f.key === filter)?.label}
                        </span>
                    )}
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white border-b border-gray-100 text-xs uppercase tracking-wider text-gray-400 font-bold">
                                <th className="p-4 pl-6">Invoice No.</th>
                                <th className="p-4">Date</th>
                                <th className="p-4">Supplier</th>
                                <th className="p-4 text-right">Items</th>
                                <th className="p-4 text-right">Total Amount</th>
                                <th className="p-4 text-center">Status</th>
                                <th className="p-4 pr-6"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading ? (
                                <tr><td colSpan={7} className="p-12 text-center text-gray-400">
                                    <div className="flex justify-center mb-2"><TrendingUp className="animate-pulse" /></div>
                                    Loading records...
                                </td></tr>
                            ) : invoices.length === 0 ? (
                                <tr><td colSpan={7} className="p-12 text-center text-gray-400">
                                    <div className="flex justify-center mb-3"><AlertCircle size={32} className="text-gray-300" /></div>
                                    <p className="text-lg font-medium text-gray-600">No purchases found for this period</p>
                                    <p className="text-sm mt-1">Try changing the date filter or record a new inward bill.</p>
                                </td></tr>
                            ) : (
                                invoices.map((item) => {
                                    if (item.type === 'invoice') {
                                        return (
                                            <tr key={`inv-${item.id}`} className="hover:bg-gray-50/50 transition-colors group">
                                                <td className="p-4 pl-6 font-bold text-gray-900">{item.invoice_number || `INV-${item.id}`}</td>
                                                <td className="p-4 text-gray-600">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar size={14} className="text-gray-400" />
                                                        {new Date(item.invoice_date || item.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </div>
                                                </td>
                                                <td className="p-4 font-medium text-gray-900">
                                                    <div className="flex items-center gap-2">
                                                        <Truck size={14} className="text-gray-400" />
                                                        {item.supplier_name || 'Unknown Distributor'}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-right font-medium text-gray-600">{item.items?.length || 0}</td>
                                                <td className="p-4 text-right">
                                                    <span className="font-bold text-gray-900">
                                                        ₹{Number(item.total_amount).toLocaleString('en-IN')}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                                                        item.payment_status === 'PAID' ? 'bg-green-100 text-green-700' :
                                                        item.payment_status === 'PARTIAL' ? 'bg-orange-100 text-orange-700' :
                                                        'bg-red-100 text-red-700'
                                                    }`}>
                                                        {item.payment_status || 'UNPAID'}
                                                    </span>
                                                </td>
                                                <td className="p-4 pr-6 text-right">
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Link href={`/dashboard/purchases/edit?id=${item.id}`}>
                                                            <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit Bill">
                                                                <Pencil size={18} />
                                                            </button>
                                                        </Link>
                                                        <button 
                                                            onClick={() => {
                                                                setSelectedInvoiceForReturn(item.id);
                                                                setIsReturnModalOpen(true);
                                                            }}
                                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Return items from this bill"
                                                        >
                                                            <RotateCcw size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    } else {
                                        return (
                                            <tr key={`ret-${item.id}`} className="hover:bg-red-50/50 transition-colors group bg-red-50/20 border-l-4 border-l-red-500">
                                                <td className="p-4 pl-5 font-bold text-red-700">
                                                    <div className="flex flex-col">
                                                        <span>{item.return_number || `RET-${item.id}`}</span>
                                                        <span className="text-[10px] text-red-400 font-medium mt-0.5">Against {item.invoice_number}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-red-600">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar size={14} className="text-red-400" />
                                                        {new Date(item.return_date || item.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </div>
                                                </td>
                                                <td className="p-4 font-medium text-red-900">
                                                    <div className="flex items-center gap-2">
                                                        <Truck size={14} className="text-red-400" />
                                                        {item.supplier_name || 'Unknown Distributor'}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-right font-medium text-red-600">{item.items?.length || 0}</td>
                                                <td className="p-4 text-right">
                                                    <span className="font-black text-red-600">
                                                        -₹{Number(item.total_amount).toLocaleString('en-IN')}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-red-100 text-red-700">
                                                        RETURN
                                                    </span>
                                                </td>
                                                <td className="p-4 pr-6 text-right">
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Link href={`/dashboard/purchases/return-detail?id=${item.id}`}>
                                                            <button className="p-2 text-red-400 hover:text-red-700 hover:bg-red-100 rounded-lg transition-colors" title="View Return Details">
                                                                <ArrowRight size={18} />
                                                            </button>
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    }
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <PurchaseReturnModal 
                isOpen={isReturnModalOpen}
                invoiceId={selectedInvoiceForReturn}
                onClose={() => setIsReturnModalOpen(false)}
                onSuccess={() => {
                    fetchData(false);
                }}
            />

            <InfiniteScrollTrigger 
                onLoadMore={() => fetchData(true)}
                hasMore={!!nextPage}
                isLoading={isFetchingMore}
            />
        </div>
    );
}
