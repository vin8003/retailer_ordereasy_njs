"use client";

import { useEffect, useState } from "react";
import { Plus, Search, MoreHorizontal, FileEdit, Trash2, Box } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ProductTable } from "@/components/products/ProductTable";
import { productService } from "@/services/api";

export default function ProductsPage() {
    const router = useRouter();
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    const fetchProducts = async () => {
        setIsLoading(true);
        try {
            const params: any = {};
            if (searchQuery) {
                params.search = searchQuery;
            }

            const response = await productService.fetchProducts(params);
            // Handle pagination response structure (results array) or direct list
            const data = Array.isArray(response.data) ? response.data : response.data.results || [];
            setProducts(data);
        } catch (error: any) {
            console.error("Failed to fetch products:", error);
            toast.error("Failed to load products");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchProducts();
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleDelete = async (product: any) => {
        if (!confirm(`Are you sure you want to delete ${product.name}?`)) return;

        try {
            await productService.deleteProduct(product.id);
            toast.success("Product deleted successfully");
            fetchProducts();
        } catch (error) {
            console.error("Failed to delete product", error);
            toast.error("Failed to delete product");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Products</h2>
                    <p className="text-muted-foreground">
                        Manage your product catalog.
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
                <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search products..."
                            className="pl-8"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <ProductTable
                    products={products}
                    isLoading={isLoading}
                    onDelete={handleDelete}
                    onToggleFeatured={async (product) => {
                        try {
                            // Optimistic update
                            const updatedProducts: any = products.map((p: any) =>
                                p.id === product.id ? { ...p, is_featured: !p.is_featured } : p
                            );
                            setProducts(updatedProducts);

                            const formData = new FormData();
                            // Convert boolean to string for FormData (Python handles 'true'/'false')
                            formData.append('is_featured', String(!product.is_featured));

                            await productService.updateProduct(product.id, formData);
                            toast.success(`Product ${!product.is_featured ? 'featured' : 'unfeatured'} successfully`);
                        } catch (error) {
                            console.error("Failed to update product", error);
                            toast.error("Failed to update status");
                            fetchProducts(); // Revert on failure
                        }
                    }}
                />
            </div>
        </div>
    );
}
