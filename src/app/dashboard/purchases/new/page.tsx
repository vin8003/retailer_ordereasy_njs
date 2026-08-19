'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api';
import { fetchAllPages } from '@/utils/fetchAllPages';
import { findProductByBarcode, looksLikeBarcode, productListIsIncomplete, productMatchesQuery, unwrapProductList } from '@/utils/productMatch';
import { 
    Package, Plus, Trash2, Search, ScanLine, 
    ChevronLeft, Save, Loader2, Truck, Calendar, Hash,
    Info, AlertCircle, ShoppingCart, IndianRupee, UserPlus, ImageIcon, X
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import Link from 'next/link';
import { QuickAddModal } from '@/components/pos/QuickAddModal';
import SearchableSupplierSelect from '@/components/ui/SearchableSupplierSelect';

interface Product {
    id: number;
    name: string;
    barcode: string;
    purchase_price: number | string;
    price: number | string;
    original_price: number | string;
    image: string;
    additional_barcodes?: string[];
    has_batches?: boolean;
    batches?: { id?: number; barcode?: string; batch_number?: string }[];
}

interface PurchaseRow {
    product: Product;
    quantity: number;
    purchase_price: number;
    new_price: number;
    new_original_price: number;
    total: number;
}

interface Supplier {
    id: number;
    company_name: string;
}

export default function NewPurchasePage() {
    const router = useRouter();
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSupplier, setSelectedSupplier] = useState('');
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
    const [rows, setRows] = useState<PurchaseRow[]>([]);
    const [paidAmount, setPaidAmount] = useState<number>(0);
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [billImageFile, setBillImageFile] = useState<File | null>(null);
    const [billImagePreview, setBillImagePreview] = useState<string | null>(null);
    
    // Quick Add Modal State
    const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
    const [scanBarcode, setScanBarcode] = useState('');
    
    // Add Supplier Modal State
    const [showAddModal, setShowAddModal] = useState(false);
    const [newSupplier, setNewSupplier] = useState({
        company_name: '',
        contact_person: '',
        phone_number: '',
        email: '',
        address: ''
    });
    
    const searchInputRef = useRef<HTMLInputElement>(null);

    const handleAddSupplier = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await api.post('/products/erp/suppliers/', newSupplier);
            toast.success("Supplier added successfully");
            setShowAddModal(false);
            
            const allSuppliers = await fetchAllPages('/products/erp/suppliers/');
            setSuppliers(allSuppliers);
            setSelectedSupplier(res.data.id.toString());
            
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

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [allSuppliers, prodRes] = await Promise.all([
                    fetchAllPages('/products/erp/suppliers/'),
                    api.get('/products/?no_page=true&is_active=true')
                ]);
                setSuppliers(allSuppliers);
                let fetched = unwrapProductList(prodRes.data);
                if (productListIsIncomplete(prodRes.data, fetched)) {
                    fetched = await fetchAllPages('/products/', { is_active: true });
                }
                setProducts(fetched);
            } catch (error) {
                toast.error("Failed to load setup data");
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
        
        // Shortcut to focus search
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'F1') {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const addProductToRows = (product: Product) => {
        const existingIdx = rows.findIndex(r => r.product.id === product.id);
        if (existingIdx > -1) {
            const newRows = [...rows];
            newRows[existingIdx].quantity += 1;
            newRows[existingIdx].total = newRows[existingIdx].quantity * newRows[existingIdx].purchase_price;
            setRows(newRows);
        } else {
            setRows([...rows, {
                product,
                quantity: 1,
                purchase_price: Number(product.purchase_price) || 0,
                new_price: Number(product.price) || 0,
                new_original_price: Number(product.original_price) || 0,
                total: Number(product.purchase_price) || 0
            }]);
        }
        setSearchTerm('');
        toast.success(`Added ${product.name}`, { icon: '📦', duration: 1500 });
    };

    const handleSearchKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && searchTerm) {
            const cleanedTerm = searchTerm.trim();
            // 1. Exact barcode on parent, extra codes, or a batch (same as POS)
            const matched = findProductByBarcode(products, cleanedTerm);
            if (matched) {
                e.preventDefault();
                addProductToRows(matched);
                return;
            }
            
            // 2. Exactly one filtered suggestion
            if (filteredSuggestions.length === 1) {
                e.preventDefault();
                addProductToRows(filteredSuggestions[0]);
                return;
            }
            
            // 3. Unknown Barcode only for a numeric code that is not in this catalog
            if (filteredSuggestions.length === 0 && looksLikeBarcode(cleanedTerm)) {
                e.preventDefault();
                setScanBarcode(cleanedTerm);
                setIsQuickAddOpen(true);
            }
        }
    };

    const updateRow = (index: number, field: keyof PurchaseRow, value: any) => {
        const newRows = [...rows];
        (newRows[index] as any)[field] = value;
        if (field === 'quantity' || field === 'purchase_price') {
            newRows[index].total = newRows[index].quantity * newRows[index].purchase_price;
        }
        setRows(newRows);
    };

    const removeRow = (index: number) => {
        setRows(rows.filter((_, i) => i !== index));
    };

    const subtotal = rows.reduce((sum, r) => sum + r.total, 0);

    const handleSubmit = async () => {
        if (!selectedSupplier) return toast.error("Please select a supplier");
        if (rows.length === 0) return toast.error("Please add at least one product");


        setIsSubmitting(true);
        try {
            const payload = {
                supplier: selectedSupplier,
                invoice_number: invoiceNumber,
                invoice_date: invoiceDate,
                total_amount: Math.round(subtotal),
                paid_amount: paidAmount,
                notes: notes,
                payment_status: paidAmount >= subtotal ? 'PAID' : (paidAmount > 0 ? 'PARTIAL' : 'UNPAID'),
                items: rows.map(r => ({
                    product: r.product.id,
                    quantity: r.quantity,
                    purchase_price: r.purchase_price,
                    total: Math.round(r.total),
                    new_price: r.new_price,
                    new_original_price: r.new_original_price,
                    mrp_updated: r.new_price !== Number(r.product.price) || r.new_original_price !== Number(r.product.original_price)
                }))
            };

            const created = await api.post('/products/erp/purchase-invoices/', payload);
            if (billImageFile && created.data?.id) {
                const formData = new FormData();
                formData.append('bill_image', billImageFile);
                try {
                    await api.patch(`/products/erp/purchase-invoices/${created.data.id}/`, formData, {
                        transformRequest: [(data, headers) => {
                            if (headers) {
                                delete headers['Content-Type'];
                                delete headers['content-type'];
                            }
                            return data;
                        }],
                    });
                } catch (imageErr) {
                    console.error(imageErr);
                    toast.error("Bill saved, but attaching the photo failed");
                }
            }
            toast.success("Purchase recorded and stock updated!");
            router.push('/dashboard/purchases');
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed to save purchase");
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredSuggestions = (() => {
        const trimmed = searchTerm.trim().toLowerCase();
        if (trimmed.length <= 1) return [];
        return products.filter(p => productMatchesQuery(p, trimmed));
    })();

    if (isLoading) return (
        <div className="flex h-[80vh] items-center justify-center">
            <Loader2 className="animate-spin text-primary" size={40} />
        </div>
    );

    return (
        <div className="p-8 max-w-[1400px] mx-auto font-sans min-h-screen pb-32">
            <Toaster position="top-right" />
            
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/dashboard/purchases">
                    <button className="p-3 hover:bg-white rounded-2xl border border-transparent hover:border-gray-100 transition-all text-gray-400 hover:text-gray-900 shadow-sm">
                        <ChevronLeft size={24} />
                    </button>
                </Link>
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Record Inward Stock</h1>
                    <p className="text-gray-500 mt-1">Update inventory and prices from supplier bills.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                
                {/* Left: Bill Details & Items */}
                <div className="xl:col-span-2 space-y-6">
                    
                    {/* Invoice Meta */}
                    <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <Truck size={14} /> Distributor / Supplier
                                </label>
                                <button 
                                    type="button"
                                    onClick={() => setShowAddModal(true)}
                                    className="text-[10px] font-bold text-primary flex items-center gap-1 hover:underline"
                                >
                                    <UserPlus size={12} /> Add New
                                </button>
                            </div>
                            <SearchableSupplierSelect
                                suppliers={suppliers}
                                value={selectedSupplier}
                                onChange={setSelectedSupplier}
                                placeholder="Select Supplier"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Hash size={14} /> Invoice Number
                            </label>
                            <input 
                                type="text"
                                value={invoiceNumber}
                                onChange={(e) => setInvoiceNumber(e.target.value)}
                                placeholder="e.g. BILL-4952"
                                className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 text-gray-900 font-medium placeholder:text-gray-300"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Calendar size={14} /> Bill Date
                            </label>
                            <input 
                                type="date"
                                value={invoiceDate}
                                onChange={(e) => setInvoiceDate(e.target.value)}
                                className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 text-gray-900 font-medium"
                            />
                        </div>
                        <div className="md:col-span-3 space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <ImageIcon size={14} /> Bill photo (optional)
                            </label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0] || null;
                                        setBillImageFile(file);
                                        setBillImagePreview(file ? URL.createObjectURL(file) : null);
                                    }}
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                                />
                                {billImagePreview && (
                                    <div className="relative shrink-0">
                                        <img src={billImagePreview} alt="Bill preview" className="size-16 rounded-xl object-cover border border-gray-100" />
                                        <button
                                            type="button"
                                            onClick={() => { setBillImageFile(null); setBillImagePreview(null); }}
                                            className="absolute -top-2 -right-2 bg-white border border-gray-200 rounded-full p-0.5 text-gray-400 hover:text-red-500"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Product Search & Table */}
                    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
                        
                        <div className="p-8 border-b border-gray-100 bg-gray-50/30">
                            <div className="relative group">
                                <ScanLine className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={24} />
                                <input 
                                    ref={searchInputRef}
                                    type="text"
                                    placeholder="Scan barcode (F1) or type product name..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={handleSearchKeyDown}
                                    className="w-full pl-14 pr-6 py-5 bg-white border-none rounded-2xl shadow-inner focus:ring-4 focus:ring-primary/5 text-lg font-medium transition-all"
                                />
                                
                                {filteredSuggestions.length > 0 && (
                                    <div className="absolute z-20 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="max-h-60 overflow-y-auto overscroll-contain">
                                        {filteredSuggestions.map(p => (
                                            <button
                                                key={p.id}
                                                onClick={() => addProductToRows(p)}
                                                className="w-full px-6 py-4 flex items-center gap-4 hover:bg-primary/5 transition-colors border-b last:border-b-0 text-left"
                                            >
                                                <div className="size-12 rounded-xl bg-gray-50 flex items-center justify-center overflow-hidden border border-gray-100">
                                                    {p.image ? (
                                                        <img src={p.image} className="object-cover size-full" alt="" />
                                                    ) : <ShoppingCart size={20} className="text-gray-300" />}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="font-bold text-gray-900">{p.name}</div>
                                                    <div className="text-xs text-gray-500 font-medium">PKR: {p.price} • Barcode: {p.barcode || 'N/A'}</div>
                                                </div>
                                                <Plus className="text-primary opacity-0 group-hover:opacity-100 transition-opacity" size={20} />
                                            </button>
                                        ))}
                                        </div>
                                        <div className="px-4 py-2 border-t border-gray-100 bg-gray-50/50">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                {filteredSuggestions.length} of {products.length} products
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 overflow-x-auto p-4">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-black border-b border-gray-50">
                                        <th className="p-4 px-6">Product</th>
                                        <th className="p-4 text-center">Batch Stock</th>
                                        <th className="p-4 text-center">Inward Price</th>
                                        <th className="p-4 text-center">New MRP</th>
                                        <th className="p-4 text-center">New Sell Price</th>
                                        <th className="p-4 text-right">Total</th>
                                        <th className="p-4"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {rows.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="p-20 text-center text-gray-400">
                                                <Package size={48} className="mx-auto mb-4 opacity-20" />
                                                <p className="text-lg font-medium opacity-50">No items added yet</p>
                                                <p className="text-sm mt-1">Ready to receive stock...</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        rows.map((row, idx) => (
                                            <tr key={row.product.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="p-4 px-6">
                                                    <div className="font-bold text-gray-900">{row.product.name}</div>
                                                    <div className="text-xs text-gray-400 font-medium font-mono">{row.product.barcode}</div>
                                                </td>
                                                <td className="p-4 w-28">
                                                    <input 
                                                        type="number"
                                                        value={row.quantity}
                                                        onChange={(e) => updateRow(idx, 'quantity', Number(e.target.value))}
                                                        className="w-full bg-white border border-gray-100 rounded-lg py-2 px-3 text-center font-black focus:ring-2 focus:ring-primary/20 text-primary"
                                                    />
                                                </td>
                                                <td className="p-4 w-32">
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs text-primary font-bold">₹</span>
                                                        <input 
                                                            type="number"
                                                            value={row.purchase_price}
                                                            onChange={(e) => updateRow(idx, 'purchase_price', Number(e.target.value))}
                                                            className="w-full bg-blue-50/30 border border-blue-100 rounded-lg py-2 pl-6 pr-3 text-center font-bold focus:ring-2 focus:ring-blue-100"
                                                        />
                                                    </div>
                                                </td>
                                                <td className="p-4 w-32">
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">₹</span>
                                                        <input 
                                                            type="number"
                                                            value={row.new_original_price}
                                                            onChange={(e) => updateRow(idx, 'new_original_price', Number(e.target.value))}
                                                            className="w-full bg-gray-50 border border-gray-100 rounded-lg py-2 pl-6 pr-3 text-center font-bold text-gray-600 focus:ring-2 focus:ring-gray-200"
                                                        />
                                                    </div>
                                                </td>
                                                <td className="p-4 w-32">
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary text-xs font-bold">₹</span>
                                                        <input 
                                                            type="number"
                                                            value={row.new_price}
                                                            onChange={(e) => updateRow(idx, 'new_price', Number(e.target.value))}
                                                            className="w-full bg-green-50/30 border border-green-100 rounded-lg py-2 pl-6 pr-3 text-center font-bold text-green-700 focus:ring-2 focus:ring-green-100"
                                                        />
                                                    </div>
                                                </td>
                                                <td className="p-4 text-right font-black text-gray-900">
                                                    ₹{Math.round(row.total)}
                                                </td>
                                                <td className="p-4">
                                                    <button 
                                                        onClick={() => removeRow(idx)}
                                                        className="text-gray-300 hover:text-red-500 transition-colors p-2"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right: Summary & Payment */}
                <div className="space-y-6">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-primary/5 sticky top-8">
                        <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                            <IndianRupee size={24} className="text-primary"/> Bill Summary
                        </h3>
                        
                        <div className="space-y-4 mb-8">
                            <div className="flex justify-between text-gray-500 font-medium">
                                <span>Subtotal ({rows.length} Items)</span>
                                <span>₹{Math.round(subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-gray-500 font-medium">
                                <span>GST / Taxes</span>
                                <span className="text-xs text-gray-400">Included</span>
                            </div>
                            <div className="flex justify-between items-end pt-4 border-t border-dashed border-gray-200">
                                <span className="text-lg font-bold text-gray-900">Total Bill</span>
                                <span className="text-4xl font-black text-primary tracking-tighter">₹{Math.round(subtotal)}</span>
                            </div>
                        </div>

                        <div className="bg-primary/5 rounded-[2rem] p-6 mb-8 border border-primary/10">
                            <label className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-3 block">
                                Payment to Supplier
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-black text-2xl">₹</span>
                                <input 
                                    type="number"
                                    value={paidAmount}
                                    onChange={(e) => setPaidAmount(Number(e.target.value))}
                                    className="w-full bg-white border-transparent rounded-2xl py-4 pl-10 pr-4 text-3xl font-black text-primary focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-primary/20"
                                    placeholder="0"
                                />
                            </div>
                            <div className="mt-4 flex justify-between items-center px-1">
                                <span className="text-xs font-bold text-gray-400">Remaining Balance</span>
                                <span className="text-sm font-black text-red-500">₹{Math.round(subtotal - paidAmount)}</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 px-1">
                                <Info size={14} /> Additional Notes
                            </label>
                            <textarea 
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Add distributor remarks or payment references..."
                                className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 focus:ring-2 focus:ring-primary/20 text-gray-900 text-sm h-24 resize-none"
                            />
                        </div>

                        <button 
                            onClick={handleSubmit}
                            disabled={isSubmitting || rows.length === 0}
                            className="w-full bg-gray-900 hover:bg-black text-white py-5 rounded-[1.5rem] font-bold text-lg mt-8 flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:bg-gray-200 disabled:text-gray-400"
                        >
                            {isSubmitting ? (
                                <Loader2 className="animate-spin" />
                            ) : (
                                <>
                                    <Save size={20} /> Save Purchase Bill
                                </>
                            )}
                        </button>
                    </div>

                    <div className="bg-blue-50/50 p-6 rounded-[2rem] border border-blue-100/50 flex gap-4">
                        <AlertCircle className="text-blue-500 shrink-0" size={24} />
                        <p className="text-xs font-medium text-blue-700 leading-relaxed">
                            Saving this bill will automatically increase product stock and update current selling prices across the platform.
                        </p>
                    </div>
                </div>

            </div>

            {/* Add Supplier Modal */}
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
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Phone Number (recommended)</label>
                                    <input 
                                        type="tel"
                                        placeholder="10-digit mobile (optional)"
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

            {/* Unknown Barcode Modal */}
            <QuickAddModal 
                isOpen={isQuickAddOpen}
                barcode={scanBarcode}
                onClose={() => setIsQuickAddOpen(false)}
                onSuccess={(newProduct) => {
                    // Update products list and add to rows
                    setProducts(prev => [...prev, newProduct]);
                    addProductToRows(newProduct);
                }}
            />
        </div>
    );
}
