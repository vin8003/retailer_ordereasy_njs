'use client';

import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import { 
    BarChart3, Calendar, IndianRupee, ShoppingCart, 
    TrendingUp, Smartphone, Banknote, Loader2,
    ArrowUpRight, ArrowDownRight, Printer, RefreshCcw
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';

interface DailySummary {
    date: string;
    total_sales: number;
    order_count: number;
    cash_sales: number;
    digital_sales: number;
    pos_sales: number;
    online_sales: number;
    cash_refunds: number;
    upi_refunds: number;
    shop_name: string;
}

export default function ReportsPage() {
    const [summary, setSummary] = useState<DailySummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchSummary = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/products/erp/daily-sales-summary/');
            setSummary(res.data);
        } catch (error) {
            toast.error("Failed to load daily summary");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSummary();
    }, []);

    if (isLoading) return (
        <div className="flex h-[80vh] items-center justify-center">
            <Loader2 className="animate-spin text-primary" size={40} />
        </div>
    );

    if (!summary) return <div>Failed to load summary.</div>;

    const cashPercentage = summary.total_sales > 0 ? (summary.cash_sales / summary.total_sales) * 100 : 0;
    const digitalPercentage = summary.total_sales > 0 ? (summary.digital_sales / summary.total_sales) * 100 : 0;

    return (
        <div className="p-8 max-w-6xl mx-auto font-sans min-h-screen pb-32">
            <Toaster position="top-right" />
            
            <div className="flex justify-between items-end mb-10">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <BarChart3 size={36} className="text-primary" /> Daily Sales Report
                    </h1>
                    <p className="text-gray-500 mt-1 font-medium italic">Closing summary for {new Date(summary.date).toLocaleDateString('en-IN', { dateStyle: 'full' })}</p>
                </div>
                <button 
                    onClick={fetchSummary}
                    className="flex items-center gap-2 bg-white border border-gray-100 p-3 px-5 rounded-2xl hover:bg-gray-50 transition-all shadow-sm font-bold text-gray-600"
                >
                    <RefreshCcw size={18} /> Refresh
                </button>
            </div>

            {/* Main Total Card */}
            <div className="bg-primary p-12 rounded-[3rem] text-primary-foreground shadow-2xl shadow-primary/20 mb-10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform duration-700">
                    <TrendingUp size={140} />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="text-center md:text-left">
                        <p className="text-xs font-bold opacity-70 uppercase tracking-[0.3em] mb-4 text-white">Total Sales Today</p>
                        <h2 className="text-7xl font-black tracking-tighter mb-2">₹{summary.total_sales.toLocaleString('en-IN')}</h2>
                        <div className="flex items-center gap-2 opacity-90">
                            <ShoppingCart size={18} />
                            <span className="font-bold">{summary.order_count} Orders Processed</span>
                        </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md p-6 px-10 rounded-[2rem] border border-white/10 text-center">
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1 text-white">Avg Order Value</p>
                        <p className="text-3xl font-black text-white">₹{summary.order_count > 0 ? (summary.total_sales / summary.order_count).toFixed(0) : '0'}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                {/* Cash vs Digital */}
                <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm relative overflow-hidden">
                    <h3 className="text-lg font-black text-gray-900 mb-8 border-b border-gray-50 pb-4">Payment Breakdown</h3>
                    
                    <div className="space-y-8">
                        <div>
                            <div className="flex justify-between items-end mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-green-50 text-green-600 rounded-2xl"><Banknote size={24} /></div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Cash in Hand</p>
                                        <div className="flex items-baseline gap-2">
                                            <p className="text-2xl font-black text-gray-900">₹{summary.cash_sales.toLocaleString()}</p>
                                            {summary.cash_refunds > 0 && (
                                                <span className="text-[10px] font-bold text-red-500">(-₹{summary.cash_refunds})</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <span className="text-xs font-black text-green-600 bg-green-50 px-3 py-1 rounded-full">{cashPercentage.toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-gray-50 h-3 rounded-full overflow-hidden">
                                <div className="bg-green-500 h-full rounded-full transition-all duration-1000" style={{ width: `${cashPercentage}%` }} />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-end mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Smartphone size={24} /></div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Digital Payments</p>
                                        <div className="flex items-baseline gap-2">
                                            <p className="text-2xl font-black text-gray-900">₹{summary.digital_sales.toLocaleString()}</p>
                                            {summary.upi_refunds > 0 && (
                                                <span className="text-[10px] font-bold text-red-500">(-₹{summary.upi_refunds})</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <span className="text-xs font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{digitalPercentage.toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-gray-50 h-3 rounded-full overflow-hidden">
                                <div className="bg-blue-500 h-full rounded-full transition-all duration-1000" style={{ width: `${digitalPercentage}%` }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Source Breakdown */}
                <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-black text-gray-900 mb-8 border-b border-gray-50 pb-4">Channel Performance</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 flex flex-col items-center text-center">
                            <div className="size-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-primary mb-4">
                                <ArrowUpRight size={24} />
                            </div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">POS Sales</p>
                            <p className="text-3xl font-black text-gray-900">₹{summary.pos_sales.toLocaleString()}</p>
                        </div>
                        <div className="p-8 bg-gray-900 text-white rounded-[2.5rem] flex flex-col items-center text-center">
                            <div className="size-12 bg-white/10 rounded-2xl flex items-center justify-center text-white mb-4">
                                <ArrowDownRight size={24} />
                            </div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Online Store</p>
                            <p className="text-3xl font-black text-white">₹{summary.online_sales.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Printer Button */}
            <div className="flex justify-center">
                <button 
                    onClick={() => window.print()}
                    className="flex items-center gap-3 bg-gray-900 text-white p-5 px-10 rounded-3xl hover:bg-black transition-all shadow-xl shadow-gray-200 font-bold active:scale-95 no-print"
                >
                    <Printer size={20} /> Print Closing Summary
                </button>
            </div>

            <style jsx global>{`
                @media print {
                    .no-print { display: none !important; }
                    aside, header { display: none !important; }
                    main { padding: 0 !important; margin: 0 !important; }
                }
            `}</style>
        </div>
    );
}
