'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Search, Check, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
// import { useDebounce } from '@/hooks/use-debounce'; 

// We'll implement inline debounce for simplicity since we don't know if hooks exist
function useDebounceValue<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

interface Product {
    id: number;
    name: string;
    price?: string;
}

interface ProductMultiSelectProps {
    selectedIds: string[];
    onSelectionChange: (ids: string[]) => void;
    apiBase: string;
    token: string;
    initialProducts?: { id: number; name: string }[];
}

export function ProductMultiSelect({ selectedIds, onSelectionChange, apiBase, token, initialProducts = [] }: ProductMultiSelectProps) {
    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounceValue(searchTerm, 300);

    const [results, setResults] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);

    // Cache for selected product names so we can display them even if not in search results
    const [selectedProductsInfo, setSelectedProductsInfo] = useState<Map<string, string>>(new Map());

    // Initialize cache from initialProducts
    useEffect(() => {
        if (initialProducts.length > 0) {
            const newMap = new Map(selectedProductsInfo);
            let hasChanges = false;
            initialProducts.forEach(p => {
                const sid = String(p.id);
                if (!newMap.has(sid)) {
                    newMap.set(sid, p.name);
                    hasChanges = true;
                }
            });
            if (hasChanges) {
                setSelectedProductsInfo(newMap);
            }
        }
    }, [initialProducts]);

    const wrapperRef = useRef<HTMLDivElement>(null);

    // Handle click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Fetch products based on search
    useEffect(() => {
        const searchProducts = async () => {
            setLoading(true);
            try {
                const query = debouncedSearch ? `?search=${encodeURIComponent(debouncedSearch)}` : '';
                const res = await fetch(`${apiBase}/products/${query}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    const products: Product[] = data.results || data;
                    setResults(products);

                    // Update cache
                    setSelectedProductsInfo(prev => {
                        const newMap = new Map(prev);
                        products.forEach(p => newMap.set(String(p.id), p.name));
                        return newMap;
                    });
                }
            } catch (error) {
                console.error("Search failed", error);
            } finally {
                setLoading(false);
            }
        };

        if (open) {
            searchProducts();
        }
    }, [debouncedSearch, open, apiBase, token]);

    // Cleanup or specialized fetch logic - removed empty useEffect

    const handleSelect = (id: string, name: string) => {
        const newMap = new Map(selectedProductsInfo);
        newMap.set(id, name);
        setSelectedProductsInfo(newMap);

        if (selectedIds.includes(id)) {
            onSelectionChange(selectedIds.filter(i => i !== id));
        } else {
            onSelectionChange([...selectedIds, id]);
        }
    };

    const removeId = (id: string) => {
        onSelectionChange(selectedIds.filter(i => i !== id));
    };

    return (
        <div className="space-y-2" ref={wrapperRef}>

            {/* Selected Tags */}
            {selectedIds.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2 p-2 border rounded-md bg-slate-50 min-h-[40px]">
                    {selectedIds.map(id => (
                        <Badge key={id} variant="secondary" className="pl-2 pr-1 py-1 flex items-center gap-1">
                            {selectedProductsInfo.get(id) || `Product #${id}`}
                            <button
                                type="button"
                                onClick={() => removeId(id)}
                                className="ml-1 hover:bg-slate-200 rounded-full p-0.5"
                            >
                                <X size={12} />
                            </button>
                        </Badge>
                    ))}
                </div>
            )}

            {/* Search Input */}
            <div className="relative border rounded-md p-0 shadow-sm">
                <div className="flex items-center px-3 py-2 bg-transparent">
                    <Search className="mr-2 h-4 w-4 opacity-50" />
                    <input
                        className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onFocus={() => setOpen(true)}
                    />
                    {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                </div>

                {open && (
                    <div className="absolute top-full left-0 w-full z-50 max-h-[200px] overflow-y-auto p-1 bg-white border rounded-b-md shadow-lg">
                        {results.length === 0 && !loading && (
                            <div className="py-6 text-center text-sm text-muted-foreground">No products found.</div>
                        )}
                        {results.map(product => {
                            const isSelected = selectedIds.includes(String(product.id));
                            return (
                                <div
                                    key={product.id}
                                    className={cn(
                                        "flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer select-none",
                                        isSelected ? "bg-accent text-accent-foreground" : "hover:bg-accent"
                                    )}
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        handleSelect(String(product.id), product.name);
                                    }}
                                >
                                    <div className={cn("flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                        isSelected ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible"
                                    )}>
                                        <Check className={cn("h-3 w-3")} />
                                    </div>
                                    <span>{product.name}</span>
                                    {product.price && <span className="ml-auto text-xs text-muted-foreground">₹{product.price}</span>}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
