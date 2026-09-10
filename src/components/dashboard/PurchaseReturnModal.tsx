'use client';

import React, { useState, useEffect } from 'react';
import { X, Loader2, RotateCcw, AlertCircle, ShoppingCart, Truck, ChevronRight } from 'lucide-react';
import api from '@/services/api';
import { fetchAllPages } from '@/utils/fetchAllPages';
import { toast } from 'react-hot-toast';

interface PurchaseReturnModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    invoiceId?: number; // Optional: If triggered for a specific invoice
}

interface PurchaseItem {
    id: number;
    product_id: number;
    product_name: string;
    quantity: number;
    already_returned: number;
    available_qty: number;
    purchase_price: number;
    batch_id: number | null;
    batch_number?: string;
}

interface Supplier {
    id: number;
    company_name: string;
}

export default function PurchaseReturnModal({ isOpen, onClose, onSuccess, invoiceId }: PurchaseReturnModalProps) {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [selectedSupplier, setSelectedSupplier] = useState<number>(0);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [selectedInvoiceId, setSelectedInvoiceId] = useState<number>(invoiceId || 0);
    const [invoiceItems, setInvoiceItems] = useState<PurchaseItem[]>([]);
    
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingItems, setIsFetchingItems] = useState(false);
    const [returnQtys, setReturnQtys] = useState<Record<number, number>>({});
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchSuppliers();
            if (invoiceId) {
                fetchInvoiceItems(invoiceId);
            }
        }
    }, [isOpen, invoiceId]);

    const fetchSuppliers = async () => {
        try {
            const all = await fetchAllPages('/products/erp/suppliers/', { is_active: true });
            setSuppliers(all);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchInvoices = async (supplierId: number) => {
        try {
            const res = await api.get(`/products/erp/purchase-invoices/?supplier_id=${supplierId}`);
            setInvoices(res.data.results || res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchInvoiceItems = async (invId: number) => {
        setIsFetchingItems(true);
        try {
            // Use the enhanced endpoint that returns available_qty
            const res = await api.get(`/returns/purchase/get_invoice_items/?invoice_id=${invId}`);
            setInvoiceItems(res.data);
            setReturnQtys({});
        } catch (err) {
            toast.error('Failed to fetch invoice items');
        } finally {
            setIsFetchingItems(false);
        }
    };

    const handleSupplierChange = (id: number) => {
        setSelectedSupplier(id);
        setSelectedInvoiceId(0);
        setInvoiceItems([]);
        fetchInvoices(id);
    };

    const handleInvoiceChange = (id: number) => {
        setSelectedInvoiceId(id);
        fetchInvoiceItems(id);
    };

    const updateQty = (itemId: number, val: number, maxAvailable: number) => {
        const newQty = Math.min(Math.max(0, val), maxAvailable);
        setReturnQtys(prev => ({ ...prev, [itemId]: newQty }));
    };

    const calculateTotal = () => {
        return invoiceItems.reduce((sum, item) => {
            const qty = returnQtys[item.id] || 0;
            return sum + (qty * item.purchase_price);
        }, 0);
    };

    const handleSubmit = async () => {
        const itemsToReturn = invoiceItems
            .filter(item => (returnQtys[item.id] || 0) > 0)
            .map(item => ({
                product_id: item.product_id,
                purchase_item_id: item.id, // Linked to original row
                batch_id: item.batch_id,
                quantity: returnQtys[item.id],
                purchase_price: item.purchase_price
            }));

        if (itemsToReturn.length === 0) {
            toast.error('Please select at least one item to return');
            return;
        }

        setIsSubmitting(true);
        try {
            await api.post('/returns/purchase/', {
                supplier_id: invoiceId ? invoices.find(i => i.id === invoiceId)?.supplier : selectedSupplier,
                invoice_id: selectedInvoiceId || invoiceId,
                items: itemsToReturn,
                notes: notes
            });
            toast.success('Purchase Return processed & Supplier Ledger updated');
            onSuccess();
            onClose();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Failed to process return');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] w-full max-w-4xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100">
                
                {/* Header */}
                <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-100 text-red-600 rounded-2xl">
                            <RotateCcw size={28} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Purchase Return</h2>
                            <p className="text-sm text-gray-500 font-medium italic">Stock will be decreased & Supplier Ledger will be Debited</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-8 max-h-[70vh] overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        {/* Selector Section */}
                        {!invoiceId && (
                            <>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">1. Select Supplier</label>
                                    <select 
                                        value={selectedSupplier}
                                        onChange={(e) => handleSupplierChange(Number(e.target.value))}
                                        className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-gray-800"
                                    >
                                        <option value={0}>Choose a Supplier...</option>
                                        {suppliers.map(s => (
                                            <option key={s.id} value={s.id}>{s.company_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">2. Select Invoice</label>
                                    <select 
                                        value={selectedInvoiceId}
                                        onChange={(e) => handleInvoiceChange(Number(e.target.value))}
                                        disabled={!selectedSupplier}
                                        className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-gray-800 disabled:opacity-50"
                                    >
                                        <option value={0}>Select Purchase Bill...</option>
                                        {invoices.map(inv => (
                                            <option key={inv.id} value={inv.id}>{inv.invoice_number || `INV-${inv.id}`} ({new Date(inv.invoice_date).toLocaleDateString()})</option>
                                        ))}
                                    </select>
                                </div>
                            </>
                        )}
                    </div>

                    {isFetchingItems ? (
                        <div className="py-20 text-center text-gray-400">
                            <Loader2 size={40} className="animate-spin mx-auto mb-4" />
                            <p className="font-bold">Fetching Bill details...</p>
                        </div>
                    ) : invoiceItems.length > 0 ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <div>
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">3. Select Quantities to Return</h3>
                                <div className="space-y-3">
                                    {invoiceItems.map(item => (
                                        <div key={item.id} className={`flex items-center justify-between p-5 rounded-[1.5rem] border transition-all group ${item.available_qty === 0 ? 'bg-gray-50 opacity-60 border-gray-100' : 'border-gray-100 hover:border-red-200 hover:bg-red-50/10'}`}>
                                            <div className="flex-1">
                                                <h5 className="font-black text-gray-800 group-hover:text-red-900 transition-colors">{item.product_name}</h5>
                                                <div className="flex gap-4 mt-1">
                                                    <p className="text-xs text-gray-500 font-bold bg-gray-100 px-2 py-0.5 rounded">Inward: {item.quantity}</p>
                                                    {item.already_returned > 0 && <p className="text-xs text-red-500 font-bold">Returned: {item.already_returned}</p>}
                                                    <p className="text-xs text-green-600 font-bold">Available: {item.available_qty}</p>
                                                    {item.batch_number && <p className="text-xs text-primary font-bold">Batch: {item.batch_number}</p>}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                {item.available_qty > 0 ? (
                                                    <div className="flex items-center bg-white rounded-2xl p-1.5 border border-gray-100 shadow-sm">
                                                        <button 
                                                            onClick={() => updateQty(item.id, (returnQtys[item.id] || 0) - 1, item.available_qty)}
                                                            className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-600 font-black text-xl transition-colors"
                                                        >-</button>
                                                        <input 
                                                            type="number"
                                                            value={returnQtys[item.id] || 0}
                                                            onChange={(e) => updateQty(item.id, parseInt(e.target.value) || 0, item.available_qty)}
                                                            className="w-16 text-center bg-transparent font-black text-lg outline-none text-gray-800"
                                                        />
                                                        <button 
                                                            onClick={() => updateQty(item.id, (returnQtys[item.id] || 0) + 1, item.available_qty)}
                                                            className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-600 font-black text-xl transition-colors"
                                                        >+</button>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs font-black text-gray-400 bg-gray-200 px-4 py-2 rounded-xl uppercase tracking-wider">Fully Returned</span>
                                                )}
                                                <div className="w-28 text-right font-black text-gray-900 text-lg">
                                                    ₹{((returnQtys[item.id] || 0) * item.purchase_price).toLocaleString('en-IN')}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-red-50/50 p-6 rounded-3xl border border-red-100 mt-8">
                                <label className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-3 block">Return Reason / Notes</label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Reason for returning stock to distributor..."
                                    className="w-full bg-white border border-red-100 rounded-2xl p-4 text-sm font-medium focus:ring-4 focus:ring-red-100 outline-none h-20 resize-none transition-all"
                                />
                            </div>
                        </div>
                    ) : selectedInvoiceId ? (
                        <div className="py-20 text-center text-gray-400">
                             <AlertCircle size={48} className="mx-auto mb-4 opacity-20" />
                             <p className="font-bold">No returnable items found in this Bill</p>
                        </div>
                    ) : (
                        <div className="py-20 text-center text-gray-300">
                             <Truck size={64} className="mx-auto mb-6 opacity-30" />
                             <h3 className="text-xl font-black text-gray-400">Distributor Return System</h3>
                             <p className="max-w-xs mx-auto mt-2 text-sm font-medium">Select a supplier and bill above to start processing stock returns.</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-8 bg-white border-t border-gray-100 flex justify-between items-center">
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Estimated Credit Note</p>
                        <div className="text-3xl font-black text-gray-900">₹{calculateTotal().toLocaleString('en-IN')}</div>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={onClose} className="px-8 py-4 text-gray-500 font-bold hover:bg-gray-50 rounded-2xl transition-all">
                            Discard
                        </button>
                        <button
                            disabled={calculateTotal() <= 0 || isSubmitting}
                            onClick={handleSubmit}
                            className="px-12 py-4 bg-gray-900 shadow-xl shadow-gray-200 text-white rounded-2xl font-black flex items-center gap-3 hover:bg-black transition-all disabled:bg-gray-300 disabled:shadow-none active:scale-[0.98]"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" /> : <><RotateCcw size={20} /> Process Supplier Return</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
