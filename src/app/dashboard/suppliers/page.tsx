'use client';

import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import { 
    BookOpen, Search, User, Phone, 
    ArrowRight, CreditCard, Loader2,
    UserPlus, Mail, Pencil, Ban, RotateCcw, X
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import Link from 'next/link';
import { InfiniteScrollTrigger } from '@/components/dashboard/InfiniteScrollTrigger';
import { EMPTY_SUPPLIER_FORM, SupplierFormModal, SupplierFormValues } from '@/components/dashboard/SupplierFormModal';

interface Supplier {
    id: number;
    company_name: string;
    contact_person: string;
    phone_number: string;
    email: string;
    address: string;
    balance_due: string | number;
    is_active?: boolean;
}

const DEACTIVATE_CONFIRM = (name: string) =>
    `Deactivate ${name}? They will no longer appear when recording a new purchase. Khata and old bills stay available.`;

export default function SuppliersPage() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [nextPage, setNextPage] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showFormModal, setShowFormModal] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [formValues, setFormValues] = useState<SupplierFormValues>(EMPTY_SUPPLIER_FORM);
    const [isSaving, setIsSaving] = useState(false);
    const [togglingId, setTogglingId] = useState<number | null>(null);

    useEffect(() => {
        setIsLoading(true);
        const timer = setTimeout(() => {
            fetchSuppliers(false);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const fetchSuppliers = async (isAppend = false) => {
        if (isAppend) setIsFetchingMore(true);
        else setIsLoading(true);
        
        try {
            const params: any = {};
            const query = searchTerm.trim();
            if (query) params.search = query;
            
            if (isAppend && nextPage) {
                const url = new URL(nextPage);
                const page = url.searchParams.get('page');
                if (page) params.page = page;
            }

            const res = await api.get('/products/erp/suppliers/', { params });
            const data = res.data.results || res.data;
            const next = res.data.next || null;
            
            if (isAppend) {
                setSuppliers(prev => [...prev, ...data]);
            } else {
                setSuppliers(data);
            }
            setNextPage(next);
        } catch (error) {
            toast.error("Failed to load suppliers");
        } finally {
            setIsLoading(false);
            setIsFetchingMore(false);
        }
    };

    const openAddModal = () => {
        setEditingSupplier(null);
        setFormValues(EMPTY_SUPPLIER_FORM);
        setShowFormModal(true);
    };

    const openEditModal = (supplier: Supplier) => {
        setEditingSupplier(supplier);
        setFormValues({
            company_name: supplier.company_name || '',
            contact_person: supplier.contact_person || '',
            phone_number: supplier.phone_number || '',
            email: supplier.email || '',
            address: supplier.address || '',
        });
        setShowFormModal(true);
    };

    const closeFormModal = () => {
        setShowFormModal(false);
        setEditingSupplier(null);
        setFormValues(EMPTY_SUPPLIER_FORM);
    };

    const handleSaveSupplier = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const details = {
            company_name: formValues.company_name,
            contact_person: formValues.contact_person,
            phone_number: formValues.phone_number,
            address: formValues.address,
        };
        try {
            if (editingSupplier) {
                await api.patch(`/products/erp/suppliers/${editingSupplier.id}/`, details);
                toast.success("Supplier updated");
            } else {
                await api.post('/products/erp/suppliers/', { ...details, email: formValues.email });
                toast.success("Supplier added successfully");
            }
            closeFormModal();
            fetchSuppliers();
        } catch (error) {
            toast.error(editingSupplier ? "Failed to update supplier" : "Failed to add supplier");
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggleActive = async (supplier: Supplier) => {
        const currentlyActive = supplier.is_active !== false;
        if (currentlyActive && !window.confirm(DEACTIVATE_CONFIRM(supplier.company_name))) {
            return;
        }
        setTogglingId(supplier.id);
        try {
            await api.patch(`/products/erp/suppliers/${supplier.id}/`, { is_active: !currentlyActive });
            toast.success(currentlyActive ? "Supplier deactivated" : "Supplier reactivated");
            fetchSuppliers();
        } catch (error) {
            toast.error("Failed to update supplier status");
        } finally {
            setTogglingId(null);
        }
    };

    const filteredSuppliers = suppliers;
    const hasSearchQuery = searchTerm.trim().length > 0;
    const emptyTitle = hasSearchQuery ? 'No matching suppliers' : 'No suppliers found';
    const emptySubtitle = hasSearchQuery
        ? 'Try a different company name or phone number.'
        : 'Add a new distributor to start managing their khata.';

    const totalDebt = suppliers.filter(s => Number(s.balance_due) > 0).reduce((sum, s) => sum + Number(s.balance_due), 0);
    const totalAdvance = suppliers.filter(s => Number(s.balance_due) < 0).reduce((sum, s) => sum + Math.abs(Number(s.balance_due)), 0);

    const renderActions = (supplier: Supplier, compact = false) => {
        const active = supplier.is_active !== false;
        const busy = togglingId === supplier.id;
        return (
            <div className={`flex items-center ${compact ? 'gap-1.5' : 'justify-end gap-2'}`}>
                <button
                    type="button"
                    onClick={() => openEditModal(supplier)}
                    className="bg-gray-50 hover:bg-primary hover:text-white p-2.5 sm:p-3 rounded-xl sm:rounded-2xl text-gray-400 transition-all"
                    title="Edit"
                >
                    <Pencil size={compact ? 14 : 18} />
                </button>
                <button
                    type="button"
                    onClick={() => handleToggleActive(supplier)}
                    disabled={busy}
                    className="bg-gray-50 hover:bg-primary hover:text-white p-2.5 sm:p-3 rounded-xl sm:rounded-2xl text-gray-400 transition-all disabled:opacity-50"
                    title={active ? 'Deactivate' : 'Reactivate'}
                >
                    {busy ? <Loader2 size={compact ? 14 : 18} className="animate-spin" /> : active ? <Ban size={compact ? 14 : 18} /> : <RotateCcw size={compact ? 14 : 18} />}
                </button>
                <Link href={`/dashboard/suppliers/ledger?id=${supplier.id}`}>
                    <button className="bg-gray-50 hover:bg-primary hover:text-white p-2.5 sm:p-3 rounded-xl sm:rounded-2xl text-gray-400 transition-all group-hover:shadow-lg group-hover:shadow-primary/20">
                        <ArrowRight size={compact ? 14 : 20} />
                    </button>
                </Link>
            </div>
        );
    };

    return (
        <div className="p-4 sm:p-8 max-w-7xl mx-auto font-sans">
            <Toaster position="top-right" />
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 md:mb-10">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <div className="p-2 sm:p-2.5 bg-primary/10 text-primary rounded-xl overflow-hidden relative">
                             <div className="absolute inset-0 bg-primary/20 animate-pulse opacity-50"></div>
                            <BookOpen size={24} className="relative z-10 sm:hidden" />
                            <BookOpen size={28} className="relative z-10 hidden sm:block" />
                        </div>
                        Khata & Suppliers
                    </h1>
                    <p className="text-gray-500 mt-2 ml-12 sm:ml-14 text-sm sm:text-base">Manage distributor relations and outstanding credit balances.</p>
                </div>
                <button 
                    onClick={openAddModal}
                    className="w-full sm:w-auto justify-center bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 px-4 py-3 sm:px-6 sm:py-4 rounded-xl sm:rounded-2xl font-bold flex items-center gap-2 transition-all hover:-translate-y-1 active:scale-95"
                >
                    <UserPlus size={20} /> Add New Distributor
                </button>
            </div>

            {/* Top Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-6 md:mb-10">
                <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-red-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute -right-6 -top-6 bg-red-50 w-24 h-24 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Total Debt</p>
                        <h3 className="text-2xl sm:text-3xl font-black text-red-600 tracking-tight">₹{totalDebt.toLocaleString('en-IN')}</h3>
                        <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold">LIFETIME ALL SUPPLIERS</p>
                    </div>
                </div>

                {totalAdvance > 0 && (
                    <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-green-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute -right-6 -top-6 bg-green-50 w-24 h-24 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
                        <div className="relative z-10">
                            <p className="text-[10px] font-black text-green-500 uppercase tracking-widest mb-1">Advance Paid</p>
                            <h3 className="text-2xl sm:text-3xl font-black text-green-600 tracking-tight">₹{totalAdvance.toLocaleString('en-IN')}</h3>
                            <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold">Extra payments pool</p>
                        </div>
                    </div>
                )}

                <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Credit Invoices</p>
                        <h3 className="text-2xl sm:text-3xl font-black text-gray-900">{suppliers.filter(s => Number(s.balance_due) > 0).length}</h3>
                    </div>
                    <div className="size-10 sm:size-14 bg-orange-50 rounded-xl sm:rounded-2xl flex items-center justify-center text-orange-500 flex-shrink-0">
                        <CreditCard size={20} className="sm:hidden" />
                        <CreditCard size={28} className="hidden sm:block" />
                    </div>
                </div>
                
                <div className={`bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-gray-100 shadow-sm group hover:border-primary/20 transition-all cursor-pointer ${totalAdvance > 0 ? '' : 'col-span-2 md:col-span-2'}`}>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Largest Creditor</p>
                    {suppliers.length > 0 ? (
                        <>
                            <h3 className="text-lg sm:text-xl font-black text-gray-900 line-clamp-1">{suppliers.sort((a,b) => Number(b.balance_due) - Number(a.balance_due))[0].company_name}</h3>
                            <p className="text-xs sm:text-sm text-primary font-bold mt-1 uppercase tracking-wider">₹{Math.max(0, Number(suppliers.sort((a,b) => Number(b.balance_due) - Number(a.balance_due))[0].balance_due)).toLocaleString('en-IN')} Due</p>
                        </>
                    ) : (
                        <h3 className="text-lg sm:text-xl font-bold text-gray-300">No data</h3>
                    )}
                </div>
            </div>

            {/* List Section */}
            <div className="bg-white rounded-3xl sm:rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-4 sm:p-8 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h3 className="text-xl font-black text-gray-900">Distributor List</h3>
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="text"
                            placeholder="Search by company or phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-gray-50 border-none rounded-xl py-3 pl-12 pr-10 focus:ring-2 focus:ring-primary/20 text-gray-900 placeholder:text-gray-400"
                        />
                        {searchTerm && (
                            <button
                                type="button"
                                aria-label="Clear search"
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                </div>

                <div className="hidden md:block overflow-x-auto p-4">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-black border-b border-gray-50">
                                <th className="p-6">Company Name</th>
                                <th className="p-6">Contact Person</th>
                                <th className="p-6">Contact Details</th>
                                <th className="p-6 text-right">Outstanding Balance</th>
                                <th className="p-6"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="p-20 text-center text-gray-400">
                                        <Loader2 className="animate-spin mx-auto mb-4" />
                                        Loading ledger summary...
                                    </td>
                                </tr>
                            ) : filteredSuppliers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-20 text-center text-gray-400">
                                        <p className="text-lg font-bold text-gray-600 mb-1">{emptyTitle}</p>
                                        <p className="text-sm">{emptySubtitle}</p>
                                        {hasSearchQuery && (
                                            <button
                                                type="button"
                                                onClick={() => setSearchTerm('')}
                                                className="mt-4 text-sm font-bold text-primary hover:underline"
                                            >
                                                Clear search
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ) : (
                                filteredSuppliers.map(supplier => (
                                    <tr key={supplier.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="p-6">
                                            <div className="flex items-center gap-4">
                                                <div className="size-12 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center font-black text-xl border border-gray-100 uppercase group-hover:bg-primary group-hover:text-white transition-all">
                                                    {supplier.company_name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-black text-gray-900 text-lg uppercase tracking-tight">{supplier.company_name}</div>
                                                    {supplier.is_active === false && (
                                                        <span className="inline-block mt-1 text-[10px] font-black uppercase tracking-widest bg-red-50 text-red-600 px-2 py-0.5 rounded-md">Inactive</span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6 font-medium text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <User size={14} className="text-gray-300" />
                                                {supplier.contact_person || 'N/A'}
                                            </div>
                                        </td>
                                        <td className="p-6 text-sm">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-gray-600 font-bold">
                                                    <Phone size={14} className="text-gray-300" />
                                                    {supplier.phone_number}
                                                </div>
                                                <div className="flex items-center gap-2 text-gray-400">
                                                    <Mail size={14} className="text-gray-300" />
                                                    {supplier.email || 'No email'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6 text-right">
                                            <div className={`text-2xl font-black ${Number(supplier.balance_due) > 0 ? 'text-red-600' : (Number(supplier.balance_due) < 0 ? 'text-green-600' : 'text-gray-900')}`}>
                                                ₹{Math.abs(Number(supplier.balance_due)).toLocaleString('en-IN')}
                                            </div>
                                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">
                                                {Number(supplier.balance_due) > 0 ? 'Due Amount' : (Number(supplier.balance_due) < 0 ? 'Advance Paid' : 'Settled')}
                                            </div>
                                        </td>
                                        <td className="p-6 text-right">
                                            {renderActions(supplier)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="block md:hidden divide-y divide-gray-100">
                    {isLoading ? (
                        <div className="p-12 text-center text-gray-400">
                            <Loader2 className="animate-spin mx-auto mb-4" />
                            Loading ledger summary...
                        </div>
                    ) : filteredSuppliers.length === 0 ? (
                        <div className="p-12 text-center text-gray-400">
                            <p className="text-base font-bold text-gray-600 mb-1">{emptyTitle}</p>
                            <p className="text-xs">{emptySubtitle}</p>
                            {hasSearchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchTerm('')}
                                    className="mt-3 text-xs font-bold text-primary hover:underline"
                                >
                                    Clear search
                                </button>
                            )}
                        </div>
                    ) : (
                        filteredSuppliers.map(supplier => (
                            <div key={supplier.id} className="p-4 flex flex-col gap-3 hover:bg-gray-50/50 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center font-black text-base border border-gray-100 uppercase flex-shrink-0">
                                            {supplier.company_name.charAt(0)}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-black text-gray-900 text-sm uppercase tracking-tight truncate max-w-[150px]">{supplier.company_name}</div>
                                            {supplier.is_active === false && (
                                                <span className="inline-block mt-0.5 text-[9px] font-black uppercase tracking-widest bg-red-50 text-red-600 px-1.5 py-0.5 rounded">Inactive</span>
                                            )}
                                            <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-0.5">
                                                <User size={10} className="text-gray-400 flex-shrink-0" />
                                                <span className="truncate max-w-[100px]">{supplier.contact_person || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <div className={`text-base font-black ${Number(supplier.balance_due) > 0 ? 'text-red-600' : (Number(supplier.balance_due) < 0 ? 'text-green-600' : 'text-gray-900')}`}>
                                            ₹{Math.abs(Number(supplier.balance_due)).toLocaleString('en-IN')}
                                        </div>
                                        <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                                            {Number(supplier.balance_due) > 0 ? 'Due Amount' : (Number(supplier.balance_due) < 0 ? 'Advance Paid' : 'Settled')}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between bg-gray-50/70 p-2.5 rounded-xl border border-gray-100/50">
                                    <div className="flex flex-col gap-0.5 text-xs text-gray-600 min-w-0">
                                        <div className="flex items-center gap-1.5 font-bold">
                                            <Phone size={12} className="text-gray-400 flex-shrink-0" />
                                            <span>{supplier.phone_number}</span>
                                        </div>
                                        {supplier.email && (
                                            <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                                                <Mail size={11} className="text-gray-400 flex-shrink-0" />
                                                <span className="truncate max-w-[160px]">{supplier.email}</span>
                                            </div>
                                        )}
                                    </div>
                                    {renderActions(supplier, true)}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <SupplierFormModal
                open={showFormModal}
                mode={editingSupplier ? 'edit' : 'add'}
                values={formValues}
                onChange={setFormValues}
                onClose={closeFormModal}
                onSubmit={handleSaveSupplier}
                isSubmitting={isSaving}
            />

            <InfiniteScrollTrigger 
                onLoadMore={() => fetchSuppliers(true)}
                hasMore={!!nextPage}
                isLoading={isFetchingMore}
            />
        </div>
    );
}
