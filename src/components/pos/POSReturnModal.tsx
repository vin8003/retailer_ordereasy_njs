'use client';

import React, { useState } from 'react';
import { X, Search, Loader2, RotateCcw, AlertCircle, Banknote, CreditCard, ChevronRight, User, Phone, Hash, Calendar } from 'lucide-react';
import api from '@/services/api';
import { toast } from 'react-hot-toast';

interface POSReturnModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface OrderItem {
    id: number;
    product_id: number;
    product_name: string;
    quantity: number;
    already_returned: number;
    available_qty: number;
    unit_price: number;
    batch_id: number | null;
}

interface FoundOrder {
    id: number;
    order_number: string;
    customer_name: string;
    customer_mobile: string;
    total_amount: number;
    payment_mode: string;
    status: string;
    created_at: string;
    items: OrderItem[];
}

type ModalStep = 'search' | 'select' | 'process';

export default function POSReturnModal({ isOpen, onClose, onSuccess }: POSReturnModalProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [foundOrders, setFoundOrders] = useState<FoundOrder[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<FoundOrder | null>(null);
    const [step, setStep] = useState<ModalStep>('search');
    
    const [returnQtys, setReturnQtys] = useState<Record<number, number>>({});
    const [refundMode, setRefundMode] = useState<'cash' | 'upi'>('cash');
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSearch = async () => {
        if (!searchQuery) return;
        setIsSearching(true);
        try {
            const response = await api.get(`/returns/sales/search_order/?query=${searchQuery}`);
            const data = response.data;
            
            if (Array.isArray(data)) {
                if (data.length === 1) {
                    setSelectedOrder(data[0]);
                    setStep('process');
                } else {
                    setFoundOrders(data);
                    setStep('select');
                }
            } else {
                setSelectedOrder(data);
                setStep('process');
            }
            setReturnQtys({});
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Order not found');
            setFoundOrders([]);
            setSelectedOrder(null);
        } finally {
            setIsSearching(false);
        }
    };

    const updateQty = (itemId: number, val: number, maxAvailable: number) => {
        const newQty = Math.min(Math.max(0, val), maxAvailable);
        setReturnQtys(prev => ({ ...prev, [itemId]: newQty }));
    };

    const calculateRefund = () => {
        if (!selectedOrder) return 0;
        return selectedOrder.items.reduce((sum, item) => {
            const qty = returnQtys[item.id] || 0;
            return sum + (qty * item.unit_price);
        }, 0);
    };

    const handleSubmit = async () => {
        const itemsToReturn = selectedOrder?.items
            .filter(item => (returnQtys[item.id] || 0) > 0)
            .map(item => ({
                product_id: item.product_id,
                order_item_id: item.id,
                batch_id: item.batch_id,
                quantity: returnQtys[item.id],
                refund_unit_price: item.unit_price
            }));

        if (!itemsToReturn || itemsToReturn.length === 0) {
            toast.error('Please select at least one item to return');
            return;
        }

        setIsSubmitting(true);
        try {
            await api.post('/returns/sales/', {
                order_id: selectedOrder?.id,
                items: itemsToReturn,
                refund_payment_mode: refundMode,
                reason: reason
            });
            toast.success('Return processed successfully');
            onSuccess();
            onClose();
            // Reset
            resetModal();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Failed to process return');
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetModal = () => {
        setSelectedOrder(null);
        setFoundOrders([]);
        setStep('search');
        setSearchQuery('');
        setReturnQtys({});
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] w-full max-w-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 text-primary rounded-xl">
                            <RotateCcw size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Sale Return</h2>
                            <p className="text-sm text-gray-500">Return items from a previous order</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>

                <div className="p-8 max-h-[75vh] overflow-y-auto">
                    {step === 'search' && (
                        <div className="max-w-md mx-auto py-12 text-center">
                            <div className="mb-8">
                                <Search size={48} className="mx-auto text-gray-200 mb-4" />
                                <h3 className="text-lg font-bold text-gray-800">Find Original Order</h3>
                                <p className="text-gray-500 text-sm">Search by Order #, Mobile, or Name</p>
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Order #, Mobile, or Name..."
                                    autoFocus
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    className="flex-1 px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                />
                                <button
                                    onClick={handleSearch}
                                    disabled={isSearching}
                                    className="px-6 py-3 bg-primary text-white rounded-2xl font-bold hover:bg-primary/90 transition-all disabled:bg-gray-300"
                                >
                                    {isSearching ? <Loader2 className="animate-spin" /> : 'Search'}
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'select' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Select Correct Order</h3>
                                <button onClick={() => setStep('search')} className="text-xs text-primary font-bold hover:underline">New Search</button>
                            </div>
                            <div className="grid gap-3">
                                {foundOrders.map(order => (
                                    <button
                                        key={order.id}
                                        onClick={() => {
                                            setSelectedOrder(order);
                                            setStep('process');
                                        }}
                                        className="w-full bg-white border border-gray-100 p-4 rounded-2xl text-left hover:border-primary hover:bg-primary/5 transition-all group flex justify-between items-center"
                                    >
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-bold text-gray-900">#{order.order_number}</span>
                                                <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-500 uppercase font-bold">{order.status}</span>
                                            </div>
                                            <div className="flex gap-4 text-xs text-gray-500">
                                                <span className="flex items-center gap-1"><User size={12} /> {order.customer_name}</span>
                                                <span className="flex items-center gap-1"><Phone size={12} /> {order.customer_mobile}</span>
                                                <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(order.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <div className="text-right flex items-center gap-4">
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">₹{order.total_amount}</p>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase">{order.payment_mode}</p>
                                            </div>
                                            <ChevronRight className="text-gray-300 group-hover:text-primary transition-colors" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 'process' && selectedOrder && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            {/* Order Info Card */}
                            <div className="bg-gray-50 rounded-2xl p-4 flex justify-between items-center border border-gray-100">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Original Order</p>
                                    <h4 className="text-lg font-bold text-gray-900">#{selectedOrder.order_number}</h4>
                                    <p className="text-xs text-gray-500">{selectedOrder.customer_name} • {selectedOrder.customer_mobile}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-500">{new Date(selectedOrder.created_at).toLocaleDateString()}</p>
                                    <p className="text-lg font-black text-gray-900">₹{selectedOrder.total_amount}</p>
                                    <p className="text-[10px] font-bold text-primary uppercase">{selectedOrder.payment_mode}</p>
                                </div>
                                <button onClick={() => setStep('search')} className="ml-4 p-2 text-xs text-primary font-bold hover:underline">Change</button>
                            </div>

                            {/* Item Selection */}
                            <div>
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Select Items to Return</h3>
                                <div className="space-y-3">
                                    {selectedOrder.items.map(item => (
                                        <div key={item.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${item.available_qty === 0 ? 'bg-gray-50 opacity-60 border-gray-100' : 'border-gray-100 hover:border-primary/20'}`}>
                                            <div className="flex-1">
                                                <h5 className="font-bold text-gray-800">{item.product_name}</h5>
                                                <div className="flex gap-4 mt-1">
                                                    <p className="text-xs text-gray-500 font-medium">Bought: {item.quantity}</p>
                                                    {item.already_returned > 0 && (
                                                        <p className="text-xs text-red-500 font-bold">Returned: {item.already_returned}</p>
                                                    )}
                                                    <p className="text-xs text-green-600 font-bold">Available: {item.available_qty}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                {item.available_qty > 0 ? (
                                                    <div className="flex items-center bg-gray-50 rounded-xl p-1 border border-gray-100">
                                                        <button 
                                                            onClick={() => updateQty(item.id, (returnQtys[item.id] || 0) - 1, item.available_qty)}
                                                            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-primary font-bold"
                                                        >-</button>
                                                        <input 
                                                            type="number"
                                                            value={returnQtys[item.id] || 0}
                                                            onChange={(e) => updateQty(item.id, parseInt(e.target.value) || 0, item.available_qty)}
                                                            className="w-12 text-center bg-transparent font-bold text-sm outline-none"
                                                        />
                                                        <button 
                                                            onClick={() => updateQty(item.id, (returnQtys[item.id] || 0) + 1, item.available_qty)}
                                                            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-primary font-bold"
                                                        >+</button>
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] font-bold text-gray-400 bg-gray-200 px-3 py-1 rounded-full uppercase">Fully Returned</span>
                                                )}
                                                <div className="w-20 text-right font-bold text-gray-900">
                                                    ₹{((returnQtys[item.id] || 0) * item.unit_price).toFixed(2)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Refund Options */}
                            <div className="grid grid-cols-2 gap-8">
                                <div>
                                    <label className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 block">Refund Via</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button 
                                            onClick={() => setRefundMode('cash')}
                                            className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-bold transition-all ${
                                                refundMode === 'cash' 
                                                ? 'border-green-500 bg-green-500/10 text-green-700' 
                                                : 'border-gray-100 text-gray-500 hover:border-gray-200 hover:bg-gray-50'
                                            }`}
                                        >
                                            <Banknote size={18} /> Cash
                                        </button>
                                        <button 
                                            onClick={() => setRefundMode('upi')}
                                            className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-bold transition-all ${
                                                refundMode === 'upi' 
                                                ? 'border-primary bg-primary/10 text-primary' 
                                                : 'border-gray-100 text-gray-500 hover:border-gray-200 hover:bg-gray-50'
                                            }`}
                                        >
                                            <CreditCard size={18} /> UPI
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 block">Return Reason (Optional)</label>
                                    <textarea
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        placeholder="e.g. Damaged product, Wrong item..."
                                        className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none h-12 resize-none"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-8 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="text-sm text-gray-500 font-medium">Total Refund:</div>
                        <div className="text-3xl font-black text-gray-900">₹{calculateRefund().toFixed(2)}</div>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={onClose} className="px-8 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-2xl transition-all">
                            Cancel
                        </button>
                        <button
                            disabled={!selectedOrder || calculateRefund() <= 0 || isSubmitting}
                            onClick={handleSubmit}
                            className="px-10 py-3 bg-red-600 shadow-xl shadow-red-600/20 text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-red-700 transition-all disabled:bg-gray-300 disabled:shadow-none"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" /> : <><RotateCcw size={20} /> Process Return</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
