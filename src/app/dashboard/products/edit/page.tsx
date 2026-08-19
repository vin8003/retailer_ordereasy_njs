"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductForm } from "@/components/products/ProductForm";
import { productService } from "@/services/api";

function EditProductContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [product, setProduct] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const id = Number(searchParams.get('id'));
        if (!id) return;
        let cancelled = false;

        const fetchProduct = async () => {
            setIsLoading(true);
            setError(null);
            const attempts = 3;
            let lastErr: any = null;
            for (let i = 0; i < attempts; i++) {
                try {
                    const response = await productService.fetchProductDetails(id);
                    if (cancelled) return;
                    setProduct(response.data);
                    setIsLoading(false);
                    return;
                } catch (err: any) {
                    lastErr = err;
                    if (i < attempts - 1) {
                        await new Promise((r) => setTimeout(r, 400 * (i + 1)));
                    }
                }
            }
            if (cancelled) return;
            console.error("Failed to load product", lastErr);
            setError("Failed to load product details");
            setIsLoading(false);
        };

        fetchProduct();
        return () => { cancelled = true; };
    }, [searchParams]);

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

export default function EditProductPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading...</div>}>
            <EditProductContent />
        </Suspense>
    );
}
