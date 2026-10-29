"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Loader2, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { findCatalogProducts } from "@/services/posCatalog";
import { Badge } from "@/components/ui/badge";

interface Product {
    id: number;
    name: string;
    price: number;
    unit: string;
    barcode?: string;
    image_display_url?: string;
    image?: string;
}

interface ProductSelectorProps {
    onSelect: (product: Product) => void;
    excludeIds?: number[];
}

export function ProductSelector({ onSelect, excludeIds = [] }: ProductSelectorProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // The server searches; the dialog never holds the whole catalog. A late answer for an earlier
    // keystroke is dropped.
    useEffect(() => {
        if (!open) return;
        let stale = false;
        const timer = setTimeout(async () => {
            setIsLoading(true);
            try {
                const rows = await findCatalogProducts<Product>(search);
                if (!stale) setAllProducts(rows);
            } catch (error) {
                console.error("Failed to fetch products", error);
            } finally {
                if (!stale) setIsLoading(false);
            }
        }, search.trim() ? 250 : 0);

        return () => {
            stale = true;
            clearTimeout(timer);
        };
    }, [open, search]);

    const filteredProducts = allProducts;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-width-[600px] h-[80vh] flex flex-col p-0">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle>Select Product</DialogTitle>
                </DialogHeader>
                <div className="px-6 pb-4 flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search products..."
                            className="pl-9"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    {isLoading && <Loader2 className="h-4 w-4 animate-spin self-center text-muted-foreground" />}
                </div>
                <div className="flex-1 overflow-y-auto px-6 pb-6">
                    <div className="space-y-2">
                        {filteredProducts.filter(p => !excludeIds.includes(p.id)).map((product) => (
                            <div
                                key={product.id}
                                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    {(product.image_display_url || product.image) ? (
                                        <img
                                            src={product.image_display_url || product.image}
                                            alt={product.name}
                                            className="w-10 h-10 rounded object-cover border"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center border">
                                            <Search className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                    )}
                                    <div>
                                        <p className="font-medium text-sm">{product.name}</p>
                                        <p className="text-xs text-muted-foreground">₹{product.price} / {product.unit}</p>
                                    </div>
                                </div>
                                <Button
                                    size="sm"
                                    onClick={() => {
                                        onSelect(product);
                                        setOpen(false);
                                    }}
                                >
                                    Select
                                </Button>
                            </div>
                        ))}
                        {filteredProducts.length === 0 && !isLoading && (
                            <div className="text-center py-8 text-muted-foreground">
                                No products found.
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
