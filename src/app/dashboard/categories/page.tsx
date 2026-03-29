"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Upload, X, Loader2, ImageIcon, HelpCircle, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { productService } from "@/services/api";

export default function CategoriesPage() {
    const [categories, setCategories] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [uploadingId, setUploadingId] = useState<number | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
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

    const handleCreateCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategoryName.trim()) return;

        setIsCreating(true);
        try {
            await productService.createCategory({ name: newCategoryName.trim(), is_active: true });
            toast.success("Category created successfully");
            setNewCategoryName("");
            fetchCategories();
        } catch (error: any) {
            console.error("Failed to create category", error);
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteCategory = async (catId: number, catName: string) => {
        if (!window.confirm(`Are you sure you want to delete the category "${catName}"?`)) return;

        setDeletingId(catId);
        try {
            await productService.deleteCategory(catId);
            toast.success("Category deleted successfully");
            fetchCategories();
        } catch (error: any) {
            console.error("Failed to delete category", error);
        } finally {
            setDeletingId(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Category Images</h1>
                    <p className="text-muted-foreground mt-2 text-lg">
                        Manage your store's categories and set primary images to show on the Customer App home page.
                    </p>
                </div>
                <form onSubmit={handleCreateCategory} className="flex items-center gap-2 w-full md:w-auto">
                    <Input 
                        placeholder="New category name" 
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        className="w-full md:w-64"
                        disabled={isCreating}
                    />
                    <Button type="submit" disabled={isCreating || !newCategoryName.trim()}>
                        {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                        Create
                    </Button>
                </form>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {categories.map((cat) => (
                    <Card key={cat.id} className="overflow-hidden border-none shadow-xl shadow-primary/5 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 group">
                        <CardHeader className="pb-4 border-b border-border/30 bg-muted/20">
                            <CardTitle className="text-xl font-bold flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="group-hover:text-primary transition-colors">{cat.name}</span>
                                    {cat.icon && (
                                        <span title={`Icon: ${cat.icon}`} className="p-1.5 rounded-lg bg-white/50 border border-border/50">
                                            <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                        </span>
                                    )}
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => handleDeleteCategory(cat.id, cat.name)}
                                    disabled={deletingId === cat.id}
                                    title="Delete category"
                                >
                                    {deletingId === cat.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                </Button>
                            </CardTitle>
                            {cat.description && <CardDescription className="line-clamp-1">{cat.description}</CardDescription>}
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="aspect-[4/3] relative rounded-2xl border-2 border-dashed border-border/50 flex flex-col items-center justify-center bg-muted/10 overflow-hidden group-hover:border-primary/30 transition-colors">
                                {cat.image ? (
                                    <div className="relative w-full h-full">
                                        <img 
                                            src={cat.image} 
                                            alt={cat.name} 
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                                            <p className="text-white text-xs font-bold uppercase tracking-widest translate-y-2 group-hover:translate-y-0 transition-transform">Edit Image</p>
                                            <Button 
                                                variant="default" 
                                                size="sm"
                                                onClick={() => triggerFileInput(cat.id)}
                                                disabled={uploadingId === cat.id}
                                                className="shadow-xl shadow-primary/40 rounded-full px-6"
                                            >
                                                {uploadingId === cat.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                                                Change
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center p-6 space-y-4">
                                        <div className="size-16 mx-auto rounded-3xl bg-primary/10 flex items-center justify-center shadow-inner">
                                            <ImageIcon className="h-8 w-8 text-primary/40" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-foreground">No image set</p>
                                            <p className="text-[10px] text-muted-foreground mt-1">Recommended: 800x600px</p>
                                        </div>
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            className="rounded-full px-6 border-primary/20 hover:border-primary/50 text-primary"
                                            onClick={() => triggerFileInput(cat.id)}
                                            disabled={uploadingId === cat.id}
                                        >
                                            {uploadingId === cat.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
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
                <div className="text-center py-20 bg-muted/5 rounded-3xl border border-dashed border-border/50">
                    <ImageIcon className="size-12 mx-auto mb-4 opacity-10" />
                    <p className="text-muted-foreground font-medium">No top-level categories found.</p>
                </div>
            )}
        </div>
    );
}
