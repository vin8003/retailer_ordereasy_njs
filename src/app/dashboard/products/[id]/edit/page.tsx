"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductForm } from "@/components/products/ProductForm";
import { productService } from "@/services/api";

export default function EditProductPage() {
    const router = useRouter();
    const params = useParams();
    const [product, setProduct] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProduct = async () => {
            setIsLoading(true);
            try {
                const id = Number(params?.id);
                if (!id) throw new Error("Invalid Product ID");
                const response = await productService.fetchProductDetails(id);
                setProduct(response.data);
            } catch (err: any) {
                console.error("Failed to load product", err);
                setError("Failed to load product details");
            } finally {
                setIsLoading(false);
            }
        };

        if (params?.id) {
            fetchProduct();
        }
    }, [params]);

    if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading product...</div>;
    if (error || !product) return <div className="p-8 text-center text-red-500">{error || "Product not found"}</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Edit Product</h2>
                    <p className="text-muted-foreground">
                        Update product details for {product.name}.
                    </p>
                </div>
            </div>

            <div className="border rounded-lg p-6 bg-card">
                <ProductForm initialData={product} isEditing={true} />
            </div>
        </div>
    );
}
