'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import api, { authService, customerService, offerService } from '@/services/api';
import { 
    Search, Plus, Minus, X, CreditCard, Banknote, 
    ShoppingCart, Loader2, MonitorCheck, ScanLine, AlertCircle, Printer, RefreshCcw, Star,
    MessageSquare, Check, Keyboard, Users, Tag, Barcode, ArrowLeft, ChevronRight, Trash2, Camera
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import { useReactToPrint } from 'react-to-print';
import { ThermalReceipt } from '@/components/pos/ThermalReceipt';
import { QuickAddModal } from '@/components/pos/QuickAddModal';
import POSReturnModal from '@/components/pos/POSReturnModal';
import KeyboardShortcutPanel from '@/components/pos/KeyboardShortcutPanel';
import POSOnboardingTour from '@/components/pos/POSOnboardingTour';
import POSStatusBar from '@/components/pos/POSStatusBar';
import { POSCartLineDetails } from '@/components/pos/POSCartLineDetails';
import { BarcodeScanner } from '@/components/products/BarcodeScanner';
import { UpiQrPanel } from '@/components/pos/UpiQrPanel';
import { getDisplayStockQuantity } from '@/utils/saleableQuantity';
import { getBatchMrp, pickPosBatch } from '@/utils/posBatches';
import { pickPosCartLineBrandName } from '@/utils/posCartLineBrand';
import { POS_DEFAULT_RATING, customerCheckUpdate } from '@/utils/posCustomer';
import { billOversells } from '@/utils/posOversell';
import { applySaleToProducts } from '@/utils/posStockAfterSale';
import { posProductsCache } from '@/services/sessionCache';
import { BarcodeLabel } from '@/components/products/BarcodeLabel';
import { BrandNameLabel } from '@/components/products/BrandNameLabel';
import { AvailabilityBadges } from '@/components/products/AvailabilityBadges';
import { ProductGroupLabel } from '@/components/products/ProductGroupLabel';
import { SeasonalBadge } from '@/components/products/SeasonalBadge';

interface Product {
    id: number;
    name: string;
    price: number | string;
    discounted_price: number | string;
    image: string;
    quantity: number; // Gross stock qty
    saleable_quantity?: number | string | null;
    category_name: string;
    brand_name?: string | null;
    barcode?: string | null;
    product_group?: string | null;
    is_seasonal?: boolean | null;
    is_available?: boolean | null;
    is_in_stock?: boolean | null;
    track_inventory?: boolean;
    has_batches?: boolean;
    batches?: any[];
}

interface CartItem {
    id: number;
    name: string;
    price: number;
    quantity: number;
    track_inventory: boolean;
    cart_quantity: number;
    batch_id?: number | null;
    batch_name?: string | null;
    original_price?: number;
    barcode?: string;
    image?: string;
    brand_name?: string | null;
}

interface CustomerSuggestion {
    mobile: string;
    name: string;
    status: 'verified' | 'returning_guest';
}

/** Reference for an open bill, unique per bill so UPI intents never reuse a `tr`. */
const createBillRef = () => `POS${Date.now().toString(36).toUpperCase()}`;

interface POSSession {
    id: string;
    billRef: string;
    cart: CartItem[];
    customerName: string;
    customerMobile: string;
    paymentMode: 'cash' | 'upi' | 'credit' | 'split';
    paymentSplit: {
        cash: number;
        upi: number;
        credit: number;
    };
    discountAmount: number;
    verificationStatus: 'verified' | 'returning_guest' | 'new' | null;
    completedOrder: any | null;
}

interface RetailerProfile {
    shop_name: string;
    upi_id?: string | null;
    contact_phone: string;
    address_line1: string;
    city: string;
    gst_number?: string;
    receipt_footer?: string;
    show_gst_on_receipt?: boolean;
    print_upi_qr_on_receipt?: boolean;
    printer_size?: string;
}

/** Below Tailwind's md breakpoint, where the POS switches to the phone layout. */
const isPhoneWidth = () => typeof window !== 'undefined' && window.innerWidth < 768;

export default function POSPage() {
    // Phones get the single-column POS: an items screen and a bill screen, with a sticky bar between them.
    const [isMobileScreen, setIsMobileScreen] = useState(false);
    const [mobileView, setMobileView] = useState<'items' | 'cart'>('items');
    const [isCameraScanOpen, setIsCameraScanOpen] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const checkSize = () => {
            setIsMobileScreen(isPhoneWidth());
        };
        checkSize();
        window.addEventListener('resize', checkSize);
        return () => window.removeEventListener('resize', checkSize);
    }, []);

    const [products, setProducts] = useState<Product[]>(() => (posProductsCache.peek() as Product[] | undefined) ?? []);
    const [categories, setCategories] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [retailerProfile, setRetailerProfile] = useState<RetailerProfile | null>(null);
    
    // Multi-Session State
    const [sessions, setSessions] = useState<POSSession[]>([
        {
            id: '1',
            billRef: createBillRef(),
            cart: [],
            customerName: '',
            customerMobile: '',
            paymentMode: 'cash',
            paymentSplit: { cash: 0, upi: 0, credit: 0 },
            discountAmount: 0,
            verificationStatus: null,
            completedOrder: null
        }
    ]);
    const [activeSessionId, setActiveSessionId] = useState('1');

    const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
    
    const [offerCalculation, setOfferCalculation] = useState<{
        totalSavings: number;
        appliedOffers: any[];
        isLoading: boolean;
    }>({
        totalSavings: 0,
        appliedOffers: [],
        isLoading: false
    });

    useEffect(() => {
        if (!activeSession || !activeSession.cart || activeSession.cart.length === 0) {
            setOfferCalculation({
                totalSavings: 0,
                appliedOffers: [],
                isLoading: false
            });
            return;
        }

        setOfferCalculation(prev => ({ ...prev, isLoading: true }));

        const timer = setTimeout(async () => {
            try {
                const itemsPayload = activeSession.cart.map(item => ({
                    product_id: item.id,
                    quantity: item.cart_quantity,
                    price: item.price
                }));

                const response = await offerService.calculateOffers(itemsPayload);
                setOfferCalculation({
                    totalSavings: parseFloat(response.data.total_savings) || 0,
                    appliedOffers: response.data.applied_offers || [],
                    isLoading: false
                });
            } catch (error) {
                console.error("Failed to calculate POS offers:", error);
                setOfferCalculation(prev => ({ ...prev, isLoading: false }));
            }
        }, 400);

        return () => clearTimeout(timer);
    }, [activeSession.cart, activeSessionId]);
    
    const [customerSuggestions, setCustomerSuggestions] = useState<CustomerSuggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(() => !posProductsCache.peek());

    // Rating State
    const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
    const [selectedRating, setSelectedRating] = useState<number>(POS_DEFAULT_RATING);
    const [ratingComment, setRatingComment] = useState('');
    const [isRatingSubmitting, setIsRatingSubmitting] = useState(false);
    const [ratingSubmitted, setRatingSubmitted] = useState(false);

    // Return Modal State
    const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
    
    // Quick Add State
    const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
    const [unknownBarcode, setUnknownBarcode] = useState('');
    
    // Batch Selector State
    const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
    const [batchModalProduct, setBatchModalProduct] = useState<Product | null>(null);
    
    // Keyboard Navigation State
    const [activeGridIndex, setActiveGridIndex] = useState(-1);
    const [activeCartIndex, setActiveCartIndex] = useState(-1);
    const [currentFocus, setCurrentFocus] = useState<'search' | 'grid' | 'cart' | 'checkout' | 'success' | 'empty' | 'customer'>('search');
    const [visibleCount, setVisibleCount] = useState(20);
    const [isCheatsheetOpen, setIsCheatsheetOpen] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);
    
    // Barcode scanner ref
    const searchInputRef = useRef<HTMLInputElement>(null);
    const mobileInputRef = useRef<HTMLInputElement>(null);
    const discountInputRef = useRef<HTMLInputElement>(null);
    const cartContainerRef = useRef<HTMLDivElement>(null);
    
    // Receipt print ref
    const receiptRef = useRef<HTMLDivElement>(null);
    const handlePrint = useReactToPrint({
        contentRef: receiptRef,
    });

    // Auto-scroll cart to bottom when items are added
    useEffect(() => {
        if (cartContainerRef.current) {
            // Smooth scroll to bottom to ensure last added item is visible
            cartContainerRef.current.scrollTo({
                top: cartContainerRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [activeSession.cart.length]); // Scroll only when a NEW item is added

    // Check for first-time onboarding
    useEffect(() => {
        const done = localStorage.getItem('pos_onboarding_done');
        if (!done && !isPhoneWidth()) {
            // Delay to let the page render first
            setTimeout(() => setShowOnboarding(true), 800);
        }
    }, []);

    const handleOnboardingComplete = useCallback(() => {
        setShowOnboarding(false);
        localStorage.setItem('pos_onboarding_done', 'true');
        searchInputRef.current?.focus();
    }, []);

    const handleReplayTour = useCallback(() => {
        setIsCheatsheetOpen(false);
        localStorage.removeItem('pos_onboarding_done');
        setTimeout(() => setShowOnboarding(true), 300);
    }, []);

    useEffect(() => {
        fetchProducts();
        fetchProfile();
        // Auto-focus search on load
        // A phone keyboard would cover the items, so only a desktop focuses the search up front.
        if (!isPhoneWidth()) setTimeout(() => searchInputRef.current?.focus(), 300);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Global keyboard shortcut handler
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't intercept when typing in input/textarea (except our specific Alt shortcuts)
            const target = e.target as HTMLElement;
            const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
            const isModal = isRatingModalOpen || isBatchModalOpen || isQuickAddOpen || isReturnModalOpen;

            // --- Post-checkout shortcuts ---
            if (activeSession.completedOrder) {
                if (e.ctrlKey && e.key === 'p') {
                    e.preventDefault();
                    handlePrint();
                    return;
                }
                if (e.altKey && e.key.toLowerCase() === 'n') {
                    e.preventDefault();
                    handleNewBill();
                    return;
                }
                return;
            }

            // --- Don't intercept inside modals ---
            if (isModal) return;

            // --- Alt + Key shortcuts (work even when typing) ---
            if (e.altKey) {
                switch (e.key.toLowerCase()) {
                    case 's': // Focus Search
                        e.preventDefault();
                        searchInputRef.current?.focus();
                        setCurrentFocus('search');
                        setActiveGridIndex(-1);
                        setActiveCartIndex(-1);
                        break;
                    case 'n': // New Bill
                        e.preventDefault();
                        handleNewBill();
                        break;
                    case 'c': // Focus Cart
                        e.preventDefault();
                        if (activeSession.cart.length > 0) {
                            setActiveCartIndex(0);
                            setCurrentFocus('cart');
                            setActiveGridIndex(-1);
                            (document.activeElement as HTMLElement)?.blur();
                        }
                        break;
                    case 'm': // Focus Mobile
                        e.preventDefault();
                        mobileInputRef.current?.focus();
                        setCurrentFocus('customer');
                        break;
                    case 'd': // Focus Discount
                        e.preventDefault();
                        discountInputRef.current?.focus();
                        setCurrentFocus('checkout');
                        break;
                    case 'r': // Sales Return
                        e.preventDefault();
                        setIsReturnModalOpen(true);
                        break;
                    case 't': // New Tab
                        e.preventDefault();
                        addNewSession();
                        break;
                    case 'k': // Toggle Cheatsheet
                        e.preventDefault();
                        setIsCheatsheetOpen(prev => !prev);
                        break;
                    case '1': // Cash
                        e.preventDefault();
                        updateActiveSession({ paymentMode: 'cash' });
                        setCurrentFocus('checkout');
                        break;
                    case '2': // UPI
                        e.preventDefault();
                        updateActiveSession({ paymentMode: 'upi' });
                        setCurrentFocus('checkout');
                        break;
                    case '3': // Credit
                        e.preventDefault();
                        updateActiveSession({ paymentMode: 'credit' });
                        setCurrentFocus('checkout');
                        break;
                    case '4': // Split
                        e.preventDefault();
                        updateActiveSession({ 
                            paymentMode: 'split',
                            paymentSplit: { cash: total, upi: 0, credit: 0 }
                        });
                        setCurrentFocus('checkout');
                        break;
                    case ']': // Next session
                        e.preventDefault();
                        {
                            const idx = sessions.findIndex(s => s.id === activeSessionId);
                            if (idx < sessions.length - 1) setActiveSessionId(sessions[idx + 1].id);
                        }
                        break;
                    case '[': // Prev session
                        e.preventDefault();
                        {
                            const idx = sessions.findIndex(s => s.id === activeSessionId);
                            if (idx > 0) setActiveSessionId(sessions[idx - 1].id);
                        }
                        break;
                }
                return;
            }

            // --- Ctrl+Enter: Checkout ---
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                handleCheckout();
                return;
            }

            // --- Cart keyboard navigation (only when cart is focused, not typing) ---
            if (currentFocus === 'cart' && activeCartIndex >= 0 && !isTyping) {
                const cart = activeSession.cart;
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setActiveCartIndex(prev => Math.min(prev + 1, cart.length - 1));
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setActiveCartIndex(prev => Math.max(prev - 1, 0));
                } else if (e.key === '+' || e.key === '=' || e.key === 'ArrowRight') {
                    e.preventDefault();
                    const item = cart[activeCartIndex];
                    if (item) updateQuantity(item.id, 1, item.batch_id ?? null);
                } else if (e.key === '-' || e.key === 'ArrowLeft') {
                    e.preventDefault();
                    const item = cart[activeCartIndex];
                    if (item) updateQuantity(item.id, -1, item.batch_id ?? null);
                } else if (e.key === 'Delete' || e.key === 'Backspace') {
                    e.preventDefault();
                    const item = cart[activeCartIndex];
                    if (item) {
                        removeFromCart(item.id, item.batch_id ?? null);
                        setActiveCartIndex(prev => Math.min(prev, cart.length - 2));
                    }
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    setActiveCartIndex(-1);
                    setCurrentFocus('search');
                    searchInputRef.current?.focus();
                }
                return;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeSession.completedOrder, activeSession.cart, activeCartIndex, currentFocus, sessions, activeSessionId, isRatingModalOpen, isBatchModalOpen, isQuickAddOpen, isReturnModalOpen]);
    
    const fetchProfile = async () => {
        try {
            const response = await authService.fetchProfile();
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
            // Check product-level AND batch-level barcodes
            const matches = products.filter(p => 
                p.barcode === searchTerm || 
                (p.batches && p.batches.some(b => b.barcode === searchTerm))
            );
            if (matches.length === 1) {
                const added = handleAddToCart(matches[0], searchTerm);
                setSearchTerm('');
                if (added) toast.success(`Added ${matches[0].name}`, { duration: 1000, icon: '🛒' });
            } else if (matches.length > 1) {
                handleAddToCart(matches[0], searchTerm);
                setSearchTerm('');
            }
        }, 400);

        return () => clearTimeout(timer);
    }, [searchTerm, products]);

    const showProducts = (dataList: Product[]) => {
        setProducts(dataList);
        // Extract unique categories
        const cats = Array.from(new Set(dataList.map((p: Product) => p.category_name || 'Uncategorized')));
        setCategories(['All', ...cats as string[]]);
    };

    const loadProductList = async () => {
        const response = await api.get('/products/?no_page=true&is_active=true');
        return (response.data.results || response.data || []) as Product[];
    };

    // The list is kept for the page load (see sessionCache): coming back to the POS reuses it, and
    // `reload` fetches it again after a change the POS cannot apply itself.
    const fetchProducts = async ({ reload = false, quiet = false } = {}) => {
        const cached = !reload && (posProductsCache.peek() as Product[] | undefined);
        if (cached) {
            showProducts(cached);
            setIsFetching(false);
            return;
        }
        if (!quiet) setIsFetching(true);
        try {
            const request = reload ? posProductsCache.refresh(loadProductList) : posProductsCache.load(loadProductList);
            const loaded = await request;
            // A sale recorded while this was loading is in the cache, not in `loaded`.
            showProducts(((posProductsCache.peek() ?? loaded) as Product[]));
        } catch (error) {
            if (!quiet) toast.error("Failed to load products for POS");
            console.error(error);
        } finally {
            setIsFetching(false);
        }
    };

    const updateActiveSession = (update: Partial<POSSession>) => {
        setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, ...update } : s));
    };

    const handleAddToCart = (product: Product, scanBarcode?: string) => {
        const shouldTrack = product.track_inventory !== false;
        
        // POS allows negative stock, so we don't block here
        if (shouldTrack && !product.has_batches && getDisplayStockQuantity(product) <= 0) {
            console.log(`${product.name} is out of stock in system, but allowing sale.`);
        }

        // If product has batches, we need to select one (never an expired one: BE refuses it)
        if (product.has_batches && product.batches && product.batches.length > 0) {
            const pick = pickPosBatch(product.batches, scanBarcode, product.barcode);
            if (pick.kind === 'batch') {
                finalizeAddToCart(product, pick.batch);
                return true;
            }
            if (pick.kind === 'choose') {
                setBatchModalProduct(product);
                setIsBatchModalOpen(true);
                return true;
            }
            toast.error(pick.kind === 'expired'
                ? `${product.name}: batch ${pick.batch.batch_number || pick.batch.id} has expired and cannot be sold`
                : `${product.name}: no batch can be sold (all expired or inactive)`);
            return false;
        }

        finalizeAddToCart(product);
        return true;
    };

    const finalizeAddToCart = (product: Product, batch?: any) => {
        const shouldTrack = product.track_inventory !== false;
        const price = batch ? parseFloat(batch.price) : (typeof product.price === 'string' ? parseFloat(product.price) : product.price);
        const originalPrice = batch 
            ? parseFloat(batch.original_price) 
            : (typeof product.discounted_price === 'string' 
                ? parseFloat(product.discounted_price) 
                : (typeof product.price === 'string' 
                    ? parseFloat(product.price) 
                    : (product.price || 0)
                  )
              );
        const quantity = batch ? batch.quantity : getDisplayStockQuantity(product);
        
        // POS allows negative stock, so we don't block even if quantity is <= 0
        if (shouldTrack && quantity <= 0) {
            console.log(`Selected batch/product is out of stock in system, but allowing sale.`);
        }

        const existing = activeSession.cart.find(item => 
            item.id === product.id && item.batch_id === (batch?.id || null)
        );

        let updatedCart;
        if (existing) {
            // POS allows negative stock, so we don't cap the quantity
            updatedCart = activeSession.cart.map(item => 
                (item.id === product.id && item.batch_id === (batch?.id || null))
                ? { ...item, cart_quantity: item.cart_quantity + 1 } 
                : item
            );
        } else {
            updatedCart = [...activeSession.cart, { 
                id: product.id,
                name: product.name,
                price: price,
                original_price: originalPrice,
                quantity: quantity,
                track_inventory: shouldTrack,
                cart_quantity: 1,
                batch_id: batch?.id || null,
                batch_name: batch?.batch_number || null,
                barcode: batch?.barcode || product.barcode,
                image: product.image,
                brand_name: pickPosCartLineBrandName(product),
            }];
        }

        updateActiveSession({ cart: updatedCart });
        if (batch) setIsBatchModalOpen(false);
        // Auto-focus back to search for continuous scanning
        setActiveGridIndex(-1);
        setCurrentFocus('search');
        if (!isPhoneWidth()) setTimeout(() => searchInputRef.current?.focus(), 50);
    };

    const updateQuantity = (id: number, delta: number, batchId: number | null = null) => {
        const updatedCart = activeSession.cart.map(item => {
            if (item.id === id && item.batch_id === batchId) {
                // Use precise float addition for decimals
                const newQty = Math.round((item.cart_quantity + delta) * 1000) / 1000;
                const shouldTrack = item.track_inventory !== false;
                
                // POS allows negative stock - show warning but don't block
                if (shouldTrack && newQty > item.quantity && delta > 0) {
                    toast(`Stock: ${item.quantity} in system. Billing allowed.`, { icon: '⚠️', duration: 1500 });
                }
                if (newQty <= 0) return { ...item, cart_quantity: 0 };
                return { ...item, cart_quantity: newQty };
            }
            return item;
        }).filter(item => item.cart_quantity > 0);

        updateActiveSession({ cart: updatedCart });
    };

    const setQuantity = (id: number, value: string, batchId: number | null = null) => {
        const qty = parseFloat(value);
        const updatedCart = activeSession.cart.map(item => {
            if (item.id === id && item.batch_id === batchId) {
                if (isNaN(qty) || qty < 0) return { ...item, cart_quantity: 0 };
                return { ...item, cart_quantity: qty };
            }
            return item;
        }).filter(item => item.cart_quantity > 0);

        updateActiveSession({ cart: updatedCart });
    };

    const removeFromCart = (id: number, batchId: number | null = null) => {
        updateActiveSession({ 
            cart: activeSession.cart.filter(item => !(item.id === id && item.batch_id === batchId)) 
        });
    };

    const subtotal = Math.round(activeSession.cart.reduce((sum, item) => {
        return sum + (item.price * item.cart_quantity);
    }, 0));

    const total = Math.max(0, subtotal - Math.max(offerCalculation.totalSavings, activeSession.discountAmount));

    // Order number once the bill is settled, otherwise the open bill's reference.
    const upiBillRef = activeSession.completedOrder?.order_number || activeSession.billRef;

    const handleCheckout = async () => {
        if (activeSession.cart.length === 0) {
            toast.error("Cart is empty");
            return;
        }
        
        if (activeSession.customerMobile.length > 0 && activeSession.customerMobile.length !== 10) {
            toast.error("Mobile number must be exactly 10 digits");
            return;
        }

        if (activeSession.paymentMode === 'credit' && !activeSession.customerMobile) {
            toast.error("Customer mobile is required for Credit (Udhaar) sales");
            mobileInputRef.current?.focus();
            return;
        }

        if (activeSession.paymentMode === 'split') {
            const sum = activeSession.paymentSplit.cash + activeSession.paymentSplit.upi + activeSession.paymentSplit.credit;
            if (Math.abs(sum - total) > 1) { // Allowing 1 rupee rounding diff
                toast.error(`Total split (₹${sum}) does not match bill total (₹${total})`);
                return;
            }
            if (activeSession.paymentSplit.credit > 0 && !activeSession.customerMobile) {
                toast.error("Customer mobile is required for partial Credit (Udhaar)");
                mobileInputRef.current?.focus();
                return;
            }
        }

        setIsCheckoutLoading(true);
        try {
            const payload: any = {
                items: activeSession.cart.map(item => ({
                    product_id: item.id,
                    batch_id: item.batch_id,
                    quantity: item.cart_quantity,
                    unit_price: item.price
                })),
                payment_mode: activeSession.paymentMode,
                subtotal: subtotal,
                discount_amount: activeSession.discountAmount,
                total_amount: total,
                customer_name: activeSession.customerName,
                customer_mobile: activeSession.customerMobile
            };

            // The API takes a bill past the stock on hand only for a role with orders.oversell, and refuses
            // the flag from any other role before it looks at stock, so ask only when a line needs it.
            if (billOversells(activeSession.cart)) {
                payload.allow_negative = true;
            }

            if (activeSession.paymentMode === 'split') {
                payload.payment_details = {
                    cash: activeSession.paymentSplit.cash,
                    upi: activeSession.paymentSplit.upi,
                    credit: activeSession.paymentSplit.credit
                };
            }

            const response = await api.post('/products/erp/pos-checkout/', payload);
            toast.success(`Order ${response.data.order.order_number} created successfully!`);
            
            updateActiveSession({ completedOrder: response.data.order });
            // Take the sold stock off the cached list instead of loading every product again.
            const sold = applySaleToProducts((posProductsCache.peek() as Product[] | undefined) ?? products, activeSession.cart);
            posProductsCache.set(sold);
            showProducts(sold);
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Checkout failed");
            // A refusal (stock, oversell permission) means the shown stock may be out of date, and a
            // timeout may still have saved the bill, so load the stock again in the background.
            fetchProducts({ reload: true, quiet: true });
        } finally {
            setIsCheckoutLoading(false);
        }
    };

    const handleNewBill = () => {
        updateActiveSession({
            billRef: createBillRef(),
            cart: [],
            customerName: '',
            customerMobile: '',
            paymentMode: 'cash',
            paymentSplit: { cash: 0, upi: 0, credit: 0 },
            discountAmount: 0,
            verificationStatus: null,
            completedOrder: null
        });
        setRatingSubmitted(false);
        setSelectedRating(POS_DEFAULT_RATING);
        setRatingComment('');
        setActiveGridIndex(-1);
        setActiveCartIndex(-1);
        setCurrentFocus('search');
        setMobileView('items');
        if (!isPhoneWidth()) setTimeout(() => searchInputRef.current?.focus(), 100);
    };

    const handleRatingSubmit = async () => {
        if (!activeSession.completedOrder?.id || !activeSession.completedOrder?.customer) {
            toast.error("Cannot rate: No customer linked to this order.");
            return;
        }

        setIsRatingSubmitting(true);
        try {
            // Same route as the order page (orders/<id>/rate-customer/).
            await customerService.rateCustomer(activeSession.completedOrder.id, selectedRating, ratingComment);
            toast.success("Customer rated successfully!");
            setRatingSubmitted(true);
            setTimeout(() => setIsRatingModalOpen(false), 1500);
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to submit rating");
        } finally {
            setIsRatingSubmitting(false);
        }
    };

    const addNewSession = () => {
        const newId = String(Date.now());
        const newSession: POSSession = {
            id: newId,
            billRef: createBillRef(),
            cart: [],
            customerName: '',
            customerMobile: '',
            paymentMode: 'cash',
            paymentSplit: { cash: 0, upi: 0, credit: 0 },
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
        setActiveGridIndex(-1); // Reset grid selection on new search
        setCurrentFocus('search');
        setVisibleCount(20); // Reset visible count on new search
    };

    const handleSearchKeyDown = (e: React.KeyboardEvent) => {
        // Arrow key navigation for product grid
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (filteredProducts.length > 0) {
                const cols = window.innerWidth >= 1280 ? 4 : 3;
                setActiveGridIndex(prev => {
                    const next = Math.min(prev + cols, filteredProducts.length - 1);
                    if (next >= visibleCount) {
                        setVisibleCount(next + 20); // Auto-expand when navigating down
                    }
                    return next;
                });
                setCurrentFocus('grid');
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (activeGridIndex > 0) {
                const cols = window.innerWidth >= 1280 ? 4 : 3;
                setActiveGridIndex(prev => Math.max(prev - cols, 0));
            } else {
                setActiveGridIndex(-1);
                setCurrentFocus('search');
            }
        } else if (e.key === 'ArrowRight') {
            if (activeGridIndex >= 0) {
                e.preventDefault();
                setActiveGridIndex(prev => {
                    const next = Math.min(prev + 1, filteredProducts.length - 1);
                    if (next >= visibleCount) {
                        setVisibleCount(next + 20); // Auto-expand when navigating right
                    }
                    return next;
                });
            }
        } else if (e.key === 'ArrowLeft') {
            if (activeGridIndex >= 0) {
                e.preventDefault();
                setActiveGridIndex(prev => Math.max(prev - 1, 0));
            }
        } else if (e.key === 'Enter') {
            // If a grid item is highlighted, add it
            if (activeGridIndex >= 0 && filteredProducts[activeGridIndex]) {
                e.preventDefault();
                handleAddToCart(filteredProducts[activeGridIndex]);
                setSearchTerm('');
                setActiveGridIndex(-1);
                return;
            }

            if (!searchTerm) return;

            // Support barcode*qty multiplier syntax
            let actualBarcode = searchTerm;
            let multiplier = 1;
            if (searchTerm.includes('*')) {
                const parts = searchTerm.split('*');
                actualBarcode = parts[0];
                multiplier = parseInt(parts[1]) || 1;
                multiplier = Math.max(1, Math.min(multiplier, 999)); // Safety clamp
            }

            // 1. Check for exact barcode match first (High Priority for Scanners)
            const matches = findProductsByBarcode(actualBarcode);
            if (matches.length > 0) {
                e.preventDefault();
                let added = true;
                for (let i = 0; i < multiplier && added; i++) {
                    added = handleAddToCart(matches[0], actualBarcode);
                }
                if (added && multiplier > 1) toast.success(`Added ${multiplier}× ${matches[0].name}`, { duration: 1500, icon: '📦' });
                setSearchTerm('');
                return;
            }

            // 2. If single search result, add it directly
            if (filteredProducts.length === 1) {
                e.preventDefault();
                let added = true;
                for (let i = 0; i < multiplier && added; i++) {
                    added = handleAddToCart(filteredProducts[0]);
                }
                setSearchTerm('');
                return;
            }

            // 3. Otherwise, if no products match the search term, open QuickAdd
            if (filteredProducts.length === 0) {
                if (/^\d+$/.test(actualBarcode) || actualBarcode.length > 5) {
                    setUnknownBarcode(actualBarcode);
                    setIsQuickAddOpen(true);
                }
            }
        } else if (e.key === 'Escape') {
            setActiveGridIndex(-1);
            setSearchTerm('');
        }
    };

    const findProductsByBarcode = (code: string) =>
        products.filter(p => p.barcode === code || (p.batches && p.batches.some(b => b.barcode === code)));

    // Phone camera scan: same lookup as a scanner typing into the search box.
    // The scanner stays open, so each code adds to the bill until the cashier closes it.
    const handleCameraScan = (code: string) => {
        const scanned = code.trim();
        if (!scanned) return;
        const matches = findProductsByBarcode(scanned);
        if (matches.length > 0) {
            handleAddToCart(matches[0], scanned);
            toast.success(`Added ${matches[0].name}`, { duration: 1200 });
            return;
        }
        if (/^\d+$/.test(scanned) || scanned.length > 5) {
            // Quick add needs the screen, so close the camera for it.
            setIsCameraScanOpen(false);
            setUnknownBarcode(scanned);
            setIsQuickAddOpen(true);
            return;
        }
        toast.error(`No product found for ${scanned}`);
    };

    const handleQuickAddSuccess = (newProduct: any, linkedBarcode?: string) => {
        // Refresh local product list first
        fetchProducts({ reload: true, quiet: true });
        // Add to cart with the linked barcode so the correct batch auto-selects
        handleAddToCart(newProduct, linkedBarcode);
        setSearchTerm('');
    };

    const filteredProducts = products.filter(p => {
        const matchSearch = (() => {
            const searchLower = searchTerm.toLowerCase().trim();
            if (!searchLower) return true;
            const words = searchLower.split(/\s+/).filter(Boolean);
            return words.every(word => 
                p.name.toLowerCase().includes(word) || 
                (p.barcode && p.barcode.includes(word)) ||
                (p.batches && p.batches.some(b => b.barcode && b.barcode.includes(word)))
            );
        })();
        const productCategory = p.category_name || 'Uncategorized';
        const matchCategory = activeCategory === 'All' || productCategory === activeCategory;
        return matchSearch && matchCategory;
    });

    const displayedProducts = filteredProducts.slice(0, visibleCount);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
        // Load more when scrolled within 1.5 screen heights of the bottom
        if (scrollHeight - scrollTop <= clientHeight * 1.5) {
            if (visibleCount < filteredProducts.length) {
                setVisibleCount(prev => prev + 20);
            }
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex flex-col h-[100dvh] md:static md:z-auto md:h-screen lg:flex-row bg-white md:pb-12 font-sans overflow-hidden">
            <Toaster position={isMobileScreen ? 'top-center' : 'top-right'} />

            {/* Left Panel: Products & Search (50%) - FIXED / FLUSH */}
            <div className={`${mobileView === 'cart' ? 'hidden' : 'flex'} md:flex w-full lg:w-1/2 flex-1 min-h-0 md:flex-none md:h-[50vh] lg:h-full flex-col bg-white border-b lg:border-b-0 lg:border-r border-gray-100 overflow-hidden relative`}>
                
                {/* Header & Search */}
                <div className="p-3 md:p-6 border-b border-gray-100 bg-white z-10">
                    {/* Phone header: back, title and the two shop actions, all large touch targets */}
                    <div className="flex md:hidden items-center gap-2 mb-3">
                        <a
                            href="/dashboard"
                            aria-label="Back to dashboard"
                            className="w-11 h-11 -ml-1 flex items-center justify-center rounded-xl text-gray-600 active:bg-gray-100"
                        >
                            <ArrowLeft size={24} />
                        </a>
                        <h1 className="flex-1 text-xl font-black tracking-tight text-gray-900">Point of Sale</h1>
                        <button
                            onClick={() => setIsReturnModalOpen(true)}
                            className="min-w-[56px] h-11 px-2 flex flex-col items-center justify-center rounded-xl bg-red-50 text-red-600 active:bg-red-100"
                        >
                            <RefreshCcw size={18} />
                            <span className="text-[11px] font-bold leading-tight">Return</span>
                        </button>
                        <button
                            onClick={() => {
                                const ids = Array.from(new Set(activeSession.cart.map((item) => item.id)));
                                window.location.href = ids.length
                                    ? `/dashboard/print-labels/?ids=${ids.join(",")}`
                                    : "/dashboard/print-labels/";
                            }}
                            className="min-w-[56px] h-11 px-2 flex flex-col items-center justify-center rounded-xl bg-primary/10 text-primary active:bg-primary/20"
                        >
                            <Barcode size={18} />
                            <span className="text-[11px] font-bold leading-tight">Labels</span>
                        </button>
                    </div>

                    <div className="hidden md:flex justify-between items-center mb-6">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                                <MonitorCheck className="text-primary" /> Point of Sale
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">Walk-in Customer Billing</p>
                        </div>
                        <div className="flex gap-3 items-center">
                            <button
                                onClick={() => {
                                    const ids = Array.from(new Set(activeSession.cart.map((item) => item.id)));
                                    const href = ids.length
                                      ? `/dashboard/print-labels/?ids=${ids.join(",")}`
                                      : "/dashboard/print-labels/";
                                    window.location.href = href;
                                }}
                                className="flex gap-2 items-center px-4 py-2 bg-primary/10 text-primary rounded-xl hover:bg-primary/15 transition-all font-bold text-sm border border-primary/20"
                                title="Print barcode labels for cart items"
                            >
                                <Barcode size={18} /> Labels
                            </button>
                            <button
                                onClick={() => setIsReturnModalOpen(true)}
                                className="flex gap-2 items-center px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all font-bold text-sm border border-red-100"
                            >
                                <RefreshCcw size={18} /> Sale Return
                                <kbd className="ml-1 px-1.5 py-0.5 bg-red-100 text-red-500 rounded text-[10px] font-mono font-bold border border-red-200">Alt+R</kbd>
                            </button>
                            <button
                                onClick={() => setIsCheatsheetOpen(true)}
                                className="flex gap-2 items-center px-3 py-2 bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100 transition-all font-bold text-sm border border-gray-100"
                                title="Keyboard Shortcuts (Alt+K)"
                            >
                                <Keyboard size={18} />
                                <kbd className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px] font-mono font-bold border border-gray-200">Alt+K</kbd>
                            </button>
                        </div>
                    </div>

                    <div className="relative" data-tour="search">
                        <ScanLine className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder={isMobileScreen ? 'Search or scan an item' : 'Scan barcode or search... (Alt+S)  •  Use barcode*qty for bulk'}
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                            onKeyDown={handleSearchKeyDown}
                            onFocus={() => setCurrentFocus('search')}
                            className="w-full pl-12 pr-14 md:pr-4 py-3.5 md:py-4 text-base bg-gray-50 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-inner text-gray-800"
                        />
                        {isMobileScreen && (
                            <button
                                type="button"
                                onClick={() => setIsCameraScanOpen(true)}
                                aria-label="Scan barcode with camera"
                                className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-xl text-primary active:bg-primary/10"
                            >
                                <Camera size={22} />
                            </button>
                        )}
                    </div>
                    
                    {/* Category Pills */}
                    <div className="flex gap-2 mt-3 md:mt-4 overflow-x-auto pb-1 md:pb-2 scrollbar-hide">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => { setActiveCategory(cat); setVisibleCount(20); }}
                                className={`px-5 py-2.5 md:py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
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
                <div className="flex-1 overflow-y-auto p-3 md:p-6 bg-gray-50/30" data-tour="product-grid" onScroll={handleScroll}>
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
                        <div className={isMobileScreen ? 'flex flex-col gap-2 pb-4' : 'grid grid-cols-2 xl:grid-cols-3 gap-4 pb-20'}>
                            {displayedProducts.map((product, gridIdx) => {
                                const price = product.discounted_price || product.price;
                                const isOutOfStock = product.track_inventory !== false ? getDisplayStockQuantity(product) <= 0 : false;
                                const isGridActive = gridIdx === activeGridIndex;

                                if (isMobileScreen) {
                                    const inCartQty = activeSession.cart
                                        .filter(item => item.id === product.id)
                                        .reduce((sum, item) => sum + item.cart_quantity, 0);
                                    // One cart line, so minus and plus can act on it directly. Batch products add through the batch picker.
                                    const canStep = inCartQty > 0 && !product.has_batches;
                                    return (
                                        <div
                                            key={product.id}
                                            className={`flex items-center gap-3 bg-white rounded-2xl border p-2.5 ${inCartQty > 0 ? 'border-primary/40 bg-primary/5' : 'border-gray-100'} ${isOutOfStock ? 'opacity-60' : ''}`}
                                        >
                                            <button
                                                onClick={() => handleAddToCart(product)}
                                                disabled={isOutOfStock}
                                                className="flex flex-1 min-w-0 items-center gap-3 text-left"
                                            >
                                                <div className="w-14 h-14 shrink-0 bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center">
                                                    {product.image ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img src={product.image} alt="" className="object-cover w-full h-full mix-blend-multiply" />
                                                    ) : (
                                                        <ShoppingCart className="text-gray-300" size={24} />
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="text-[15px] font-semibold text-gray-900 line-clamp-2 leading-tight">{product.name}</h3>
                                                    <BrandNameLabel product={product} />
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-base font-black text-gray-900">₹{price}</span>
                                                        <span className={`text-xs font-medium ${isOutOfStock ? 'text-red-600' : 'text-gray-500'}`}>
                                                            {isOutOfStock ? 'Out of stock' : product.track_inventory === false ? 'Available' : `${getDisplayStockQuantity(product)} in stock`}
                                                        </span>
                                                    </div>
                                                </div>
                                            </button>
                                            {canStep ? (
                                                <div className="flex items-center shrink-0 bg-white rounded-xl border border-primary/30">
                                                    <button
                                                        aria-label={`Remove one ${product.name}`}
                                                        onClick={() => updateQuantity(product.id, -1, null)}
                                                        className="w-11 h-11 flex items-center justify-center text-primary active:bg-primary/10 rounded-l-xl"
                                                    >
                                                        <Minus size={20} />
                                                    </button>
                                                    <span className="min-w-[28px] text-center font-black text-base">{inCartQty}</span>
                                                    <button
                                                        aria-label={`Add one ${product.name}`}
                                                        onClick={() => updateQuantity(product.id, 1, null)}
                                                        className="w-11 h-11 flex items-center justify-center text-primary active:bg-primary/10 rounded-r-xl"
                                                    >
                                                        <Plus size={20} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    aria-label={`Add ${product.name}`}
                                                    onClick={() => handleAddToCart(product)}
                                                    disabled={isOutOfStock}
                                                    className="relative w-12 h-12 shrink-0 rounded-xl bg-primary text-white flex items-center justify-center active:scale-95 disabled:bg-gray-200 disabled:text-gray-400"
                                                >
                                                    <Plus size={24} />
                                                    {inCartQty > 0 && (
                                                        <span className="absolute -top-1.5 -right-1.5 min-w-[22px] h-[22px] px-1 rounded-full bg-green-500 text-white text-xs font-black flex items-center justify-center ring-2 ring-white">{inCartQty}</span>
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    );
                                }

                                return (
                                    <button
                                        key={product.id}
                                        data-grid-index={gridIdx}
                                        onClick={() => handleAddToCart(product)}
                                        disabled={isOutOfStock}
                                        className={`group relative flex flex-col text-left bg-white rounded-2xl border p-4 transition-all duration-200 
                                            ${isGridActive
                                                ? 'border-primary border-2 shadow-lg shadow-primary/15 -translate-y-1 ring-2 ring-primary/20'
                                                : isOutOfStock 
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
                                            <div className="mb-2">
                                                <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 leading-tight">
                                                    {product.name}
                                                </h3>
                                                <BrandNameLabel product={product} />
                                                <ProductGroupLabel product={product} />
                                                <BarcodeLabel product={product} />
                                                <SeasonalBadge product={product} className="mt-0.5" />
                                                <AvailabilityBadges product={product} className="mt-0.5" />
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-end mt-2 w-full">
                                            {/* No margin badge here: the POS screen can face customers at the counter. */}
                                            <span className="text-lg font-bold text-gray-900">₹{price}</span>
                                            <span className={`text-xs font-medium px-2 py-1 rounded-md ${isOutOfStock ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                                {product.track_inventory === false ? 'Available' : `${getDisplayStockQuantity(product)} in stock`}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Phone: sticky bar that opens the bill */}
                {activeSession.cart.length > 0 && (
                    <div className="md:hidden shrink-0 p-3 bg-white border-t border-gray-100 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                        <button
                            onClick={() => setMobileView('cart')}
                            className="w-full h-14 px-5 rounded-2xl bg-primary text-white font-black text-base flex items-center justify-between active:scale-[0.98]"
                        >
                            <span className="flex items-center gap-2">
                                <ShoppingCart size={20} />
                                {activeSession.cart.length} {activeSession.cart.length === 1 ? 'item' : 'items'}
                            </span>
                            <span className="flex items-center gap-1 text-lg">
                                ₹{total.toFixed(0)} <ChevronRight size={22} />
                            </span>
                        </button>
                    </div>
                )}
            </div>

            {/* Right Panel: Cart & Checkout (50%) - FIXED / FLUSH */}
            <div className={`${mobileView === 'items' ? 'hidden' : 'flex'} md:flex w-full lg:w-1/2 flex-1 min-h-0 md:flex-none md:h-[50vh] lg:h-full flex-col bg-white border-t lg:border-t-0 lg:border-l border-gray-100 overflow-hidden z-20 relative shadow-2xl shadow-black/5`}>
                {/* Phone header: back to the items, with what is on the bill */}
                <div className="flex md:hidden items-center gap-2 p-3 border-b border-gray-100 bg-white">
                    <button
                        onClick={() => setMobileView('items')}
                        aria-label="Back to items"
                        className="h-11 pl-2 pr-4 flex items-center gap-1 rounded-xl text-primary font-bold active:bg-primary/10"
                    >
                        <ArrowLeft size={22} /> Items
                    </button>
                    <h2 className="flex-1 text-right text-base font-black text-gray-900">
                        Bill · {activeSession.cart.length} {activeSession.cart.length === 1 ? 'item' : 'items'}
                    </h2>
                </div>

                {/* Session Tabs */}
                <div className="flex bg-gray-50/50 border-b border-gray-100 overflow-x-auto scrollbar-hide">
                    {sessions.map((session, idx) => (
                        <div 
                            key={session.id}
                            onClick={() => setActiveSessionId(session.id)}
                            className={`flex items-center gap-2 px-4 py-3 md:py-3 min-h-[44px] cursor-pointer border-r border-gray-100 transition-all min-w-[100px] relative
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
                                aria-label="Close bill"
                                className="ml-1 p-1.5 md:p-0 hover:text-red-500 transition-colors"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ))}
                    <button 
                        onClick={addNewSession}
                        className="px-4 py-3 min-h-[44px] text-gray-400 hover:text-primary transition-colors flex items-center justify-center gap-1"
                        aria-label="New bill"
                        title="New Bill Tab (Alt+T)"
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
                            retailer_print_upi_qr: activeSession.completedOrder.retailer_print_upi_qr ?? (retailerProfile?.print_upi_qr_on_receipt || false),
                            retailer_upi_id: activeSession.completedOrder.retailer_upi_id || retailerProfile?.upi_id,
                            print_upi_qr_scope: 'pos',
                            retailer_name: retailerProfile?.shop_name || activeSession.completedOrder.retailer_name,
                            retailer_address: retailerProfile ? `${retailerProfile.address_line1}, ${retailerProfile.city}` : activeSession.completedOrder.retailer_address,
                            retailer_phone: retailerProfile?.contact_phone || activeSession.completedOrder.retailer_phone,
                            retailer_printer_size: activeSession.completedOrder.retailer_printer_size || retailerProfile?.printer_size || '80mm',
                            ledger_previous_balance: activeSession.completedOrder.ledger_previous_balance,
                            ledger_new_balance: activeSession.completedOrder.ledger_new_balance,
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
                                <Printer size={20} /> Print Receipt <kbd className="hidden md:inline ml-2 px-1.5 py-0.5 bg-gray-700 text-gray-300 rounded text-[10px] font-mono font-bold border border-gray-600">Ctrl+P</kbd>
                            </button>
                            <button
                                onClick={handleNewBill}
                                className="w-full bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:bg-gray-100"
                            >
                                <RefreshCcw size={20} /> New Bill <kbd className="hidden md:inline ml-2 px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px] font-mono font-bold border border-gray-200">Alt+N</kbd>
                            </button>

                            {activeSession.completedOrder?.customer && !ratingSubmitted && (
                                <button
                                    onClick={() => setIsRatingModalOpen(true)}
                                    className="w-full bg-primary/10 hover:bg-primary/20 text-primary py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all mt-2"
                                >
                                    <Star size={20} /> Rate Customer
                                </button>
                            )}
                        </div>
                    </div>
                )}
                
                {/* Cart Header */}
                <div className="hidden md:block p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white" data-tour="cart">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-black tracking-tighter text-gray-900 flex items-center gap-2">
                            Current Order
                            <kbd className="px-1.5 py-0.5 bg-white text-gray-400 rounded text-[9px] font-mono font-bold border border-gray-200">Alt+C</kbd>
                        </h2>
                        <div className="flex items-center gap-3">
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-2">Total Order Summary</span>
                                <div className="flex gap-2">
                                    <div className="bg-white border-2 border-gray-100 text-gray-800 px-4 py-2 rounded-2xl flex flex-col items-center min-w-[70px] shadow-sm">
                                        <span className="text-[9px] font-black text-gray-400 uppercase leading-none mb-1">Items</span>
                                        <span className="text-xl font-black leading-none">{activeSession.cart.length}</span>
                                    </div>
                                    <div className="bg-primary text-white px-5 py-2 rounded-2xl flex flex-col items-center min-w-[80px] shadow-lg shadow-primary/20 ring-4 ring-primary/10">
                                        <span className="text-[9px] font-black text-white/70 uppercase leading-none mb-1">Total Qty</span>
                                        <span className="text-2xl font-black leading-none">
                                            {activeSession.cart.reduce((s, i) => s + i.cart_quantity, 0)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* On a phone the cart lines and the checkout fields scroll together; md:contents leaves the desktop panel as it was. */}
                <div className="flex-1 min-h-0 overflow-y-auto md:contents">
                {/* Cart Items Table */}
                <div ref={cartContainerRef} className="md:flex-1 md:overflow-y-auto bg-gray-50/10 border-b border-gray-100 scroll-smooth">
                    {activeSession.cart.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 px-6 p-4">
                            <ShoppingCart size={48} className="mb-4 text-gray-300" strokeWidth={1.5} />
                            <p className="text-lg font-medium text-gray-600">Cart is empty</p>
                            <p className="text-sm mt-1">Scan a product or click items on the left to add them to the bill.</p>
                            <button
                                onClick={() => setMobileView('items')}
                                className="md:hidden mt-6 h-12 px-6 rounded-xl bg-primary text-white font-bold"
                            >
                                Add items
                            </button>
                        </div>
                    ) : (
                        <>
                        {/* Phone: one card per line with large quantity buttons */}
                        <div className="md:hidden divide-y divide-gray-100">
                            {activeSession.cart.map((item) => (
                                <div key={`${item.id}-${item.batch_id}`} className="bg-white p-3">
                                    <div className="flex items-start gap-2">
                                        <div className="flex-1 min-w-0">
                                            <POSCartLineDetails item={item} />
                                            <div className="text-xs text-gray-500 mt-0.5">₹{item.price.toFixed(2)} each</div>
                                        </div>
                                        <button
                                            onClick={() => removeFromCart(item.id, item.batch_id)}
                                            aria-label={`Remove ${item.name}`}
                                            className="w-10 h-10 -mt-1 -mr-1 flex items-center justify-center rounded-xl text-gray-400 active:bg-red-50 active:text-red-500"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between mt-2">
                                        <div className="flex items-center bg-gray-100 rounded-xl">
                                            <button
                                                onClick={() => updateQuantity(item.id, -1, item.batch_id)}
                                                aria-label={`Remove one ${item.name}`}
                                                className="w-12 h-12 flex items-center justify-center text-gray-700 active:bg-gray-200 rounded-l-xl"
                                            >
                                                <Minus size={20} />
                                            </button>
                                            <input
                                                type="number"
                                                inputMode="decimal"
                                                step="any"
                                                value={item.cart_quantity}
                                                onChange={(e) => setQuantity(item.id, e.target.value, item.batch_id)}
                                                aria-label={`Quantity of ${item.name}`}
                                                className="w-14 h-12 text-center text-base font-black bg-transparent outline-none border-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            />
                                            <button
                                                onClick={() => updateQuantity(item.id, 1, item.batch_id)}
                                                aria-label={`Add one ${item.name}`}
                                                className="w-12 h-12 flex items-center justify-center text-gray-700 active:bg-gray-200 rounded-r-xl"
                                            >
                                                <Plus size={20} />
                                            </button>
                                        </div>
                                        <span className="text-lg font-black text-gray-900">₹{Math.round(item.price * item.cart_quantity)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <table className="hidden md:table w-full text-left border-collapse">
                            <thead className="sticky top-0 bg-white shadow-sm z-10">
                                <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                                    <th className="px-6 py-3">Item Details</th>
                                    <th className="px-4 py-3 text-center">Quantity</th>
                                    <th className="px-4 py-3 text-right">Price</th>
                                    <th className="px-6 py-3 text-right">Total</th>
                                    <th className="px-4 py-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {activeSession.cart.map((item, cartIdx) => {
                                    const isCartActive = cartIdx === activeCartIndex && currentFocus === 'cart';
                                    return (
                                        <tr 
                                            key={`${item.id}-${item.batch_id}`} 
                                            className={`group transition-all ${isCartActive ? 'bg-primary/5' : 'bg-white hover:bg-gray-50/50'}`}
                                        >
                                            <td className="px-6 py-4">
                                                <POSCartLineDetails item={item} />
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center justify-center bg-gray-100 rounded-lg p-0.5 w-fit mx-auto border border-gray-200/50">
                                                    <button onClick={() => updateQuantity(item.id, -1, item.batch_id)} className="p-1 hover:bg-white rounded shadow-sm text-gray-600 transition-colors">
                                                        <Minus size={10} />
                                                    </button>
                                                    <input 
                                                        type="number" 
                                                        step="any"
                                                        value={item.cart_quantity} 
                                                        onChange={(e) => setQuantity(item.id, e.target.value, item.batch_id)}
                                                        className="w-12 text-center text-xs font-black bg-transparent outline-none border-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                    />
                                                    <button onClick={() => updateQuantity(item.id, 1, item.batch_id)} className="p-1 hover:bg-white rounded shadow-sm text-gray-600 transition-colors">
                                                        <Plus size={10} />
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-right text-sm font-medium text-gray-500">
                                                ₹{item.price.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm font-black text-gray-900">
                                                ₹{Math.round(item.price * item.cart_quantity)}
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <button 
                                                    onClick={() => removeFromCart(item.id, item.batch_id)}
                                                    className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        </>
                    )}
                </div>

                {/* Checkout Footer */}
                <div className="flex flex-col p-4 md:p-6 bg-white border-t border-gray-100 rounded-b-3xl">
                    <div className="space-y-3 mb-4 md:mb-6">
                        <div className="flex justify-between text-sm text-gray-600 font-medium">
                            <span>Subtotal</span>
                            <span>₹{subtotal.toFixed(0)}</span>
                        </div>
                        
                        {/* Auto applied offers listing */}
                        {offerCalculation.appliedOffers.length > 0 && (
                            <div className="p-3 bg-green-50 rounded-2xl border border-green-100 flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="flex items-center gap-1.5 text-xs font-black text-green-700 uppercase tracking-widest">
                                    <Tag size={12} /> Applied Offers ({offerCalculation.appliedOffers.length})
                                </div>
                                <div className="space-y-1">
                                    {offerCalculation.appliedOffers.map((off: any, idx: number) => (
                                        <div key={idx} className="flex justify-between text-xs text-green-600 font-medium">
                                            <span>{off.name || off.description}</span>
                                            <span className="font-bold">−₹{Math.round(off.savings || 0)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {offerCalculation.totalSavings > 0 && (
                            <div className="flex justify-between items-center text-sm text-green-600 font-bold">
                                <span className="flex items-center gap-1">
                                    <Tag size={14} /> Offer Savings
                                </span>
                                <span>−₹{offerCalculation.totalSavings.toFixed(0)}</span>
                            </div>
                        )}

                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600 font-medium flex flex-col">
                                <span>Manual Discount</span>
                                {activeSession.discountAmount > 0 && offerCalculation.totalSavings > 0 && (
                                    <span className="text-[10px] text-gray-400 font-normal">
                                        {activeSession.discountAmount >= offerCalculation.totalSavings 
                                            ? '(Manual discount overrides automatic offers)' 
                                            : '(Automatic offers override manual discount)'
                                        }
                                    </span>
                                )}
                            </span>
                            <div className="relative w-24">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium font-sans">₹</span>
                                <input 
                                    ref={discountInputRef}
                                    type="number" 
                                    min="0"
                                    value={activeSession.discountAmount || ''}
                                    onChange={(e) => updateActiveSession({ discountAmount: Number(e.target.value) })}
                                    onFocus={() => setCurrentFocus('checkout')}
                                    className="w-full bg-red-50/50 border border-red-100 rounded-lg py-2.5 md:py-1.5 pl-6 pr-2 text-base md:text-sm text-right text-red-600 font-bold focus:ring-red-200 outline-none"
                                />
                            </div>
                        </div>

                        {offerCalculation.isLoading && (
                            <div className="flex justify-center items-center gap-1.5 py-1 text-xs text-primary/60 font-medium">
                                <Loader2 size={12} className="animate-spin" /> Calculating real-time offers...
                            </div>
                        )}

                        <div className="pt-4 border-t-2 border-dashed border-gray-200 flex justify-between items-center">
                            <span className="text-xl font-black text-gray-900 uppercase tracking-tighter">Total</span>
                            <span className="text-4xl md:text-5xl font-black text-primary tracking-tighter">₹{total.toFixed(0)}</span>
                        </div>
                    </div>

                    <div className="mb-4 space-y-3 order-3 md:order-none">
                    <div className="mb-4 space-y-4">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Customer (optional)</p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                            <div className="relative">
                                <input
                                    ref={mobileInputRef}
                                    type="tel"
                                    placeholder={isMobileScreen ? 'Customer mobile number' : 'Mobile Number (Alt+M)'}
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
                                                // The cashier may have typed a name meanwhile: read the session as it is now.
                                                setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, ...customerCheckUpdate(s.customerName, data) } : s));
                                            } catch (err) {
                                                console.error(err);
                                            }
                                        }
                                    }}
                                    onFocus={() => { setShowSuggestions(true); setCurrentFocus('customer'); }}
                                    className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3.5 md:py-3 px-4 text-base md:text-sm font-bold focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                                />
                                {activeSession.verificationStatus === 'verified' && (
                                    <span className="absolute right-3 -top-2 text-[8px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded shadow-sm border border-green-100">VERIFIED USER</span>
                                )}
                                {activeSession.verificationStatus === 'returning_guest' && (
                                    <span className="absolute right-3 -top-2 text-[8px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded shadow-sm border border-blue-100">WALK-IN GUEST</span>
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
                                placeholder={isMobileScreen ? 'Customer name' : 'Customer Name'}
                                value={activeSession.customerName}
                                onChange={(e) => updateActiveSession({ customerName: e.target.value })}
                                className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3.5 md:py-3 px-4 text-base md:text-sm font-bold focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                            />
                        </div>
                    </div>
                    </div>

                    <div className="mb-4 order-2 md:order-none" data-tour="payment">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Payment Mode</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            <button 
                                onClick={() => updateActiveSession({ paymentMode: 'cash' })}
                                className={`flex items-center justify-center gap-2 py-3.5 md:py-3 rounded-xl border-2 font-bold transition-all ${
                                    activeSession.paymentMode === 'cash' 
                                    ? 'border-green-500 bg-green-500/10 text-green-700' 
                                    : 'border-gray-100 text-gray-500 hover:border-gray-200 hover:bg-gray-50'
                                }`}
                            >
                                <Banknote size={18} /> Cash
                                <kbd className="hidden md:inline px-1 py-0.5 bg-green-100 text-green-600 rounded text-[9px] font-mono font-bold border border-green-200">Alt+1</kbd>
                            </button>
                            <button 
                                onClick={() => updateActiveSession({ paymentMode: 'upi' })}
                                className={`flex items-center justify-center gap-2 py-3.5 md:py-3 rounded-xl border-2 font-bold transition-all ${
                                    activeSession.paymentMode === 'upi' 
                                    ? 'border-primary bg-primary/10 text-primary' 
                                    : 'border-gray-100 text-gray-500 hover:border-gray-200 hover:bg-gray-50'
                                }`}
                            >
                                <CreditCard size={18} /> UPI
                                <kbd className="hidden md:inline px-1 py-0.5 bg-primary/10 text-primary rounded text-[9px] font-mono font-bold border border-primary/20">Alt+2</kbd>
                            </button>
                            <button 
                                onClick={() => updateActiveSession({ paymentMode: 'credit' })}
                                className={`flex items-center justify-center gap-2 py-3.5 md:py-3 rounded-xl border-2 font-bold transition-all ${
                                    activeSession.paymentMode === 'credit' 
                                    ? 'border-orange-500 bg-orange-500/10 text-orange-700' 
                                    : 'border-gray-100 text-gray-500 hover:border-gray-200 hover:bg-gray-50'
                                }`}
                            >
                                <Users size={18} /> Credit
                                <kbd className="hidden md:inline px-1 py-0.5 bg-orange-100 text-orange-600 rounded text-[9px] font-mono font-bold border border-orange-200">Alt+3</kbd>
                            </button>
                            <button 
                                onClick={() => updateActiveSession({ 
                                    paymentMode: 'split',
                                    paymentSplit: { cash: total, upi: 0, credit: 0 } 
                                })}
                                className={`flex items-center justify-center gap-2 py-3.5 md:py-3 rounded-xl border-2 font-bold transition-all ${
                                    activeSession.paymentMode === 'split' 
                                    ? 'border-purple-500 bg-purple-500/10 text-purple-700' 
                                    : 'border-gray-100 text-gray-500 hover:border-gray-200 hover:bg-gray-50'
                                }`}
                            >
                                <Plus size={18} /> Split
                                <kbd className="hidden md:inline px-1 py-0.5 bg-purple-100 text-purple-600 rounded text-[9px] font-mono font-bold border border-purple-200">Alt+4</kbd>
                            </button>
                        </div>

                        {activeSession.paymentMode === 'split' && (
                            <div className="mt-4 p-4 bg-purple-50 rounded-2xl border border-purple-100 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="flex items-center justify-between text-purple-700 mb-1">
                                    <span className="text-xs font-black uppercase tracking-widest">Partial Payment Details</span>
                                    <span className="text-xs font-bold">Bill Total: ₹{total}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-purple-400 uppercase">Cash</label>
                                        <input 
                                            type="number"
                                            inputMode="decimal"
                                            value={activeSession.paymentSplit.cash || ''}
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value) || 0;
                                                updateActiveSession({ paymentSplit: { ...activeSession.paymentSplit, cash: val } });
                                            }}
                                            className="w-full bg-white border border-purple-200 rounded-lg py-3 md:py-2 px-3 text-base md:text-sm font-black focus:ring-2 focus:ring-purple-500/20 outline-none"
                                            placeholder="0"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-purple-400 uppercase">UPI</label>
                                        <input 
                                            type="number"
                                            inputMode="decimal"
                                            value={activeSession.paymentSplit.upi || ''}
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value) || 0;
                                                updateActiveSession({ paymentSplit: { ...activeSession.paymentSplit, upi: val } });
                                            }}
                                            className="w-full bg-white border border-purple-200 rounded-lg py-3 md:py-2 px-3 text-base md:text-sm font-black focus:ring-2 focus:ring-purple-500/20 outline-none"
                                            placeholder="0"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-purple-400 uppercase">Credit</label>
                                        <input 
                                            type="number"
                                            inputMode="decimal"
                                            value={activeSession.paymentSplit.credit || ''}
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value) || 0;
                                                updateActiveSession({ paymentSplit: { ...activeSession.paymentSplit, credit: val } });
                                            }}
                                            className="w-full bg-white border border-purple-200 rounded-lg py-3 md:py-2 px-3 text-base md:text-sm font-black focus:ring-2 focus:ring-purple-500/20 outline-none"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                                {Math.abs((activeSession.paymentSplit.cash + activeSession.paymentSplit.upi + activeSession.paymentSplit.credit) - total) > 1 && (
                                    <p className="text-[10px] font-bold text-red-500 mt-1 animate-pulse text-center">
                                        Sum (₹{activeSession.paymentSplit.cash + activeSession.paymentSplit.upi + activeSession.paymentSplit.credit}) must be ₹{total}
                                    </p>
                                )}
                            </div>
                        )}

                        <UpiQrPanel
                            paymentMode={activeSession.paymentMode}
                            total={total}
                            paymentSplit={activeSession.paymentSplit}
                            upiId={retailerProfile?.upi_id}
                            shopName={retailerProfile?.shop_name}
                            billRef={upiBillRef}
                        />
                    </div>

                    <button
                        onClick={handleCheckout}
                        disabled={activeSession.cart.length === 0 || isCheckoutLoading}
                        className="hidden md:flex w-full bg-primary hover:bg-primary/90 text-white shadow-2xl shadow-primary/40 disabled:shadow-none disabled:bg-gray-300 disabled:text-gray-500 py-5 rounded-2xl font-black text-xl flex justify-center items-center gap-3 transition-all active:scale-[0.98] border-b-4 border-primary/20"
                        data-tour="checkout"
                    >
                        {isCheckoutLoading ? (
                            <Loader2 className="animate-spin" size={28} />
                        ) : (
                            <>
                                COMPLETE BILL <kbd className="ml-2 px-2.5 py-1 bg-white/20 text-white/90 rounded-lg text-xs font-mono font-bold border border-white/30">Ctrl+↵</kbd>
                            </>
                        )}
                    </button>
                </div>
                </div>

                {/* Phone: total and the one button that finishes the bill stay in reach */}
                <div className="md:hidden shrink-0 flex items-center gap-3 p-3 bg-white border-t border-gray-100 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                    <div className="leading-tight">
                        <div className="text-[11px] font-bold text-gray-400 uppercase">Total</div>
                        <div className="text-2xl font-black text-primary">₹{total.toFixed(0)}</div>
                    </div>
                    <button
                        onClick={handleCheckout}
                        disabled={activeSession.cart.length === 0 || isCheckoutLoading}
                        className="flex-1 h-14 rounded-2xl bg-primary text-white font-black text-base flex justify-center items-center gap-2 disabled:bg-gray-300 disabled:text-gray-500 active:scale-[0.98]"
                    >
                        {isCheckoutLoading ? <Loader2 className="animate-spin" size={24} /> : 'COMPLETE BILL'}
                    </button>
                </div>
            </div>

            <POSReturnModal 
                isOpen={isReturnModalOpen}
                onClose={() => setIsReturnModalOpen(false)}
                onSuccess={() => {
                    fetchProducts({ reload: true, quiet: true }); // Refresh stock after return
                }}
            />
            
            <QuickAddModal 
                isOpen={isQuickAddOpen}
                onClose={() => setIsQuickAddOpen(false)}
                barcode={unknownBarcode}
                onSuccess={handleQuickAddSuccess}
            />

            {/* Batch Selection Modal */}
            {isBatchModalOpen && batchModalProduct && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Select Batch</h2>
                                <p className="text-sm text-gray-500">{batchModalProduct.name}</p>
                            </div>
                            <button onClick={() => setIsBatchModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <X size={20} className="text-gray-400" />
                            </button>
                        </div>
                        
                        <div className="p-6 max-h-[60vh] overflow-y-auto">
                            <div className="grid gap-3">
                                {batchModalProduct.batches?.filter(b => b.is_active !== false).map((batch) => {
                                    const isDiffPrice = parseFloat(batch.price) !== parseFloat(batchModalProduct.price as any);
                                    const mrp = getBatchMrp(batch);
                                    const isDiffMRP = mrp !== null && mrp !== parseFloat(batchModalProduct.discounted_price as any);
                                    const expired = batch.is_expired === true;

                                    return (
                                        <button
                                            key={batch.id}
                                            onClick={() => finalizeAddToCart(batchModalProduct, batch)}
                                            disabled={expired}
                                            className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all group text-left border-gray-100 ${expired ? 'opacity-60 cursor-not-allowed' : 'hover:border-primary hover:bg-primary/5'}`}
                                        >
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-gray-900">
                                                        {batch.batch_number || `Batch #${batch.id}`}
                                                    </span>
                                                    {batch.barcode && (
                                                        <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-500 font-medium">
                                                            {batch.barcode}
                                                        </span>
                                                    )}
                                                    {expired && (
                                                        <span className="text-[10px] bg-red-50 px-2 py-0.5 rounded text-red-600 font-bold uppercase">
                                                            Expired
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex gap-3 text-sm">
                                                    <span className={`${isDiffPrice ? 'text-primary font-bold' : 'text-gray-500'}`}>
                                                        Price: ₹{parseFloat(batch.price).toFixed(2)}
                                                    </span>
                                                    {mrp !== null && (
                                                        <span className={`${isDiffMRP ? 'text-orange-500 font-bold' : 'text-gray-400'}`}>
                                                            MRP: ₹{mrp.toFixed(2)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <div className="text-right">
                                                <p className={`text-xs font-bold uppercase tracking-wider ${batch.quantity > 5 ? 'text-green-600' : 'text-red-500'}`}>
                                                    {batch.quantity} in stock
                                                </p>
                                                {!expired && (
                                                    <div className="mt-2 text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 font-bold text-sm">
                                                        Select <Check size={16} />
                                                    </div>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        
                        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
                            <button onClick={() => setIsBatchModalOpen(false)} className="px-6 py-2 bg-white border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-100">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isCameraScanOpen && (
                <BarcodeScanner onScanSuccess={handleCameraScan} onClose={() => setIsCameraScanOpen(false)} />
            )}

            {/* Rating Modal */}
            {isRatingModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in duration-300">
                        <div className="p-8 text-center">
                            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
                                <MessageSquare size={32} />
                            </div>
                            
                            <h3 className="text-2xl font-black text-gray-900 mb-2">Rate Customer</h3>
                            <p className="text-gray-500 mb-8">How was your interaction with {activeSession.completedOrder?.customer_name || 'this customer'}?</p>
                            
                            {/* Stars */}
                            <div className="flex justify-center gap-4 mb-8">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        onClick={() => {
                                            if (star === 1 && selectedRating === 1) setSelectedRating(0);
                                            else setSelectedRating(star);
                                        }}
                                        className="transition-transform active:scale-90"
                                    >
                                        <Star 
                                            size={40} 
                                            className={star <= selectedRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'} 
                                            strokeWidth={star <= selectedRating ? 2.5 : 2}
                                        />
                                    </button>
                                ))}
                            </div>

                            {/* Warning for 0 stars (Blacklist) */}
                            {selectedRating === 0 && (
                                <div className="bg-red-600 text-white p-4 rounded-xl text-sm font-bold mb-6 animate-pulse border border-red-700 shadow-lg">
                                    <AlertCircle className="inline mr-2" size={18} /> 
                                    CRITICAL WARNING: 0 stars will BLACKLIST this customer! They won't be able to order from you again.
                                </div>
                            )}

                            {selectedRating > 0 && selectedRating <= 2 && (
                                <div className="bg-orange-50 text-orange-700 p-3 rounded-xl text-xs font-medium mb-6 border border-orange-100">
                                    Low rating selected. Please add a comment to help us understand.
                                </div>
                            )}

                            <textarea
                                value={ratingComment}
                                onChange={(e) => setRatingComment(e.target.value)}
                                placeholder="Add optional comments..."
                                className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none h-24 mb-8"
                            />

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setIsRatingModalOpen(false)}
                                    className="flex-1 py-4 text-gray-500 font-bold hover:bg-gray-50 rounded-2xl transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleRatingSubmit}
                                    disabled={isRatingSubmitting || ratingSubmitted}
                                    className={`flex-1 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${
                                        ratingSubmitted 
                                        ? 'bg-green-500 text-white shadow-green-500/20' 
                                        : 'bg-primary text-white shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5'
                                    }`}
                                >
                                    {isRatingSubmitting ? (
                                        <Loader2 className="animate-spin" size={20} />
                                    ) : ratingSubmitted ? (
                                        <><Check size={20} /> Saved</>
                                    ) : 'Submit Rating'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Keyboard Shortcut Cheatsheet Panel */}
            <KeyboardShortcutPanel 
                isOpen={isCheatsheetOpen} 
                onClose={() => setIsCheatsheetOpen(false)}
                onReplayTour={handleReplayTour}
            />

            {/* Context-Sensitive Status Bar */}
            {!isMobileScreen && <POSStatusBar 
                currentFocus={activeSession.completedOrder ? 'success' : currentFocus} 
                cartItemCount={activeSession.cart.length} 
            />}

            {/* First-Time Onboarding Tour */}
            <POSOnboardingTour 
                isActive={showOnboarding} 
                onComplete={handleOnboardingComplete} 
            />
        </div>
    );
}
