'use client';

import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import { 
    BookOpen, Plus, Search, User, Phone, 
    ArrowRight, CreditCard, Loader2, AlertCircle,
    UserPlus, MapPin, Mail
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import Link from 'next/link';

interface Supplier {
    id: number;
    company_name: string;
    contact_person: string;
    phone_number: string;
    email: string;
    address: string;
    balance_due: string | number;
}

export default function SuppliersPage() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [newSupplier, setNewSupplier] = useState({
        company_name: '',
        contact_person: '',
        phone_number: '',
        email: '',
        address: ''
    });

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/products/erp/suppliers/');
            setSuppliers(res.data.results || res.data);
        } catch (error) {
            toast.error("Failed to load suppliers");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddSupplier = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/products/erp/suppliers/', newSupplier);
            toast.success("Supplier added successfully");
            setShowAddModal(false);
            fetchSuppliers();
            setNewSupplier({
                company_name: '',
                contact_person: '',
                phone_number: '',
                email: '',
                address: ''
            });
        } catch (error) {
            toast.error("Failed to add supplier");
        }
    };

    const filteredSuppliers = suppliers.filter(s => 
        s.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.phone_number.includes(searchTerm)
    );

    return (
        <div className="p-8 max-w-7xl mx-auto font-sans">
            <Toaster position="top-right" />
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <div className="p-2.5 bg-primary/10 text-primary rounded-xl overflow-hidden relative">
                             <div className="absolute inset-0 bg-primary/20 animate-pulse opacity-50"></div>
                            <BookOpen size={28} className="relative z-10" />
                        </div>
                        Khata & Suppliers
                    </h1>
                    <p className="text-gray-500 mt-2 ml-14">Manage distributor relations and outstanding credit balances.</p>
                </div>
                <button 
                    onClick={() => setShowAddModal(true)}
                    className="bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 px-6 py-4 rounded-2xl font-bold flex items-center gap-2 transition-all hover:-translate-y-1 active:scale-95"
                >
                    <UserPlus size={20} /> Add New Distributor
                </button>
            </div>

            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Total Debt</p>
                    <h3 className="text-4xl font-black text-red-600 tracking-tight">
                        ₹{suppliers.reduce((sum, s) => sum + Number(s.balance_due), 0).toLocaleString('en-IN')}
                    </h3>
                    <p className="text-xs text-gray-400 mt-2 font-medium">To be paid across {suppliers.length} suppliers</p>
                </div>
                
                <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm group hover:border-primary/20 transition-all cursor-pointer">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Primary Supplier</p>
                    {suppliers.length > 0 ? (
                        <>
                            <h3 className="text-xl font-black text-gray-900 line-clamp-1">{suppliers.sort((a,b) => Number(b.balance_due) - Number(a.balance_due))[0].company_name}</h3>
                            <p className="text-sm text-primary font-bold mt-1 uppercase tracking-wider">₹{Number(suppliers.sort((a,b) => Number(b.balance_due) - Number(a.balance_due))[0].balance_due).toLocaleString()} Due</p>
                        </>
                    ) : (
                        <h3 className="text-xl font-bold text-gray-300">No data</h3>
                    )}
                </div>

                <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">On-Credit Invoices</p>
                        <h3 className="text-3xl font-black text-gray-900">{suppliers.filter(s => Number(s.balance_due) > 0).length}</h3>
                    </div>
                    <div className="size-14 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500">
                        <CreditCard size={28} />
                    </div>
                </div>
            </div>

            {/* List Section */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                    <h3 className="text-xl font-black text-gray-900">Distributor List</h3>
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="text"
                            placeholder="Search by company or phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-gray-50 border-none rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-primary/20 text-gray-900 placeholder:text-gray-400"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto p-4">
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
                                        <p className="text-lg font-bold text-gray-600 mb-1">No suppliers found</p>
                                        <p className="text-sm">Add a new distributor to start managing their khata.</p>
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
                                                <div className="font-black text-gray-900 text-lg uppercase tracking-tight">{supplier.company_name}</div>
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
                                            <div className={`text-2xl font-black ${Number(supplier.balance_due) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                ₹{Number(supplier.balance_due).toLocaleString()}
                                            </div>
                                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">Due Amount</div>
                                        </td>
                                        <td className="p-6 text-right">
                                            <Link href={`/dashboard/suppliers/ledger?id=${supplier.id}`}>
                                                <button className="bg-gray-50 hover:bg-primary hover:text-white p-3 rounded-2xl text-gray-400 transition-all group-hover:shadow-lg group-hover:shadow-primary/20">
                                                    <ArrowRight size={20} />
                                                </button>
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl p-10 animate-in zoom-in-95 duration-200">
                        <h2 className="text-2xl font-black text-gray-900 mb-2">New Distributor</h2>
                        <p className="text-gray-500 mb-8 font-medium">Create a record for your stock provider.</p>
                        
                        <form onSubmit={handleAddSupplier} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Company Name *</label>
                                    <input 
                                        required
                                        type="text"
                                        placeholder="e.g. ABC Foods Ltd"
                                        value={newSupplier.company_name}
                                        onChange={e => setNewSupplier({...newSupplier, company_name: e.target.value})}
                                        className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Contact Person</label>
                                    <input 
                                        type="text"
                                        placeholder="John Doe"
                                        value={newSupplier.contact_person}
                                        onChange={e => setNewSupplier({...newSupplier, contact_person: e.target.value})}
                                        className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Phone Number *</label>
                                    <input 
                                        required
                                        type="tel"
                                        placeholder="10-digit mobile"
                                        value={newSupplier.phone_number}
                                        onChange={e => setNewSupplier({...newSupplier, phone_number: e.target.value})}
                                        className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Email Address</label>
                                    <input 
                                        type="email"
                                        placeholder="distributor@mail.com"
                                        value={newSupplier.email}
                                        onChange={e => setNewSupplier({...newSupplier, email: e.target.value})}
                                        className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Office Address</label>
                                <textarea 
                                    rows={3}
                                    placeholder="Full office or warehouse address..."
                                    value={newSupplier.address}
                                    onChange={e => setNewSupplier({...newSupplier, address: e.target.value})}
                                    className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 focus:ring-2 focus:ring-primary/20 resize-none"
                                />
                            </div>

                            <div className="flex gap-4 pt-6">
                                <button 
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 px-6 py-4 rounded-2xl font-bold bg-gray-100 text-gray-600 hover:bg-gray-200"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="flex-[2] bg-primary text-white px-6 py-4 rounded-2xl font-bold hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all"
                                >
                                    Register Distributor
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
