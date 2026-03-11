"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload, X, Loader2, Barcode, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectValue,
} from "@/components/ui/select";
import { Autocomplete } from "@/components/ui/Autocomplete";
import { productService } from "@/services/api";
import { BarcodeScanner } from "@/components/products/BarcodeScanner";

interface ProductFormProps {
    initialData?: any;
    isEditing?: boolean;
}

export function ProductForm({ initialData, isEditing = false }: ProductFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [name, setName] = useState(initialData?.name || "");
    const [description, setDescription] = useState(initialData?.description || "");
    const [price, setPrice] = useState(initialData?.price || "");
    const [originalPrice, setOriginalPrice] = useState(initialData?.original_price || "");
    const [quantity, setQuantity] = useState(initialData?.quantity || "");
    const [unit, setUnit] = useState(initialData?.unit || "piece");
    const [minOrderQty, setMinOrderQty] = useState(initialData?.minimum_order_quantity || "1");
    const [maxOrderQty, setMaxOrderQty] = useState(initialData?.maximum_order_quantity || "");
    const [productGroup, setProductGroup] = useState(initialData?.product_group || "");
    const [barcode, setBarcode] = useState(initialData?.barcode || "");
    const [masterProductId, setMasterProductId] = useState(initialData?.master_product || "");
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [isSearchingMaster, setIsSearchingMaster] = useState(false);

    // Handle category: could be ID (create) or Object (edit)
    const getInitialCategoryId = () => {
        if (!initialData?.category) return "";
        if (typeof initialData.category === 'object') return initialData.category.id.toString();
        return initialData.category.toString();
    };
    const [categoryId, setCategoryId] = useState<string>(getInitialCategoryId());

    const [isActive, setIsActive] = useState(initialData?.is_active ?? true);
    const [isSeasonal, setIsSeasonal] = useState(initialData?.is_seasonal ?? false);

    // Image State
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(initialData?.image || null);

    // Data State
    const [categories, setCategories] = useState<any[]>([]);
    const [allCategories, setAllCategories] = useState<any[]>([]);
    const [productGroups, setProductGroups] = useState<string[]>([]);
    const [categorySearch, setCategorySearch] = useState(initialData?.category?.name || (typeof initialData?.category === 'string' ? initialData.category : ""));

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [catsRes, allCatsRes, groupsRes] = await Promise.all([
                    productService.fetchCategories(),
                    productService.fetchAllCategories(),
                    productService.fetchProductGroups()
                ]);
                setCategories(catsRes.data);
                setAllCategories(allCatsRes.data);
                setProductGroups(groupsRes.data);

                // If editing, find the display name for the category
                if (isEditing && initialData?.category) {
                    const id = typeof initialData.category === 'object' ? initialData.category.id : initialData.category;
                    const found = allCatsRes.data.find((c: any) => c.id === id);
                    if (found) setCategorySearch(found.name);
                }
            } catch (error) {
                console.error("Failed to load form data", error);
            }
        };
        fetchInitialData();
    }, [isEditing, initialData]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleScanSuccess = async (decodedText: string) => {
        setIsScannerOpen(false);
        setBarcode(decodedText);

        setIsSearchingMaster(true);
        try {
            const res = await productService.searchMasterProduct(decodedText);
            if (res.data) {
                const master = res.data;
                toast.success(`Found in Global Catalog: ${master.name}`);

                // Auto-fill form
                setName(master.name);
                if (master.description) setDescription(master.description);
                if (master.mrp) setOriginalPrice(master.mrp);
                if (master.product_group) setProductGroup(master.product_group);
                if (master.image_url) setImagePreview(master.image_url);
                if (master.category_name) setCategorySearch(master.category_name);
                if (master.category) setCategoryId(master.category.toString());

                setMasterProductId(master.id.toString());
            }
        } catch (error: any) {
            if (error.response?.status === 404) {
                toast.info("Barcode not found in global catalog. You can still add it manually.");
            } else {
                toast.error("Failed to search barcode.");
            }
        } finally {
            setIsSearchingMaster(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name || !price || !quantity) {
            toast.error("Please fill in all required fields (Name, Price, Quantity)");
            return;
        }

        setIsLoading(true);

        try {
            const formData = new FormData();
            formData.append("name", name);
            if (description) formData.append("description", description);
            formData.append("price", price);
            if (originalPrice) formData.append("original_price", originalPrice);
            formData.append("quantity", quantity);
            formData.append("unit", unit);
            formData.append("minimum_order_quantity", minOrderQty);
            if (maxOrderQty) formData.append("maximum_order_quantity", maxOrderQty);
            if (productGroup) formData.append("product_group", productGroup);
            if (barcode) formData.append("barcode", barcode);
            if (masterProductId) formData.append("master_product", masterProductId);

            if (categoryId) formData.append("category", categoryId);
            formData.append("is_active", String(isActive));
            formData.append("is_seasonal", String(isSeasonal));
            // Explicitly set is_available to true so it shows up in Customer App
            formData.append("is_available", "true");

            if (imageFile) {
                formData.append("image", imageFile);
            }

            if (isEditing && initialData?.id) {
                const response = await productService.updateProduct(initialData.id, formData);
                if (response?.data) {
                    sessionStorage.setItem('editedProduct', JSON.stringify(response.data));
                }
                toast.success("Product updated successfully");
            } else {
                await productService.addProduct(formData);
                // Clear any saved list state so new product appears on page 1
                sessionStorage.removeItem('productsPageState');
                toast.success("Product created successfully");
            }
            router.push("/dashboard/products");
            router.refresh(); // Ensure list is updated
        } catch (error: any) {
            console.error("Failed to save product", error);
            let errorMsg = "Failed to save product";
            if (error.response?.data) {
                const data = error.response.data;
                if (data.error) {
                    errorMsg = data.error;
                } else {
                    // Collect all field errors
                    const messages: string[] = [];
                    Object.entries(data).forEach(([key, value]) => {
                        const val = value as any;
                        if (Array.isArray(val)) {
                            messages.push(`${key}: ${val.join(", ")}`);
                        } else {
                            messages.push(`${key}: ${String(val)}`);
                        }
                    });
                    if (messages.length > 0) {
                        errorMsg = messages.join("\n");
                    }
                }
            }
            toast.error(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl mx-auto">
            <div className="grid gap-6 md:grid-cols-2">

                {/* Image Upload Section */}
                <div className="md:col-span-2 flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg bg-muted/10">
                    {imagePreview ? (
                        <div className="relative w-48 h-48 rounded-md overflow-hidden border">
                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                            <button
                                type="button"
                                onClick={handleRemoveImage}
                                className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full shadow-sm hover:bg-red-600 focus:outline-none"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    ) : (
                        <div className="text-center">
                            <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                            <div className="mt-4 flex text-sm leading-6 text-muted-foreground">
                                <label
                                    htmlFor="file-upload"
                                    className="relative cursor-pointer rounded-md bg-background font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 hover:text-primary/80"
                                >
                                    <span>Upload a product image</span>
                                    <input
                                        id="file-upload"
                                        name="file-upload"
                                        type="file"
                                        className="sr-only"
                                        accept="image/*"
                                        ref={fileInputRef}
                                        onChange={handleImageChange}
                                    />
                                </label>
                            </div>
                            <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 5MB</p>
                        </div>
                    )}
                </div>

                {/* Barcode & Scan */}
                <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="barcode" className="flex items-center justify-between">
                        <span>Barcode (Optional)</span>
                    </Label>
                    <div className="flex gap-2">
                        <Input
                            id="barcode"
                            placeholder="Scan or enter barcode"
                            value={barcode}
                            onChange={(e) => setBarcode(e.target.value)}
                            className="flex-1"
                            disabled={isSearchingMaster}
                        />
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsScannerOpen(true)}
                            disabled={isSearchingMaster}
                        >
                            {isSearchingMaster ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Barcode className="w-4 h-4 mr-2" />}
                            Scan
                        </Button>
                    </div>
                    {masterProductId && (
                        <p className="text-xs text-green-600 flex items-center gap-1 mt-1 font-medium">
                            <CheckCircle2 className="w-3 h-3" /> Linked to Global Catalog
                        </p>
                    )}
                </div>

                {/* Name */}
                <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="name">Product Name *</Label>
                    <Input
                        id="name"
                        placeholder="e.g. Fresh Apples"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </div>

                {/* Description */}
                <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                        id="description"
                        placeholder="Product description..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>

                {/* Price */}
                <div className="space-y-2">
                    <Label htmlFor="price">Price (₹) *</Label>
                    <Input
                        id="price"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        required
                    />
                </div>

                {/* Original Price */}
                <div className="space-y-2">
                    <Label htmlFor="originalPrice">MRP (₹)</Label>
                    <Input
                        id="originalPrice"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={originalPrice}
                        onChange={(e) => setOriginalPrice(e.target.value)}
                    />
                </div>

                {/* Quantity */}
                <div className="space-y-2">
                    <Label htmlFor="quantity">Stock Quantity *</Label>
                    <Input
                        id="quantity"
                        type="number"
                        placeholder="0"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        required
                    />
                </div>

                {/* Unit */}
                <div className="space-y-2">
                    <Label htmlFor="unit">Unit</Label>
                    <Input
                        id="unit"
                        placeholder="e.g. kg, pcs, box"
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                    />
                </div>

                {/* Min Order Quantity */}
                <div className="space-y-2">
                    <Label htmlFor="minOrderQty">Min Order Quantity</Label>
                    <Input
                        id="minOrderQty"
                        type="number"
                        placeholder="1"
                        value={minOrderQty}
                        onChange={(e) => setMinOrderQty(e.target.value)}
                    />
                </div>

                {/* Max Order Quantity */}
                <div className="space-y-2">
                    <Label htmlFor="maxOrderQty">Max Order Quantity (Optional)</Label>
                    <Input
                        id="maxOrderQty"
                        type="number"
                        placeholder="e.g. 10"
                        value={maxOrderQty}
                        onChange={(e) => setMaxOrderQty(e.target.value)}
                    />
                </div>

                {/* Product Group */}
                <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="productGroup">Product Group</Label>
                    <Autocomplete
                        value={productGroup}
                        onChange={setProductGroup}
                        suggestions={productGroups}
                        placeholder="e.g. Ketchup & Sauces"
                    />
                </div>

                {/* Category */}
                <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Autocomplete
                        value={categorySearch}
                        onChange={(val) => {
                            setCategorySearch(val);
                            if (!val) setCategoryId("");
                        }}
                        onSelect={(id) => setCategoryId(id)}
                        suggestions={allCategories}
                        placeholder="Search category..."
                    />
                </div>

                {/* Active Status */}
                <div className="md:col-span-2 flex items-center space-x-2 rounded-md border p-4">
                    <Switch
                        id="isActive"
                        checked={isActive}
                        onCheckedChange={setIsActive}
                    />
                    <Label htmlFor="isActive" className="flex-1 cursor-pointer">
                        Is Active
                        <span className="block text-xs font-normal text-muted-foreground">
                            When inactive, this product will be hidden from customers.
                        </span>
                    </Label>
                </div>

                {/* Seasonal Status */}
                <div className="md:col-span-2 flex items-center space-x-2 rounded-md border p-4">
                    <Switch
                        id="isSeasonal"
                        checked={isSeasonal}
                        onCheckedChange={setIsSeasonal}
                    />
                    <Label htmlFor="isSeasonal" className="flex-1 cursor-pointer">
                        Seasonal Pick
                        <span className="block text-xs font-normal text-muted-foreground">
                            When active, this product will be featured in the "Seasonal Picks" lane on the customer home page.
                        </span>
                    </Label>
                </div>

            </div>

            <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isEditing ? "Update Product" : "Create Product"}
                </Button>
            </div>

            {isScannerOpen && (
                <BarcodeScanner
                    onClose={() => setIsScannerOpen(false)}
                    onScanSuccess={handleScanSuccess}
                />
            )}
        </form>
    );
}
