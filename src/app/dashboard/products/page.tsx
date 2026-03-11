"use client";

import { useEffect, useState, useRef } from "react";
import { Plus, Search, MoreHorizontal, FileEdit, Trash2, Box, ChevronLeft, ChevronRight, Filter, X } from "lucide-react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { VirtualProductList } from "@/components/products/VirtualProductList";
import { BulkActionBar } from "@/components/products/BulkActionBar";
import { BulkEditMatrix } from "@/components/products/BulkEditMatrix";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { productService } from "@/services/api";

export default function ProductsPage() {
    const router = useRouter();
    const [products, setProducts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // Pagination & Filters
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [categories, setCategories] = useState<any[]>([]);

    // Filter States
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [stockFilter, setStockFilter] = useState("all"); // 'all', 'in', 'out', 'low'
    const [statusFilter, setStatusFilter] = useState("active");
    const [showFilters, setShowFilters] = useState(false);

    const isRestoringState = useRef(false);
    const [highlightedProductId, setHighlightedProductId] = useState<number | null>(null);

    // Bulk Operations
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedProductIds, setSelectedProductIds] = useState<Set<number>>(new Set());
    const [isBulkMatrixOpen, setIsBulkMatrixOpen] = useState(false);

    useEffect(() => {
        fetchCategories();

        const savedStateStr = sessionStorage.getItem('productsPageState');
        if (savedStateStr) {
            isRestoringState.current = true;
            try {
                const savedState = JSON.parse(savedStateStr);

                let updatedProducts = savedState.products;
                const editedProductStr = sessionStorage.getItem('editedProduct');
                let editedId: number | null = null;
                if (editedProductStr) {
                    const editedProduct = JSON.parse(editedProductStr);
                    editedId = editedProduct.id;
                    updatedProducts = updatedProducts.map((p: any) => p.id === editedId ? editedProduct : p);
                    sessionStorage.removeItem('editedProduct');
                }

                setProducts(updatedProducts);
                setCurrentPage(savedState.currentPage);
                setSearchQuery(savedState.searchQuery);
                setSelectedCategory(savedState.selectedCategory);
                setStockFilter(savedState.stockFilter);
                setStatusFilter(savedState.statusFilter);
                setTotalPages(savedState.totalPages);
                setTotalCount(savedState.totalCount);
                setShowFilters(savedState.showFilters);
                setIsLoading(false);

                if (editedId) {
                    setHighlightedProductId(editedId);
                    setTimeout(() => setHighlightedProductId(null), 3000);
                }

                setTimeout(() => {
                    window.scrollTo({ top: savedState.scrollPosition, behavior: 'instant' });
                    // Provide a slight delay before enabling normal fetches
                    setTimeout(() => { isRestoringState.current = false; }, 200);
                }, 50);

                sessionStorage.removeItem('productsPageState');
            } catch (e) {
                console.error("Failed to restore state", e);
                isRestoringState.current = false;
            }
        }
    }, []);

    // Helper to flatten nested categories
    const flattenCategories = (categories: any[], parentName = ''): any[] => {
        let flat: any[] = [];
        categories.forEach(cat => {
            const fullName = parentName ? `${parentName} > ${cat.name}` : cat.name;
            flat.push({ ...cat, name: fullName });
            if (cat.children && cat.children.length > 0) {
                flat = flat.concat(flattenCategories(cat.children, fullName));
            }
        });
        return flat;
    };

    const fetchCategories = async () => {
        try {
            const response = await productService.fetchCategories(); // Gets categories with products
            const rawData = Array.isArray(response.data) ? response.data : [];
            setCategories(flattenCategories(rawData));
        } catch (error) {
            console.error("Failed to fetch categories", error);
        }
    };

    const fetchProducts = async (page = 1, append = false) => {
        if (page === 1) setIsLoading(true);
        else setIsFetchingMore(true);

        try {
            const params: any = {
                page: page
            };

            if (statusFilter === 'active') params.is_active = true;
            if (statusFilter === 'inactive') params.is_active = false;

            if (searchQuery) params.search = searchQuery;
            if (selectedCategory && selectedCategory !== "all") params.category = selectedCategory;
            if (stockFilter === "in") params.in_stock = "true";
            if (stockFilter === "out") params.in_stock = "false";
            if (stockFilter === "low") params.low_stock = "true";

            const response = await productService.fetchProducts(params);

            // Handle standard DRF pagination response { count: 100, next: "...", previous: "...", results: [...] }
            if (response.data && response.data.results) {
                setProducts(prev => append ? [...prev, ...response.data.results] : response.data.results);
                setTotalCount(response.data.count);
                // Calculate total pages (assuming default page size 20 from backend view)
                setTotalPages(Math.ceil(response.data.count / 20) || 1);
            } else if (Array.isArray(response.data)) {
                // Fallback for non-paginated response
                setProducts(prev => append ? [...prev, ...response.data] : response.data);
                setTotalCount(response.data.length);
                setTotalPages(1);
            } else {
                if (!append) setProducts([]);
            }
            setCurrentPage(page);
        } catch (error: any) {
            console.error("Failed to fetch products:", error);
            if (error.response?.status === 404 && page > 1) {
                // Page out of range, go back to 1
                fetchProducts(1);
            } else {
                toast.error("Failed to load products");
                if (!append) setProducts([]);
            }
        } finally {
            setIsLoading(false);
            setIsFetchingMore(false);
        }
    };


    useEffect(() => {
        if (isRestoringState.current) return;
        const timer = setTimeout(() => {
            fetchProducts(1); // Reset to page 1 on search/filter change
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, selectedCategory, stockFilter, statusFilter]);

    // Handle load more
    const handleLoadMore = () => {
        if (currentPage < totalPages && !isFetchingMore && !isLoading) {
            fetchProducts(currentPage + 1, true);
        }
    };

    const handleDelete = async (product: any) => {
        if (!confirm(`Are you sure you want to delete ${product.name}?`)) return;

        try {
            await productService.deleteProduct(product.id);
            toast.success("Product deleted successfully");
            fetchProducts(currentPage);
        } catch (error) {
            console.error("Failed to delete product", error);
            toast.error("Failed to delete product");
        }
    };

    const handleEdit = (product: any) => {
        const stateToSave = {
            products,
            currentPage,
            searchQuery,
            selectedCategory,
            stockFilter,
            statusFilter,
            totalPages,
            totalCount,
            showFilters,
            scrollPosition: window.scrollY
        };
        sessionStorage.setItem('productsPageState', JSON.stringify(stateToSave));
        router.push(`/dashboard/products/edit?id=${product.id}`);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Products</h2>
                    <p className="text-muted-foreground">
                        Manage your product catalog ({totalCount} items).
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Link href="/dashboard/products/add">
                        <Button variant="default" className="w-full sm:w-auto">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Product
                        </Button>
                    </Link>
                    <Link href="/dashboard/products/bulk">
                        <Button variant="outline" className="w-full sm:w-auto">
                            <Box className="mr-2 h-4 w-4" />
                            Bulk Upload
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Insight Cards (Hub & Spoke Dashboard) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div
                    onClick={() => setStockFilter("all")}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${stockFilter === "all" ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-muted"}`}
                >
                    <div className="text-sm font-medium mb-1 opacity-80">All Products</div>
                    <div className="text-2xl font-bold">{totalCount}</div>
                </div>
                <div
                    onClick={() => setStockFilter("low")}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${stockFilter === "low" ? "bg-amber-500 text-white border-amber-500" : "bg-card hover:bg-muted"}`}
                >
                    <div className="text-sm font-medium mb-1 opacity-80 text-amber-500">Low Stock</div>
                    <div className="text-2xl font-bold">Filters</div>
                </div>
                <div
                    onClick={() => setStockFilter("out")}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${stockFilter === "out" ? "bg-destructive text-destructive-foreground border-destructive" : "bg-card hover:bg-muted"}`}
                >
                    <div className="text-sm font-medium mb-1 opacity-80 text-destructive">Out of Stock</div>
                    <div className="text-2xl font-bold">Filters</div>
                </div>
            </div>

            <div className="flex flex-col gap-4">
                {/* Omnibar & Filter Pills */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search products by name, barcode, or category..."
                        className="pl-10 py-6 text-lg rounded-xl shadow-sm border-2 bg-background md:w-2/3"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                    <Button
                        variant={stockFilter === "all" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setStockFilter("all")}
                        className="rounded-full"
                    >
                        All
                    </Button>
                    <Button
                        variant={stockFilter === "in" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setStockFilter("in")}
                        className="rounded-full"
                    >
                        In Stock
                    </Button>
                    <Button
                        variant={stockFilter === "out" ? "destructive" : "outline"}
                        size="sm"
                        onClick={() => setStockFilter("out")}
                        className="rounded-full"
                    >
                        Out of Stock
                    </Button>
                    <Button
                        variant={stockFilter === "low" ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => setStockFilter("low")}
                        className="rounded-full bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200"
                    >
                        Low Stock (&lt;=10)
                    </Button>

                    <div className="h-4 w-px bg-border mx-2 hidden sm:block"></div>

                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="w-auto h-8 rounded-full border-dashed text-xs">
                            <Filter className="w-3 h-3 mr-2" />
                            <SelectValue placeholder="Category" />
                            {selectedCategory !== "all" && (
                                <div
                                    className="ml-2 bg-muted rounded-full p-0.5 hover:bg-muted-foreground/20"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setSelectedCategory("all");
                                    }}
                                >
                                    <X className="w-3 h-3" />
                                </div>
                            )}
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {categories.map((cat: any) => (
                                <SelectItem key={cat.id} value={String(cat.id)}>
                                    {cat.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-auto h-8 rounded-full border-dashed text-xs">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="all">All Status</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <VirtualProductList
                    products={products}
                    isLoading={isLoading && !isFetchingMore}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                    highlightedProductId={highlightedProductId}
                    loadMore={handleLoadMore}
                    hasMore={currentPage < totalPages}
                    selectionMode={selectionMode}
                    selectedIds={selectedProductIds}
                    onToggleSelectionMode={() => setSelectionMode(prev => !prev)}
                    onToggleSelect={(id) => {
                        setSelectedProductIds(prev => {
                            const newSet = new Set(prev);
                            if (newSet.has(id)) newSet.delete(id);
                            else newSet.add(id);
                            return newSet;
                        });
                    }}
                    onToggleFeatured={async (product: any) => {
                        try {
                            const updatedProducts: any = products.map((p: any) =>
                                p.id === product.id ? { ...p, is_featured: !p.is_featured } : p
                            );
                            setProducts(updatedProducts);

                            const formData = new FormData();
                            formData.append('is_featured', String(!product.is_featured));

                            await productService.updateProduct(product.id, formData);
                            toast.success(`Product ${!product.is_featured ? 'featured' : 'unfeatured'} successfully`);
                        } catch (error) {
                            console.error("Failed to update product", error);
                            toast.error("Failed to update status");
                            fetchProducts(1);
                        }
                    }}
                    onUpdateStock={async (product: any, newStock: number) => {
                        try {
                            setProducts(products.map(p => p.id === product.id ? { ...p, quantity: newStock } : p));
                            const formData = new FormData();
                            formData.append('quantity', String(newStock));
                            await productService.updateProduct(product.id, formData);
                            toast.success(`Stock updated to ${newStock} for ${product.name}`);
                        } catch (e) {
                            toast.error("Failed to update stock");
                            setProducts([...products]);
                            throw e;
                        }
                    }}
                    onUpdatePrice={async (product: any, newPrice: number) => {
                        try {
                            setProducts(products.map(p => p.id === product.id ? { ...p, price: newPrice } : p));
                            const formData = new FormData();
                            formData.append('price', String(newPrice));
                            await productService.updateProduct(product.id, formData);
                            toast.success(`Price updated to ${newPrice} for ${product.name}`);
                        } catch (e) {
                            toast.error("Failed to update price");
                            setProducts([...products]);
                            throw e;
                        }
                    }}
                />

                {/* Bulk Actions UI */}
                <BulkActionBar
                    selectedCount={selectedProductIds.size}
                    onCancel={() => {
                        setSelectionMode(false);
                        setSelectedProductIds(new Set());
                    }}
                    onEditSelected={() => setIsBulkMatrixOpen(true)}
                />

                <BulkEditMatrix
                    open={isBulkMatrixOpen}
                    products={products.filter(p => selectedProductIds.has(p.id))}
                    onClose={() => setIsBulkMatrixOpen(false)}
                    onSave={async (changes) => {
                        try {
                            // Optimistically update local state
                            setProducts(prevProducts => prevProducts.map(p => {
                                const modification = changes.find((c: any) => c.id === p.id);
                                if (modification) {
                                    return {
                                        ...p,
                                        ...(modification.price !== undefined ? { price: modification.price } : {}),
                                        ...(modification.quantity !== undefined ? { quantity: modification.quantity } : {})
                                    };
                                }
                                return p;
                            }));

                            await productService.bulkUpdateProducts(changes);
                            toast.success(`Successfully updated ${changes.length} products.`);

                            // Reset selections and close
                            setSelectionMode(false);
                            setSelectedProductIds(new Set());
                        } catch (e) {
                            toast.error("Bulk update failed.");
                            fetchProducts(currentPage); // Revert optimistic changes
                            throw e;
                        }
                    }}
                />
            </div>
        </div>
    );
}

