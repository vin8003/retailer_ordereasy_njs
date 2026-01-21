"use client";

import { ProductForm } from "@/components/products/ProductForm";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function AddProductPage() {
    const router = useRouter();

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Add Product</h2>
                    <p className="text-muted-foreground">
                        Create a new product to add to your catalog.
                    </p>
                </div>
            </div>

            <div className="border rounded-lg p-6 bg-card">
                <ProductForm />
            </div>
        </div>
    );
}
