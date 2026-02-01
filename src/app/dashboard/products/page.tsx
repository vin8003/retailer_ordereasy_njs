"use client";

import { useEffect, useState } from "react";
import { Plus, Search, MoreHorizontal, FileEdit, Trash2, Box, ChevronLeft, ChevronRight, Filter, X } from "lucide-react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ProductTable } from "@/components/products/ProductTable";
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
    const [searchQuery, setSearchQuery] = useState("");

    // Pagination & Filters
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [categories, setCategories] = useState<any[]>([]);

    // Filter States
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [inStockOnly, setInStockOnly] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        fetchCategories();
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

    const fetchProducts = async (page = 1) => {
        setIsLoading(true);
        try {
            const params: any = {
                is_active: true,
                page: page
            };

            if (searchQuery) params.search = searchQuery;
            if (selectedCategory && selectedCategory !== "all") params.category = selectedCategory;
            if (inStockOnly) params.in_stock = "true";

            const response = await productService.fetchProducts(params);

            // Handle standard DRF pagination response { count: 100, next: "...", previous: "...", results: [...] }
            if (response.data && response.data.results) {
                setProducts(response.data.results);
                setTotalCount(response.data.count);
                // Calculate total pages (assuming default page size 20 from backend view)
                setTotalPages(Math.ceil(response.data.count / 20) || 1);
            } else if (Array.isArray(response.data)) {
                // Fallback for non-paginated response
                setProducts(response.data); ``
                setTotalCount(response.data.length);
                setTotalPages(1);
            } else {
                setProducts([]);
            }
            setCurrentPage(page);
        } catch (error: any) {
            console.error("Failed to fetch products:", error);
            if (error.response?.status === 404 && page > 1) {
                // Page out of range, go back to 1
                fetchProducts(1);
            } else {
                toast.error("Failed to load products");
                setProducts([]);
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchProducts(1); // Reset to page 1 on search/filter change
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, selectedCategory, inStockOnly]);

    // Handle manual page change
    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            fetchProducts(newPage);
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
                    <Link href="/dashboard/products/bulk">
                        <Button variant="outline">
                            <Box className="mr-2 h-4 w-4" />
                            Bulk Add
                        </Button>
                    </Link>
                    <Link href="/dashboard/products/add">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Product
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="flex flex-col gap-4">
                {/* Search and Filters Bar */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search products..."
                            className="pl-8"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button
                        variant={showFilters ? "secondary" : "outline"}
                        onClick={() => setShowFilters(!showFilters)}
                        className="md:w-auto w-full"
                    >
                        <Filter className="mr-2 h-4 w-4" />
                        Filters
                    </Button>
                </div>

                {/* Expanded Filters */}
                {showFilters && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-slate-50 dark:bg-slate-900/50">
                        <div className="space-y-2">
                            <Label>Category</Label>
                            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Categories" />
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
                        </div>
                        <div className="flex items-center space-x-2 pt-8">
                            <Switch
                                id="stock-mode"
                                checked={inStockOnly}
                                onCheckedChange={setInStockOnly}
                            />
                            <Label htmlFor="stock-mode">In Stock Only</Label>
                        </div>
                        <div className="pt-8 text-right">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setSelectedCategory("all");
                                    setInStockOnly(false);
                                    setSearchQuery("");
                                }}
                            >
                                <X className="mr-2 h-4 w-4" />
                                Clear Filters
                            </Button>
                        </div>
                    </div>
                )}

                <ProductTable
                    products={products}
                    isLoading={isLoading}
                    onDelete={handleDelete}
                    onToggleFeatured={async (product) => {
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
                            fetchProducts(currentPage);
                        }
                    }}
                />

                {/* Pagination Controls */}
                <div className="flex items-center justify-between border-t pt-4">
                    <div className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage <= 1 || isLoading}
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage >= totalPages || isLoading}
                        >
                            Next
                            <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
