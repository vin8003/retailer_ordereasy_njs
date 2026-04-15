'use client';

import React, { useState, useEffect, useRef } from 'react';
import api from '@/services/api';
import { 
    Search, Plus, Minus, X, CreditCard, Banknote, 
    ShoppingCart, Loader2, MonitorCheck, ScanLine, AlertCircle, Printer, RefreshCcw 
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import { useReactToPrint } from 'react-to-print';
import { ThermalReceipt } from '@/components/pos/ThermalReceipt';
import { QuickAddModal } from '@/components/pos/QuickAddModal';

interface Product {
    id: number;
    name: string;
    price: number | string;
    discounted_price: number | string;
    image: string;
    quantity: number; // Stock qty
    category_name: string;
    barcode?: string;
    track_inventory?: boolean;
}

interface CartItem extends Product {
    cart_quantity: number;
}

interface CustomerSuggestion {
    mobile: string;
    name: string;
    status: 'verified' | 'returning_guest';
}

interface POSSession {
    id: string;
    cart: CartItem[];
    customerName: string;
    customerMobile: string;
    paymentMode: 'cash' | 'upi';
    discountAmount: number;
    verificationStatus: 'verified' | 'returning_guest' | 'new' | null;
    completedOrder: any | null;
}

interface RetailerProfile {
    shop_name: string;
    contact_phone: string;
    address_line1: string;
    city: string;
    gst_number?: string;
    receipt_footer?: string;
    show_gst_on_receipt?: boolean;
}

export default function POSPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [retailerProfile, setRetailerProfile] = useState<RetailerProfile | null>(null);
    
    // Multi-Session State
    const [sessions, setSessions] = useState<POSSession[]>([
        {
            id: '1',
            cart: [],
            customerName: '',
            customerMobile: '',
            paymentMode: 'cash',
            discountAmount: 0,
            verificationStatus: null,
            completedOrder: null
        }
    ]);
    const [activeSessionId, setActiveSessionId] = useState('1');

    const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
    
    const [customerSuggestions, setCustomerSuggestions] = useState<CustomerSuggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    
    // Quick Add State
    const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
    const [unknownBarcode, setUnknownBarcode] = useState('');
    
    // Barcode scanner ref
    const searchInputRef = useRef<HTMLInputElement>(null);
    
    // Receipt print ref
    const receiptRef = useRef<HTMLDivElement>(null);
    const handlePrint = useReactToPrint({
        contentRef: receiptRef,
    });

    useEffect(() => {
        fetchProducts();
        fetchProfile();
        
        // Listen for global barcode scanning triggers if keyboard input is fast
        const handleKeyDown = (e: KeyboardEvent) => {
            if (activeSession.completedOrder) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    handlePrint();
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    handleNewBill();
                }
                return;
            }

            if (e.key === 'F1') {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeSession.completedOrder]);
    
    const fetchProfile = async () => {
        try {
            const response = await api.get('/retailer/profile/');
            setRetailerProfile(response.data);
        } catch (error) {
            console.error("Failed to load retailer profile:", error);
        }
    };

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (activeSession.customerMobile.length >= 3 && showSuggestions) {
                setIsLoadingSuggestions(true);
                try {
                    const res = await api.get(`/products/erp/search-pos-customers/?q=${activeSession.customerMobile}`);
                    setCustomerSuggestions(res.data);
                } catch (err) {
                    console.error(err);
                } finally {
                    setIsLoadingSuggestions(false);
                }
            } else {
                setCustomerSuggestions([]);
                setIsLoadingSuggestions(false);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [activeSession.customerMobile, showSuggestions]);

    // Debounced Barcode Backup (for manual typing/slow scanners)
    useEffect(() => {
        if (!searchTerm || searchTerm.length < 3) return;

        const timer = setTimeout(() => {
            const matchedProduct = products.find(p => p.barcode === searchTerm);
            if (matchedProduct) {
                handleAddToCart(matchedProduct);
                setSearchTerm('');
                toast.success(`Added ${matchedProduct.name}`, { duration: 1000, icon: '🛒' });
            }
        }, 400);

        return () => clearTimeout(timer);
    }, [searchTerm, products]);

    const fetchProducts = async () => {
        setIsFetching(true);
        try {
            const response = await api.get('/products/');
            const dataList = response.data.results || response.data;
            setProducts(dataList || []);
            
            // Extract unique categories
            const cats = Array.from(new Set(dataList.map((p: Product) => p.category_name || 'Uncategorized')));
            setCategories(['All', ...cats as string[]]);
        } catch (error) {
            toast.error("Failed to load products for POS");
            console.error(error);
        } finally {
            setIsFetching(false);
        }
    };

    const updateActiveSession = (update: Partial<POSSession>) => {
        setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, ...update } : s));
    };

    const handleAddToCart = (product: Product) => {
        const shouldTrack = product.track_inventory !== false;
        
        if (shouldTrack && product.quantity <= 0) {
            toast.error(`${product.name} is out of stock!`);
            return;
        }

        const existing = activeSession.cart.find(item => item.id === product.id);
        let updatedCart;

        if (existing) {
            if (shouldTrack && existing.cart_quantity >= product.quantity) {
                toast.error(`Only ${product.quantity} units available`);
                return;
            }
            updatedCart = activeSession.cart.map(item => 
                item.id === product.id 
                ? { ...item, cart_quantity: item.cart_quantity + 1 } 
                : item
            );
        } else {
            updatedCart = [...activeSession.cart, { ...product, cart_quantity: 1 }];
        }

        updateActiveSession({ cart: updatedCart });
    };

    const updateQuantity = (id: number, delta: number) => {
        const updatedCart = activeSession.cart.map(item => {
            if (item.id === id) {
                const newQty = item.cart_quantity + delta;
                const shouldTrack = item.track_inventory !== false;
                
                if (shouldTrack && newQty > item.quantity) {
                    toast.error(`Max stock is ${item.quantity}`);
                    return item;
                }
                if (newQty <= 0) return { ...item, cart_quantity: 0 };
                return { ...item, cart_quantity: newQty };
            }
            return item;
        }).filter(item => item.cart_quantity > 0);

        updateActiveSession({ cart: updatedCart });
    };

    const removeFromCart = (id: number) => {
        updateActiveSession({ cart: activeSession.cart.filter(item => item.id !== id) });
    };

    const subtotal = Math.round(activeSession.cart.reduce((sum, item) => {
        const price = item.discounted_price ? Number(item.discounted_price) : Number(item.price);
        return sum + (price * item.cart_quantity);
    }, 0));

    const total = subtotal - activeSession.discountAmount;

    const handleCheckout = async () => {
        if (activeSession.cart.length === 0) {
            toast.error("Cart is empty");
            return;
        }
        
        if (activeSession.customerMobile.length > 0 && activeSession.customerMobile.length !== 10) {
            toast.error("Mobile number must be exactly 10 digits");
            return;
        }

        setIsCheckoutLoading(true);
        try {
            const payload = {
                items: activeSession.cart.map(item => ({
                    product_id: item.id,
                    quantity: item.cart_quantity,
                    unit_price: item.discounted_price ? Number(item.discounted_price) : Number(item.price)
                })),
                payment_mode: activeSession.paymentMode,
                subtotal: subtotal,
                discount_amount: activeSession.discountAmount,
                total_amount: total,
                customer_name: activeSession.customerName,
                customer_mobile: activeSession.customerMobile
            };

            const response = await api.post('/products/erp/pos-checkout/', payload);
            toast.success(`Order ${response.data.order.order_number} created successfully!`);
            
            updateActiveSession({ completedOrder: response.data.order });
            fetchProducts(); // Refresh stock
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Checkout failed");
        } finally {
            setIsCheckoutLoading(false);
        }
    };

    const handleNewBill = () => {
        updateActiveSession({
            cart: [],
            customerName: '',
            customerMobile: '',
            paymentMode: 'cash',
            discountAmount: 0,
            verificationStatus: null,
            completedOrder: null
        });
        setTimeout(() => searchInputRef.current?.focus(), 100);
    };

    const addNewSession = () => {
        const newId = String(Date.now());
        const newSession: POSSession = {
            id: newId,
            cart: [],
            customerName: '',
            customerMobile: '',
            paymentMode: 'cash',
            discountAmount: 0,
            verificationStatus: null,
            completedOrder: null
        };
        setSessions(prev => [...prev, newSession]);
        setActiveSessionId(newId);
    };

    const removeSession = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (sessions.length === 1) {
            handleNewBill();
            return;
        }
        setSessions(prev => prev.filter(s => s.id !== id));
        if (activeSessionId === id) {
            const index = sessions.findIndex(s => s.id === id);
            const nextActiveId = sessions[index === 0 ? 1 : index - 1].id;
            setActiveSessionId(nextActiveId);
        }
    };

    const onSearchChange = (val: string) => {
        setSearchTerm(val);
    };

    const handleSearchKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            if (!searchTerm) return;

            // 1. Check for exact barcode match first (High Priority for Scanners)
            const matchedProduct = products.find(p => p.barcode === searchTerm);
            if (matchedProduct) {
                e.preventDefault();
                handleAddToCart(matchedProduct);
                setSearchTerm('');
                toast.success(`Added ${matchedProduct.name}`, { duration: 1000, icon: '🛒' });
                return;
            }

            // 2. Otherwise, if no products match the search term, open QuickAdd
            if (filteredProducts.length === 0) {
                if (/^\d+$/.test(searchTerm) || searchTerm.length > 5) {
                    setUnknownBarcode(searchTerm);
                    setIsQuickAddOpen(true);
                }
            }
        }
    };

    const handleQuickAddSuccess = (newProduct: any) => {
        // Refresh local product list first
        fetchProducts();
        // Manually add to cart since we have the object
        handleAddToCart(newProduct);
        setSearchTerm('');
    };

    const filteredProducts = products.filter(p => {
        const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           (p.barcode && p.barcode.includes(searchTerm));
        const productCategory = p.category_name || 'Uncategorized';
        const matchCategory = activeCategory === 'All' || productCategory === activeCategory;
        return matchSearch && matchCategory;
    });

    return (
        <div className="flex h-screen bg-gray-50/50 p-4 gap-6 font-sans">
            <Toaster position="top-right" />
            
            {/* Left Panel: Products & Search (70%) */}
            <div className="flex-1 flex flex-col bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden relative">
                
                {/* Header & Search */}
                <div className="p-6 border-b border-gray-100 bg-white z-10">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                                <MonitorCheck className="text-primary" /> Point of Sale
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">Walk-in Customer Billing</p>
                        </div>
                        <div className="flex gap-2 text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-full border border-gray-100">
                            <span className="font-medium text-gray-700">F1</span> to Search
                        </div>
                    </div>

                    <div className="relative">
                        <ScanLine className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Scan barcode or search products..."
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                            onKeyDown={handleSearchKeyDown}
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-inner text-gray-800"
                        />
                    </div>
                    
                    {/* Category Pills */}
                    <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                                    activeCategory === cat 
                                    ? 'bg-primary text-white shadow-md shadow-primary/20' 
                                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Product Grid */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
                    {isFetching ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <Loader2 className="animate-spin mb-4" size={32} />
                            <p>Loading inventory...</p>
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <AlertCircle size={48} className="mb-4 text-gray-300" />
                            <p className="text-lg">No products found</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
                            {filteredProducts.map(product => {
                                const price = product.discounted_price || product.price;
                                const isOutOfStock = product.track_inventory !== false ? product.quantity <= 0 : false;
                                
                                return (
                                    <button
                                        key={product.id}
                                        onClick={() => handleAddToCart(product)}
                                        disabled={isOutOfStock}
                                        className={`group relative flex flex-col text-left bg-white rounded-2xl border p-4 transition-all duration-200 
                                            ${isOutOfStock 
                                                ? 'border-red-100 opacity-60 cursor-not-allowed' 
                                                : 'border-gray-100 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1'
                                            }`}
                                    >
                                        <div className="w-full aspect-square bg-gray-50 rounded-xl mb-3 overflow-hidden flex items-center justify-center relative">
                                            {product.image ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={product.image} alt={product.name} className="object-cover w-full h-full mix-blend-multiply" />
                                            ) : (
                                                <ShoppingCart className="text-gray-300" size={32} />
                                            )}
                                            {isOutOfStock && (
                                                <div className="absolute inset-0 bg-red-500/10 backdrop-blur-sm flex items-center justify-center">
                                                    <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">OUT OF STOCK</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs font-medium text-gray-400 mb-1">{product.category_name || 'Uncategorized'}</p>
                                            <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 leading-tight mb-2">
                                                {product.name}
                                            </h3>
                                        </div>
                                        <div className="flex justify-between items-end mt-2 w-full">
                                            <span className="text-lg font-bold text-gray-900">₹{price}</span>
                                            <span className={`text-xs font-medium px-2 py-1 rounded-md ${isOutOfStock ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                                {product.track_inventory === false ? 'Available' : `${product.quantity} in stock`}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Right Panel: Cart & Checkout (30%) */}
            <div className="w-[400px] flex flex-col bg-white rounded-3xl shadow-xl shadow-primary/5 border border-primary/10 overflow-hidden z-20 relative">
                
                {/* Session Tabs */}
                <div className="flex bg-gray-50/50 border-b border-gray-100 overflow-x-auto scrollbar-hide">
                    {sessions.map((session, idx) => (
                        <div 
                            key={session.id}
                            onClick={() => setActiveSessionId(session.id)}
                            className={`flex items-center gap-2 px-4 py-3 cursor-pointer border-r border-gray-100 transition-all min-w-[100px] relative
                                ${activeSessionId === session.id 
                                    ? 'bg-white font-bold text-primary border-b-2 border-b-primary pt-3.5' 
                                    : 'text-gray-500 hover:bg-gray-100'}`}
                        >
                            <span className="text-xs uppercase tracking-wider">Bill {idx + 1}</span>
                            {session.cart.length > 0 && (
                                <span className="bg-primary/10 text-primary text-[10px] px-1.5 py-0.5 rounded-full ring-1 ring-primary/20">
                                    {session.cart.length}
                                </span>
                            )}
                            <button 
                                onClick={(e) => removeSession(session.id, e)}
                                className="ml-1 hover:text-red-500 transition-colors"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    ))}
                    <button 
                        onClick={addNewSession}
                        className="px-4 py-3 text-gray-400 hover:text-primary transition-colors flex items-center justify-center"
                    >
                        <Plus size={18} />
                    </button>
                </div>

                {activeSession.completedOrder && (
                    <ThermalReceipt 
                        ref={receiptRef} 
                        order={{
                            ...activeSession.completedOrder,
                            order_source: 'Store Order',
                            retailer_gst_number: activeSession.completedOrder.retailer_gst_number || retailerProfile?.gst_number,
                            retailer_receipt_footer: activeSession.completedOrder.retailer_receipt_footer || retailerProfile?.receipt_footer,
                            retailer_show_gst: activeSession.completedOrder.retailer_show_gst ?? (retailerProfile?.show_gst_on_receipt || false),
                            retailer_name: retailerProfile?.shop_name || activeSession.completedOrder.retailer_name,
                            retailer_address: retailerProfile ? `${retailerProfile.address_line1}, ${retailerProfile.city}` : activeSession.completedOrder.retailer_address,
                            retailer_phone: retailerProfile?.contact_phone || activeSession.completedOrder.retailer_phone,
                        }} 
                    />
                )}

                {/* Success Overlay overlaying the right panel */}
                {activeSession.completedOrder && (
                    <div className="absolute inset-0 z-30 bg-white flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-300">
                        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 shadow-inner ring-4 ring-green-50">
                            <MonitorCheck size={40} strokeWidth={2.5} />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 mb-2">Checkout Complete!</h2>
                        <p className="text-gray-500 mb-8">Order <span className="font-bold text-gray-900">#{activeSession.completedOrder.order_number}</span> confirmed.</p>
                        
                        <div className="bg-gray-50 rounded-2xl p-6 w-full mb-8 border border-gray-100">
                            <div className="text-sm text-gray-500 mb-1">Total Paid ({activeSession.completedOrder.payment_mode.toUpperCase()})</div>
                            <div className="text-4xl font-black text-primary">₹{Number(activeSession.completedOrder.total_amount).toFixed(0)}</div>
                        </div>

                        <div className="flex flex-col w-full gap-3">
                            <button
                                onClick={handlePrint}
                                className="w-full bg-gray-900 hover:bg-gray-800 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
                            >
                                <Printer size={20} /> Print Receipt <span className="text-xs font-normal text-gray-400 ml-1">(Enter)</span>
                            </button>
                            <button
                                onClick={handleNewBill}
                                className="w-full bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:bg-gray-100"
                            >
                                <RefreshCcw size={20} /> New Bill <span className="text-xs font-normal text-gray-500 ml-1">(Esc)</span>
                            </button>
                        </div>
                    </div>
                )}
                
                {/* Cart Header */}
                <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-primary/5 to-transparent">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                            Current Order
                        </h2>
                        <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm shadow-primary/30">
                            {activeSession.cart.reduce((s, i) => s + i.cart_quantity, 0)} Items
                        </span>
                    </div>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/30">
                    {activeSession.cart.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 px-6">
                            <ShoppingCart size={48} className="mb-4 text-gray-300" strokeWidth={1.5} />
                            <p className="text-lg font-medium text-gray-600">Cart is empty</p>
                            <p className="text-sm mt-1">Scan a product or click items on the left to add them to the bill.</p>
                        </div>
                    ) : (
                        activeSession.cart.map(item => {
                            const price = item.discounted_price ? Number(item.discounted_price) : Number(item.price);
                            return (
                                <div key={item.id} className="flex gap-3 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm relative group">
                                    <button 
                                        onClick={() => removeFromCart(item.id)}
                                        className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X size={14} />
                                    </button>
                                    <div className="w-16 h-16 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center">
                                         {item.image ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={item.image} alt={item.name} className="object-cover w-full h-full" />
                                            ) : (
                                                <ShoppingCart className="text-gray-300" size={20} />
                                            )}
                                    </div>
                                    <div className="flex-1 flex flex-col justify-between py-0.5">
                                        <div className="pr-4">
                                            <h4 className="text-sm font-semibold text-gray-800 line-clamp-1">{item.name}</h4>
                                            <p className="text-xs text-primary font-medium mt-0.5">₹{price} / item</p>
                                        </div>
                                        <div className="flex justify-between items-center mt-2">
                                            <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-0.5 border border-gray-100">
                                                <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-white rounded shadow-sm text-gray-600 transition-colors">
                                                    <Minus size={12} />
                                                </button>
                                                <input 
                                                    type="number" 
                                                    value={item.cart_quantity} 
                                                    onChange={(e) => {
                                                        const newVal = parseInt(e.target.value) || 0;
                                                        updateQuantity(item.id, newVal - item.cart_quantity);
                                                    }}
                                                    className="w-10 text-center bg-transparent border-none text-sm font-bold focus:ring-0 p-0"
                                                />
                                                <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-white rounded shadow-sm text-gray-600 transition-colors">
                                                    <Plus size={12} />
                                                </button>
                                            </div>
                                            <div className="text-sm font-bold text-gray-900">
                                                ₹{Math.round(price * item.cart_quantity)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Checkout Footer */}
                <div className="p-6 bg-white border-t border-gray-100 rounded-b-3xl">
                    <div className="space-y-3 mb-6">
                        <div className="flex justify-between text-sm text-gray-600 font-medium">
                            <span>Subtotal</span>
                            <span>₹{subtotal.toFixed(0)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600 font-medium">Discount</span>
                            <div className="relative w-24">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium font-sans">₹</span>
                                <input 
                                    type="number" 
                                    min="0"
                                    value={activeSession.discountAmount || ''}
                                    onChange={(e) => updateActiveSession({ discountAmount: Number(e.target.value) })}
                                    className="w-full bg-red-50/50 border border-red-100 rounded-lg py-1.5 pl-6 pr-2 text-right text-red-600 font-bold focus:ring-red-200 outline-none"
                                />
                            </div>
                        </div>
                        <div className="pt-3 border-t border-dashed border-gray-200 flex justify-between items-center">
                            <span className="text-lg font-bold text-gray-900">Total</span>
                            <span className="text-3xl font-black text-primary tracking-tight">₹{total.toFixed(0)}</span>
                        </div>
                    </div>

                    <div className="mb-4 space-y-3">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Customer Details (Optional)</p>
                        
                        <div className="relative">
                            <input
                                type="tel"
                                placeholder="Mobile Number"
                                value={activeSession.customerMobile}
                                maxLength={10}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, ''); // Allow only digits
                                    if (val.length <= 10) {
                                        updateActiveSession({ 
                                            customerMobile: val,
                                            verificationStatus: val.length < 10 ? null : activeSession.verificationStatus
                                        });
                                        setShowSuggestions(val.length >= 3);
                                    }
                                }}
                                onBlur={async (e) => {
                                    setTimeout(() => setShowSuggestions(false), 200);
                                    const mobile = e.target.value;
                                    if(mobile.length >= 10) {
                                        try {
                                            const response = await api.get(`/products/erp/verify-pos-customer/?mobile_number=${mobile}`);
                                            const data = response.data;
                                            updateActiveSession({
                                                verificationStatus: data.status,
                                                customerName: data.name && !activeSession.customerName ? data.name : activeSession.customerName
                                            });
                                        } catch (err) {
                                            console.error(err);
                                        }
                                    }
                                }}
                                onFocus={() => setShowSuggestions(true)}
                                className="w-full bg-gray-50 border border-gray-100 rounded-xl py-2.5 px-4 text-sm focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                            />
                            {activeSession.verificationStatus === 'verified' && (
                                <span className="absolute right-3 top-3 text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded">✓ Verified App User</span>
                            )}
                            {activeSession.verificationStatus === 'returning_guest' && (
                                <span className="absolute right-3 top-3 text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">✓ Returning Walk-in</span>
                            )}

                            {/* Dropdown Suggestions */}
                            {showSuggestions && (customerSuggestions.length > 0 || isLoadingSuggestions) && (
                                <div className="absolute z-10 w-full mt-1 bg-white rounded-xl border border-gray-100 shadow-xl overflow-hidden">
                                    {isLoadingSuggestions ? (
                                        <div className="p-4 flex items-center justify-center gap-2 text-sm text-gray-500 font-medium">
                                            <Loader2 size={16} className="animate-spin" /> Fetching...
                                        </div>
                                    ) : (
                                        <ul className="max-h-56 overflow-y-auto">
                                            {customerSuggestions.map((sug, i) => (
                                                <li 
                                                    key={i}
                                                    onMouseDown={(e) => {
                                                        e.preventDefault(); // Prevent input blur from firing first
                                                        updateActiveSession({
                                                            customerMobile: sug.mobile,
                                                            customerName: sug.name,
                                                            verificationStatus: sug.status
                                                        });
                                                        setShowSuggestions(false);
                                                    }}
                                                    className="px-4 py-2.5 hover:bg-primary/5 cursor-pointer flex justify-between items-center transition-colors border-b last:border-b-0"
                                                >
                                                    <div>
                                                        <div className="font-bold text-gray-800 text-[13px]">{sug.mobile}</div>
                                                        <div className="text-xs text-gray-500 font-medium">{sug.name || 'Unknown Name'}</div>
                                                    </div>
                                                    {sug.status === 'verified' && (
                                                        <span className="text-[9px] font-bold text-green-600 bg-green-100 px-1.5 py-0.5 rounded-md uppercase tracking-wider">App User</span>
                                                    )}
                                                    {sug.status === 'returning_guest' && (
                                                        <span className="text-[9px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-md uppercase tracking-wider">Walk-in</span>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            )}
                        </div>

                        <input
                            type="text"
                            placeholder="Customer Name"
                            value={activeSession.customerName}
                            onChange={(e) => updateActiveSession({ customerName: e.target.value })}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl py-2.5 px-4 text-sm focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                        />
                    </div>

                    <div className="mb-4">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Payment Mode</p>
                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                onClick={() => updateActiveSession({ paymentMode: 'cash' })}
                                className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-bold transition-all ${
                                    activeSession.paymentMode === 'cash' 
                                    ? 'border-green-500 bg-green-500/10 text-green-700' 
                                    : 'border-gray-100 text-gray-500 hover:border-gray-200 hover:bg-gray-50'
                                }`}
                            >
                                <Banknote size={18} /> Cash
                            </button>
                            <button 
                                onClick={() => updateActiveSession({ paymentMode: 'upi' })}
                                className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-bold transition-all ${
                                    activeSession.paymentMode === 'upi' 
                                    ? 'border-primary bg-primary/10 text-primary' 
                                    : 'border-gray-100 text-gray-500 hover:border-gray-200 hover:bg-gray-50'
                                }`}
                            >
                                <CreditCard size={18} /> UPI
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={handleCheckout}
                        disabled={activeSession.cart.length === 0 || isCheckoutLoading}
                        className="w-full bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/25 disabled:shadow-none disabled:bg-gray-300 disabled:text-gray-500 py-4 rounded-xl font-bold text-lg flex justify-center items-center gap-3 transition-all active:scale-[0.98]"
                    >
                        {isCheckoutLoading ? (
                            <Loader2 className="animate-spin" size={24} />
                        ) : (
                            <>
                                Complete Bill <span className="opacity-75 font-normal text-sm">(Enter)</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
            
            <QuickAddModal 
                isOpen={isQuickAddOpen}
                onClose={() => setIsQuickAddOpen(false)}
                barcode={unknownBarcode}
                onSuccess={handleQuickAddSuccess}
            />
        </div>
    );
}
