import React, { useState, useEffect } from 'react';
import { X, Save, Link as LinkIcon, PlusCircle, Loader2, Search } from 'lucide-react';
import api from '@/services/api';
import { toast } from 'react-hot-toast';

interface Product {
    id: number;
    name: string;
    price: number | string;
    barcode?: string;
}

interface QuickAddModalProps {
    isOpen: boolean;
    onClose: () => void;
    barcode: string;
    onSuccess: (product: any, linkedBarcode?: string) => void;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({ isOpen, onClose, barcode, onSuccess }) => {
    const [mode, setMode] = useState<'link' | 'new'>('new');
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // For linking
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Product[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    useEffect(() => {
        if (mode === 'link' && searchQuery.length >= 2) {
            const delayDebounceFn = setTimeout(async () => {
                setIsSearching(true);
                try {
                    const res = await api.get(`/products/search/?search=${searchQuery}&limit=5`);
                    setSearchResults(res.data.results || res.data);
                } catch (err) {
                    console.error(err);
                } finally {
                    setIsSearching(false);
                }
            }, 300);
            return () => clearTimeout(delayDebounceFn);
        } else {
            setSearchResults([]);
        }
    }, [searchQuery, mode]);

    if (!isOpen) return null;

    const handleCreateNew = async () => {
        if (!name || !price) {
            toast.error("Name and Price are required");
            return;
        }
        setIsSubmitting(true);
        try {
            const res = await api.post('/products/create/', {
                name,
                price: Number(price),
                barcode,
                is_active: true,
                track_inventory: true // Track inventory so future stock additions work correctly
            });
            toast.success("Product created and added to cart!");
            onSuccess(res.data, barcode);
            onClose();
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to create product");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLinkExisting = async () => {
        if (!selectedProduct) {
            toast.error("Please select a product to link");
            return;
        }
        setIsSubmitting(true);
        try {
            // Updated to use the new batch-linking logic
            const res = await api.patch(`/products/${selectedProduct.id}/update/`, {
                link_barcode: barcode,
                price: price ? Number(price) : selectedProduct.price
            });
            toast.success("Barcode linked to product as a new batch!");
            onSuccess(res.data, barcode);
            onClose();
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to link barcode");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Unknown Barcode</h2>
                        <p className="text-sm text-primary font-mono font-bold mt-1">[{barcode}]</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors text-gray-400">
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-100">
                    <button 
                        onClick={() => setMode('new')}
                        className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all
                            ${mode === 'new' ? 'text-primary border-b-2 border-b-primary bg-primary/5' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        <PlusCircle size={18} /> New Product
                    </button>
                    <button 
                        onClick={() => setMode('link')}
                        className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all
                            ${mode === 'link' ? 'text-primary border-b-2 border-b-primary bg-primary/5' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        <LinkIcon size={18} /> Link Existing
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    {mode === 'new' ? (
                        <>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Product Name</label>
                                <input 
                                    autoFocus
                                    type="text" 
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Coca Cola 500ml"
                                    className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Selling Price (₹)</label>
                                <input 
                                    type="number" 
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all font-bold text-lg text-primary"
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Search Product to Link</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input 
                                        autoFocus
                                        type="text" 
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Type product name..."
                                        className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 pl-10 pr-4 outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                    />
                                </div>
                                
                                {isSearching ? (
                                    <div className="flex justify-center p-4"><Loader2 className="animate-spin text-primary" /></div>
                                ) : searchResults.length > 0 && (
                                    <ul className="mt-2 border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                                        {searchResults.map(p => (
                                            <li 
                                                key={p.id}
                                                onClick={() => {
                                                    setSelectedProduct(p);
                                                    setSearchQuery(p.name);
                                                    setSearchResults([]);
                                                }}
                                                className={`p-3 cursor-pointer transition-colors border-b last:border-b-0 flex justify-between items-center
                                                    ${selectedProduct?.id === p.id ? 'bg-primary/10 border-primary/20' : 'bg-white hover:bg-gray-50'}`}
                                            >
                                                <span className="text-sm font-medium">{p.name}</span>
                                                <span className="text-xs font-bold text-gray-400">₹{p.price}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            
                            {selectedProduct && (
                                <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Update Price (Optional)</label>
                                    <input 
                                        type="number" 
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        placeholder={`Current: ₹${selectedProduct.price}`}
                                        className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all font-bold text-lg text-primary"
                                    />
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 bg-gray-50/50 border-t border-gray-100">
                    <button
                        onClick={mode === 'new' ? handleCreateNew : handleLinkExisting}
                        disabled={isSubmitting}
                        className="w-full bg-primary hover:bg-primary/90 text-white py-4 rounded-xl font-bold flex justify-center items-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-70"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                        {mode === 'new' ? 'Create & Add to Cart' : 'Link & Add to Cart'}
                    </button>
                </div>
            </div>
        </div>
    );
};
