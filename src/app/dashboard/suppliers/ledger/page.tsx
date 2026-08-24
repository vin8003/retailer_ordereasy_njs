'use client';

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '@/services/api';
import { 
    ChevronLeft, CreditCard, History, Loader2, 
    ArrowUpCircle, ArrowDownCircle, Banknote, Calendar,
    Receipt, Wallet, Pencil, Ban, RotateCcw
} from 'lucide-react';
import { toast, Toaster } from 'sonner';
import Link from 'next/link';
import { EMPTY_SUPPLIER_FORM, SupplierFormModal, SupplierFormValues } from '@/components/dashboard/SupplierFormModal';

type FilterType = 'all' | 'today' | 'this_week' | 'this_month' | 'custom';

function getDateRange(filter: FilterType): { start: string; end: string } | null {
    const today = new Date();
    const fmt = (d: Date) => d.toISOString().split('T')[0];
    if (filter === 'today') return { start: fmt(today), end: fmt(today) };
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

const DATE_FILTERS: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All Time' },
    { key: 'today', label: 'Today' },
    { key: 'this_week', label: 'This Week' },
    { key: 'this_month', label: 'This Month' },
    { key: 'custom', label: 'Custom Range' },
];

interface Supplier {
    id: number;
    company_name: string;
    contact_person: string;
    phone_number: string;
    email?: string;
    address?: string;
    balance_due: string | number;
    is_active?: boolean;
}

interface LedgerEntry {
    id: number;
    date: string;
    amount: string;
    transaction_type: 'CREDIT' | 'DEBIT';
    reference_invoice_number: string;
    payment_mode: string;
    notes: string;
    created_at: string;
}

