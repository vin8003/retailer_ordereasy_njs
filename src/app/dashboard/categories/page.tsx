"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Upload, X, Loader2, ImageIcon, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { productService } from "@/services/api";

export default function CategoriesPage() {
    const [categories, setCategories] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [uploadingId, setUploadingId] = useState<number | null>(null);
    const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setIsLoading(true);
        try {
            const res = await productService.fetchCategories();
            setCategories(res.data);
        } catch (error) {
            console.error("Failed to fetch categories", error);
            toast.error("Failed to load categories");
        } finally {
            setIsLoading(false);
        }
    };

    const handleImageChange = async (catId: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Check file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
            toast.error("File size cannot exceed 5MB");
            return;
        }

        setUploadingId(catId);
        const formData = new FormData();
        formData.append("image", file);

        try {
            await productService.updateCategory(catId, formData);
            toast.success("Category image updated successfully");
            fetchCategories(); // Refresh data
        } catch (error) {
            console.error("Failed to update category image", error);
            toast.error("Failed to update image");
        } finally {
            setUploadingId(catId);
            setUploadingId(null);
        }
    };

    const triggerFileInput = (catId: number) => {
        fileInputRefs.current[catId]?.click();
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Category Images</h1>
                <p className="text-muted-foreground">
                    Set primary images for your top-level categories to show on the Customer App home page.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {categories.map((cat) => (
                    <Card key={cat.id} className="overflow-hidden">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg flex items-center justify-between">
                                {cat.name}
                                {cat.icon && <HelpCircle className="h-4 w-4 text-muted-foreground" title={`Icon: ${cat.icon}`} />}
                            </CardTitle>
                            {cat.description && <CardDescription>{cat.description}</CardDescription>}
                        </CardHeader>
                        <CardContent>
                            <div className="aspect-video relative rounded-md border-2 border-dashed flex flex-col items-center justify-center bg-muted/10 overflow-hidden">
                                {cat.image ? (
                                    <div className="relative w-full h-full">
                                        <img 
                                            src={cat.image} 
                                            alt={cat.name} 
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                            <Button 
                                                variant="secondary" 
                                                size="sm"
                                                onClick={() => triggerFileInput(cat.id)}
                                                disabled={uploadingId === cat.id}
                                            >
                                                {uploadingId === cat.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
                                                Change
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center p-4">
                                        <ImageIcon className="mx-auto h-10 w-10 text-muted-foreground" />
                                        <p className="mt-2 text-xs text-muted-foreground">No image set</p>
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            className="mt-4"
                                            onClick={() => triggerFileInput(cat.id)}
                                            disabled={uploadingId === cat.id}
                                        >
                                            {uploadingId === cat.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
                                            Upload Image
                                        </Button>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    ref={(el) => { fileInputRefs.current[cat.id] = el; }}
                                    onChange={(e) => handleImageChange(cat.id, e)}
                                />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {categories.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">No top-level categories found.</p>
                </div>
            )}
        </div>
    );
}
