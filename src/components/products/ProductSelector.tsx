"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Loader2, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { productService } from "@/services/api";
import { Badge } from "@/components/ui/badge";

interface Product {
    id: number;
    name: string;
    price: number;
    unit: string;
    image_display_url?: string;
}

interface ProductSelectorProps {
    onSelect: (product: Product) => void;
    excludeIds?: number[];
}

export function ProductSelector({ onSelect, excludeIds = [] }: ProductSelectorProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (open) {
            handleSearch();
        }
    }, [open]);

    const handleSearch = async () => {
        setIsLoading(true);
        try {
            const response = await productService.fetchProducts({ search });
            setProducts(response.data.results || response.data);
        } catch (error) {
            console.error("Failed to fetch products", error);
        } finally {
            setIsLoading(false);
        }
    };

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
                            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        />
                    </div>
                    <Button onClick={handleSearch} disabled={isLoading}>
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
                    </Button>
                </div>
                <div className="flex-1 overflow-y-auto px-6 pb-6">
                    <div className="space-y-2">
                        {products.filter(p => !excludeIds.includes(p.id)).map((product) => (
                            <div
                                key={product.id}
                                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    {product.image_display_url ? (
                                        <img
                                            src={product.image_display_url}
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
                        {products.length === 0 && !isLoading && (
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