function SupplierLedgerDetails() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    
    const [supplier, setSupplier] = useState<Supplier | null>(null);
    const [ledger, setLedger] = useState<LedgerEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [filter, setFilter] = useState<FilterType>('all');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [showCustom, setShowCustom] = useState(false);
    
    // Payment Form
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [paymentMode, setPaymentMode] = useState('Cash');
    const [paymentNotes, setPaymentNotes] = useState('');
    const [showFormModal, setShowFormModal] = useState(false);
    const [formValues, setFormValues] = useState<SupplierFormValues>(EMPTY_SUPPLIER_FORM);
    const [isSaving, setIsSaving] = useState(false);
    const [isToggling, setIsToggling] = useState(false);

    const fetchData = useCallback(async () => {
        if (!id) return;
        setIsLoading(true);
        try {
            const ledgerParams: Record<string, string> = { supplier: id };
            if (filter !== 'all' && filter !== 'custom') {
                const range = getDateRange(filter);
                if (range) { ledgerParams.start_date = range.start; ledgerParams.end_date = range.end; }
            } else if (filter === 'custom' && customStart && customEnd) {
                ledgerParams.start_date = customStart;
                ledgerParams.end_date = customEnd;
            }
            const [supRes, ledRes] = await Promise.all([
                api.get(`/products/erp/suppliers/${id}/`),
                api.get(`/products/erp/supplier-ledger/`, { params: ledgerParams })
            ]);
            setSupplier(supRes.data);
            setLedger(ledRes.data.results || ledRes.data);
        } catch (error: any) {
            if (error?.response?.status === 404) {
                toast.error("Supplier not found. Please go back and retry.");
            } else {
                toast.error("Failed to load ledger. Please refresh.");
            }
            setSupplier(null);
        } finally {
            setIsLoading(false);
        }
    }, [id, filter, customStart, customEnd]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleFilterChange = (key: FilterType) => {
        setFilter(key);
        setShowCustom(key === 'custom');
    };

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id) return;
        setIsSubmitting(true);
        try {
            await api.post('/products/erp/supplier-ledger/', {
                supplier: id,
                amount: paymentAmount,
                date: paymentDate,
                transaction_type: 'DEBIT',
                payment_mode: paymentMode,
                notes: paymentNotes
            });
            
            toast.success("Payment recorded!");
            setShowPaymentModal(false);
            fetchData();
            setPaymentAmount('');
            setPaymentNotes('');
        } catch (error) {
            toast.error("Failed to record payment");
        } finally {
            setIsSubmitting(false);
        }
    };

    const openEditModal = () => {
        if (!supplier) return;
        setFormValues({
            company_name: supplier.company_name || '',
            contact_person: supplier.contact_person || '',
            phone_number: supplier.phone_number || '',
            email: supplier.email || '',
            address: supplier.address || '',
        });
        setShowFormModal(true);
    };

    const handleSaveSupplier = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id) return;
        setIsSaving(true);
        try {
            await api.patch(`/products/erp/suppliers/${id}/`, {
                company_name: formValues.company_name,
                contact_person: formValues.contact_person,
                phone_number: formValues.phone_number,
                address: formValues.address,
            });
            toast.success("Supplier updated");
            setShowFormModal(false);
            fetchData();
        } catch (error) {
            toast.error("Failed to update supplier");
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggleActive = async () => {
        if (!supplier || !id) return;
        const currentlyActive = supplier.is_active !== false;
        if (currentlyActive && !window.confirm(
            `Deactivate ${supplier.company_name}? They will no longer appear when recording a new purchase. Khata and old bills stay available.`
        )) {
            return;
        }
        setIsToggling(true);
        try {
            await api.patch(`/products/erp/suppliers/${id}/`, { is_active: !currentlyActive });
            toast.success(currentlyActive ? "Supplier deactivated" : "Supplier reactivated");
            fetchData();
        } catch (error) {
            toast.error("Failed to update supplier status");
        } finally {
            setIsToggling(false);
        }
    };

    if (isLoading) return (
        <div className="flex h-[80vh] items-center justify-center">
            <Loader2 className="animate-spin text-primary" size={40} />
        </div>
    );

    if (!supplier) return <div className="p-20 text-center">Supplier not found</div>;

    return (
        <div className="p-4 sm:p-8 max-w-6xl mx-auto font-sans min-h-screen pb-32">
            <Toaster position="top-right" />
            
            <div className="flex items-center gap-3 sm:gap-4 mb-6 md:mb-10">
                <Link href="/dashboard/suppliers">
                    <button className="p-2 sm:p-3 hover:bg-white rounded-xl sm:rounded-2xl border border-gray-100 transition-all text-gray-400 hover:text-gray-900 shadow-sm">
                        <ChevronLeft size={20} className="sm:hidden" />
                        <ChevronLeft size={24} className="hidden sm:block" />
                    </button>
                </Link>
                <div>
                    <h1 className="text-xl sm:text-3xl font-black text-gray-900 tracking-tight uppercase flex flex-wrap items-center gap-2">
                        {supplier.company_name}
                        {supplier.is_active === false && (
                            <span className="text-[10px] font-black uppercase tracking-widest bg-red-50 text-red-600 px-2 py-1 rounded-md">Inactive</span>
                        )}
                    </h1>
                    <p className="text-gray-500 mt-1 text-xs sm:text-base font-medium flex items-center gap-1.5 sm:gap-2">
                        <History size={14} className="sm:hidden" />
                        <History size={16} className="hidden sm:block" /> Transaction History & Ledger
                    </p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <button
                        type="button"
                        onClick={openEditModal}
                        className="p-2 sm:p-3 hover:bg-white rounded-xl sm:rounded-2xl border border-gray-100 transition-all text-gray-400 hover:text-gray-900 shadow-sm"
                        title="Edit"
                    >
                        <Pencil size={18} />
                    </button>
                    <button
                        type="button"
                        onClick={handleToggleActive}
                        disabled={isToggling}
                        className="p-2 sm:p-3 hover:bg-white rounded-xl sm:rounded-2xl border border-gray-100 transition-all text-gray-400 hover:text-gray-900 shadow-sm disabled:opacity-50"
                        title={supplier.is_active === false ? 'Reactivate' : 'Deactivate'}
                    >
                        {isToggling ? <Loader2 size={18} className="animate-spin" /> : supplier.is_active === false ? <RotateCcw size={18} /> : <Ban size={18} />}
                    </button>
                </div>
            </div>

            {/* Date Filter Bar */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 sm:p-4 mb-6 md:mb-8 flex flex-wrap items-center gap-2 sm:gap-3">
                <Calendar size={16} className="text-gray-400 shrink-0 hidden sm:inline" />
                <span className="text-xs font-black text-gray-400 uppercase tracking-widest shrink-0">Filter:</span>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {DATE_FILTERS.map(f => (
                        <button
                            key={f.key}
                            onClick={() => handleFilterChange(f.key)}
                            className={`px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all ${
                                filter === f.key
                                    ? 'bg-gray-900 text-white shadow-md'
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
                            className="border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900 outline-none"
                        />
                        <span className="text-gray-400 text-sm font-bold">to</span>
                        <input
                            type="date"
                            value={customEnd}
                            onChange={e => setCustomEnd(e.target.value)}
                            className="border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900 outline-none"
                        />
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8 mb-6 md:mb-10">
                {/* Summary Card */}
                <div className="lg:col-span-2 bg-gray-900 p-6 sm:p-10 rounded-3xl sm:rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform duration-500">
                        <Wallet size={120} />
                    </div>
                    <div className="relative z-10">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.3em] mb-3 sm:mb-4">Total Outstanding</p>
                        <h2 className="text-3xl sm:text-6xl font-black tracking-tighter mb-6 sm:mb-8">
                            ₹{Number(supplier.balance_due).toLocaleString('en-IN')}
                        </h2>
                        <div className="flex flex-wrap gap-4">
                            <button 
                                onClick={() => setShowPaymentModal(true)}
                                className="w-full sm:w-auto justify-center bg-white text-gray-900 px-6 py-3 sm:px-8 sm:py-4 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider hover:bg-primary hover:text-white transition-all shadow-lg active:scale-95 flex items-center gap-2"
                            >
                                <Banknote size={18} /> Record New Payment
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 sm:p-8 rounded-3xl sm:rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col justify-center">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mb-4 sm:mb-6">Contact Info</p>
                    <div className="grid grid-cols-2 lg:grid-cols-1 gap-4 lg:space-y-6">
                        <div>
                            <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Contact Person</p>
                            <p className="text-sm sm:text-lg font-bold text-gray-900 truncate">{supplier.contact_person || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Mobile Number</p>
                            <p className="text-sm sm:text-lg font-bold text-gray-900 truncate">{supplier.phone_number}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Ledger Table */}
            <div className="bg-white rounded-3xl sm:rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-4 sm:p-8 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-lg sm:text-xl font-black text-gray-900">Account Statement</h3>
                </div>

                <div className="hidden md:block overflow-x-auto p-4">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-black border-b border-gray-50">
                                <th className="p-6">Date</th>
                                <th className="p-6">Description</th>
                                <th className="p-6 text-center">Reference</th>
                                <th className="p-6 text-right">Debit (Payment)</th>
                                <th className="p-6 text-right">Credit (Purchase)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {ledger.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-20 text-center text-gray-400">No transactions recorded yet.</td>
                                </tr>
                            ) : (
                                ledger.map(entry => (
                                    <tr key={entry.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="p-6">
                                            <div className="flex items-center gap-3">
                                                <Calendar size={14} className="text-gray-300" />
                                                <span className="font-bold text-gray-600">{new Date(entry.date).toLocaleDateString()}</span>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex flex-col gap-1">
                                                <span className="font-bold text-gray-900">{entry.notes || (entry.transaction_type === 'CREDIT' ? 'Goods Received' : 'Payment Made')}</span>
                                                <span className="text-xs text-gray-400 font-medium italic">{entry.payment_mode ? `Mode: ${entry.payment_mode}` : ''}</span>
                                            </div>
                                        </td>
                                        <td className="p-6 text-center">
                                            {entry.reference_invoice_number ? (
                                                <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider">
                                                    #{entry.reference_invoice_number}
                                                </span>
                                            ) : '-'}
                                        </td>
                                        <td className="p-6 text-right">
                                            {entry.transaction_type === 'DEBIT' ? (
                                                <span className="text-xl font-black text-green-600 flex items-center justify-end gap-2">
                                                    <ArrowDownCircle size={16} /> ₹{Number(entry.amount).toLocaleString()}
                                                </span>
                                            ) : '-'}
                                        </td>
                                        <td className="p-6 text-right">
                                            {entry.transaction_type === 'CREDIT' ? (
                                                <span className="text-xl font-black text-red-600 flex items-center justify-end gap-2">
                                                    <ArrowUpCircle size={16} /> ₹{Number(entry.amount).toLocaleString()}
                                                </span>
                                            ) : '-'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="block md:hidden divide-y divide-gray-100">
                    {ledger.length === 0 ? (
                        <div className="p-12 text-center text-gray-400">No transactions recorded yet.</div>
                    ) : (
                        ledger.map(entry => (
                            <div key={entry.id} className="p-4 flex flex-col gap-3 hover:bg-gray-50/50 transition-colors">
                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col gap-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={12} className="text-gray-400 flex-shrink-0" />
                                            <span className="text-xs font-bold text-gray-500">{new Date(entry.date).toLocaleDateString()}</span>
                                        </div>
                                        <div className="font-bold text-gray-900 text-sm mt-0.5 line-clamp-2">
                                            {entry.notes || (entry.transaction_type === 'CREDIT' ? 'Goods Received' : 'Payment Made')}
                                        </div>
                                        {entry.payment_mode && (
                                            <span className="text-[10px] text-gray-400 font-medium">Mode: {entry.payment_mode}</span>
                                        )}
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <div className={`text-lg font-black flex items-center justify-end gap-1 ${entry.transaction_type === 'DEBIT' ? 'text-green-600' : 'text-red-600'}`}>
                                            {entry.transaction_type === 'DEBIT' ? '-' : '+'} ₹{Number(entry.amount).toLocaleString('en-IN')}
                                        </div>
                                        <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                                            {entry.transaction_type === 'DEBIT' ? 'Debit (Payment)' : 'Credit (Purchase)'}
                                        </div>
                                    </div>
                                </div>
                                {entry.reference_invoice_number && (
                                    <div className="flex items-center justify-between bg-gray-50 p-2 rounded-xl border border-gray-100/50">
                                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                            <Receipt size={12} className="text-gray-400" />
                                            <span className="font-medium">Ref Invoice</span>
                                        </div>
                                        <span className="bg-white text-gray-600 px-2 py-0.5 rounded border border-gray-200 text-[10px] font-black uppercase tracking-wider">
                                            #{entry.reference_invoice_number}
                                        </span>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Payment Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-black text-gray-900">Record Payment</h2>
                            <CreditCard className="text-primary opacity-20" size={32} />
                        </div>
                        
                        <form onSubmit={handlePayment} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Amount to Pay (₹)</label>
                                <input 
                                    required
                                    type="number"
                                    placeholder="Enter amount"
                                    value={paymentAmount}
                                    onChange={e => setPaymentAmount(e.target.value)}
                                    className="w-full bg-primary/5 border-none rounded-2xl py-4 px-6 text-2xl font-black text-primary placeholder:text-primary/20 focus:ring-4 focus:ring-primary/10"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Payment Date</label>
                                    <input 
                                        type="date"
                                        value={paymentDate}
                                        onChange={e => setPaymentDate(e.target.value)}
                                        className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/10 font-bold text-gray-600"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Mode</label>
                                    <select 
                                        value={paymentMode}
                                        onChange={e => setPaymentMode(e.target.value)}
                                        className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/10 font-bold"
                                    >
                                        <option>Cash</option>
                                        <option>UPI</option>
                                        <option>Bank Transfer</option>
                                        <option>Check</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Internal Notes</label>
                                <textarea 
                                    rows={2}
                                    placeholder="Reference NO, UPI ID, etc..."
                                    value={paymentNotes}
                                    onChange={e => setPaymentNotes(e.target.value)}
                                    className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/10 resize-none"
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button 
                                    type="button"
                                    onClick={() => setShowPaymentModal(false)}
                                    className="flex-1 px-6 py-4 rounded-2xl font-bold bg-gray-100 text-gray-600 hover:bg-gray-200"
                                >
                                    Cancel
                                </button>
                                <button 
                                    disabled={isSubmitting}
                                    type="submit"
                                    className="flex-[2] bg-gray-900 text-white px-6 py-4 rounded-2xl font-bold hover:bg-black shadow-xl transition-all disabled:opacity-50"
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Confirm Payment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            <SupplierFormModal
                open={showFormModal}
                mode="edit"
                values={formValues}
                onChange={setFormValues}
                onClose={() => setShowFormModal(false)}
                onSubmit={handleSaveSupplier}
                isSubmitting={isSaving}
            />
        </div>
    );
}

export default function SupplierLedgerPage() {
    return (
        <Suspense fallback={<div className="flex h-[80vh] items-center justify-center"><Loader2 className="animate-spin text-primary" size={40} /></div>}>
            <SupplierLedgerDetails />
        </Suspense>
    );
}
