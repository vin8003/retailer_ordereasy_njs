"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload, X, Loader2, Barcode, CheckCircle2, Plus, Trash2, Eye, EyeOff } from "lucide-react";
import { 
    Card, 
    CardHeader, 
    CardTitle, 
    CardContent 
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

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
    const [name, setName] = useState(initialData?.name ?? "");
    const [description, setDescription] = useState(initialData?.description ?? "");
    const [price, setPrice] = useState(initialData?.price ?? "");
    const [purchasePrice, setPurchasePrice] = useState(initialData?.purchase_price ?? "");
    const [originalPrice, setOriginalPrice] = useState(initialData?.original_price ?? "");
    const [quantity, setQuantity] = useState(initialData?.quantity !== undefined ? String(initialData.quantity) : "0");
    const [unit, setUnit] = useState(initialData?.unit ?? "piece");
    const [minOrderQty, setMinOrderQty] = useState(initialData?.minimum_order_quantity ?? "1");
    const [maxOrderQty, setMaxOrderQty] = useState(initialData?.maximum_order_quantity || "");
    const [productGroup, setProductGroup] = useState(initialData?.product_group || "");
    const [barcode, setBarcode] = useState(initialData?.barcode || "");
    const [masterProductId, setMasterProductId] = useState(initialData?.master_product || "");
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [isSearchingMaster, setIsSearchingMaster] = useState(false);

    // Grouping State (KAN-13)
    const [isParentBulk, setIsParentBulk] = useState(initialData?.is_parent_bulk ?? false);
    const [isLinkedToParent, setIsLinkedToParent] = useState(!!initialData?.parent_bulk_product);
    const [parentBulkProductSearch, setParentBulkProductSearch] = useState("");
    const [parentBulkProductId, setParentBulkProductId] = useState<string>(initialData?.parent_bulk_product?.toString() || "");
    const [conversionFactor, setConversionFactor] = useState(initialData?.conversion_factor ?? "");
    const [parentProductSuggestions, setParentProductSuggestions] = useState<any[]>([]);
    const [isSearchingParents, setIsSearchingParents] = useState(false);
    const [childIsAvailable, setChildIsAvailable] = useState(initialData?.is_available ?? true);

    // Handle category: could be ID (create) or Object (edit)
    const getInitialCategoryId = () => {
        if (!initialData?.category) return "";
        if (typeof initialData.category === 'object') return initialData.category.id.toString();
        return initialData.category.toString();
    };
    const [categoryId, setCategoryId] = useState<string>(getInitialCategoryId());

    const [isActive, setIsActive] = useState(initialData?.is_active ?? true);
    const [isSeasonal, setIsSeasonal] = useState(initialData?.is_seasonal ?? false);
    const [trackInventory, setTrackInventory] = useState(initialData?.track_inventory ?? true);
    const [hasBatches, setHasBatches] = useState(initialData?.has_batches ?? false);
    const [batches, setBatches] = useState<any[]>(initialData?.batches || []);

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

                // If editing, try to get parent product name if ID is provided
                if (isEditing && initialData?.parent_bulk_product) {
                    try {
                        const parentId = typeof initialData.parent_bulk_product === 'object' ? initialData.parent_bulk_product.id : initialData.parent_bulk_product;
                        const parentRes = await productService.fetchProductDetails(parentId);
                        if (parentRes.data) {
                            setParentBulkProductSearch(parentRes.data.name);
                            setParentProductSuggestions([parentRes.data]);
                        }
                    } catch (e) {
                        console.error("Failed to load parent product name", e);
                    }
                }
            } catch (error) {
                console.error("Failed to load form data", error);
            }
        };
        fetchInitialData();
    }, [isEditing, initialData]);

    useEffect(() => {
        const fetchParents = async () => {
            if (!parentBulkProductSearch) {
                setParentProductSuggestions([]);
                return;
            }
            // Skip search if the user just selected a suggestion
            const exactMatch = parentProductSuggestions.find(s => s.name === parentBulkProductSearch);
            // If the ID is still set and matches exactly, we don't need to search again
            if (exactMatch && parentBulkProductId && exactMatch.id.toString() === parentBulkProductId) return;

            setIsSearchingParents(true);
            try {
                const res = await productService.searchProducts(parentBulkProductSearch);
                const items = res.data?.results || [];
                setParentProductSuggestions(items);
            } catch (err) {
                console.error("Failed to search parent products", err);
            } finally {
                setIsSearchingParents(false);
            }
        };

        const timer = setTimeout(fetchParents, 300);
        return () => clearTimeout(timer);
    }, [parentBulkProductSearch, parentBulkProductId, parentProductSuggestions]);

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

    const addBatch = () => {
        setBatches([...batches, {
            batch_number: "",
            barcode: barcode,
            purchase_price: purchasePrice,
            price: price,
            original_price: originalPrice,
            quantity: "0",
            is_active: true,
            show_on_app: true
        }]);
    };

    const removeBatch = (index: number) => {
        const newBatches = [...batches];
        newBatches.splice(index, 1);
        setBatches(newBatches);
    };

    const updateBatch = (index: number, field: string, value: any) => {
        const newBatches = [...batches];
        newBatches[index] = { ...newBatches[index], [field]: value };
        setBatches(newBatches);
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

        const isInvalid = (val: any) => val === "" || val === null || val === undefined;

        if (!name || (!hasBatches && isInvalid(price))) {
            toast.error("Please fill in required fields (Name, Price)");
            return;
        }

        if (hasBatches && batches.length === 0) {
            toast.error("Please add at least one batch if Batch System is ON");
            return;
        }

        setIsLoading(true);

        try {
            const formData = new FormData();
            formData.append("name", name);
            if (description) formData.append("description", description);
            formData.append("price", price);
            if (purchasePrice) formData.append("purchase_price", purchasePrice);
            if (originalPrice) formData.append("original_price", originalPrice);
            if (trackInventory) {
                formData.append("quantity", quantity || "0");
            } else {
                formData.append("quantity", "0");
            }
            formData.append("track_inventory", String(trackInventory));
            formData.append("unit", unit);
            formData.append("minimum_order_quantity", minOrderQty);
            if (maxOrderQty) formData.append("maximum_order_quantity", maxOrderQty);
            if (productGroup) formData.append("product_group", productGroup);
            formData.append("barcode", barcode || "");
            if (masterProductId) formData.append("master_product", masterProductId);

            if (categoryId) formData.append("category", categoryId);
            formData.append("is_active", String(isActive));
            formData.append("is_seasonal", String(isSeasonal));
            formData.append("has_batches", String(hasBatches));
            if (hasBatches) {
                formData.append("batches", JSON.stringify(batches));
            }

            // KAN-13 Product Grouping fields
            formData.append("is_parent_bulk", String(isParentBulk));
            if (isLinkedToParent && !isParentBulk) {
                if (parentBulkProductId) formData.append("parent_bulk_product", parentBulkProductId);
                if (conversionFactor) formData.append("conversion_factor", conversionFactor);
                // Child products: force quantity to 0 (stock comes from parent)
                formData.set("quantity", "0");
            }

            // is_available: for child products use the toggle, otherwise default true
            if (isLinkedToParent && parentBulkProductId) {
                formData.append("is_available", String(childIsAvailable));
            } else {
                formData.append("is_available", "true");
            }

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

                {/* Batch System Toggle */}
                <div className={`md:col-span-2 flex items-center space-x-2 rounded-md border p-4 bg-primary/5 border-primary/20 ${isLinkedToParent ? 'opacity-50' : ''}`}>
                    <Switch
                        id="hasBatches"
                        checked={hasBatches}
                        disabled={isLinkedToParent}
                        onCheckedChange={(checked) => {
                            setHasBatches(checked);
                            if (checked && batches.length === 0) {
                                // Add an initial batch from current values if switching ON
                                setBatches([{
                                    batch_number: "B1",
                                    barcode: barcode,
                                    purchase_price: purchasePrice,
                                    price: price,
                                    original_price: originalPrice,
                                    quantity: quantity || "0",
                                    is_active: true,
                                    show_on_app: true
                                }]);
                            }
                        }}
                    />
                    <Label htmlFor="hasBatches" className="flex-1 cursor-pointer font-bold text-primary">
                        Enable Multi-Batch Inventory System
                        <span className="block text-xs font-normal text-muted-foreground">
                            {isLinkedToParent
                                ? "Disabled: Batch management is handled by the parent bulk product."
                                : "Turn this ON if you have same products with different MRPs, Barcodes, or Purchase Prices."}
                        </span>
                    </Label>
                </div>

                {!hasBatches ? (
                    <>
                        {/* Price */}
                        <div className="space-y-2">
                            <Label htmlFor="price">Selling Price (₹) *</Label>
                            <Input
                                id="price"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                required={!hasBatches}
                            />
                        </div>

                        {/* Purchase Price */}
                        <div className="space-y-2">
                            <Label htmlFor="purchasePrice">Purchase Price (₹)</Label>
                            <Input
                                id="purchasePrice"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={purchasePrice}
                                onChange={(e) => setPurchasePrice(e.target.value)}
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

                        {/* Track Inventory Toggle */}
                        <div className="md:col-span-2 flex items-center space-x-2 rounded-md border p-4 bg-muted/5">
                            <Switch
                                id="trackInventory"
                                checked={trackInventory}
                                onCheckedChange={setTrackInventory}
                            />
                            <Label htmlFor="trackInventory" className="flex-1 cursor-pointer">
                                Track Inventory Stock
                                <span className="block text-xs font-normal text-muted-foreground">
                                    If OFF, this item will always be "Available" for order regardless of stock count. Ideal for prepared food.
                                </span>
                            </Label>
                        </div>

                        {/* Quantity */}
                        {trackInventory && (
                            <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                                <Label htmlFor="quantity">Stock Quantity *</Label>
                                <Input
                                    id="quantity"
                                    type="number"
                                    placeholder="0"
                                    value={isLinkedToParent ? quantity : quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    required={trackInventory && !hasBatches}
                                    disabled={isLinkedToParent}
                                    className={isLinkedToParent ? 'opacity-50 cursor-not-allowed' : ''}
                                />
                                {isLinkedToParent && (
                                    <p className="text-xs text-blue-600 font-medium">
                                        ⓘ Stock is automatically synced from the parent bulk product. Manual editing is disabled.
                                    </p>
                                )}
                            </div>
                        )}
                    </>
                ) : (
                    <div className="md:col-span-2 space-y-4">
                        <Card className="border-primary/20">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-primary/5">
                                <CardTitle className="text-sm font-medium">Batch Management</CardTitle>
                                <Button type="button" size="sm" onClick={addBatch} className="h-8 gap-1">
                                    <Plus className="h-4 w-4" /> Add Batch
                                </Button>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[100px]">Batch No</TableHead>
                                            <TableHead>Barcode</TableHead>
                                            <TableHead className="w-[100px]">MRP</TableHead>
                                            <TableHead className="w-[100px]">Selling</TableHead>
                                            <TableHead className="w-[80px]">Stock</TableHead>
                                            <TableHead className="w-[70px]">App</TableHead>
                                            <TableHead className="w-[50px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {batches.map((batch, index) => (
                                            <TableRow key={index}>
                                                <TableCell className="p-2">
                                                    <Input 
                                                        value={batch.batch_number ?? ''} 
                                                        onChange={(e) => updateBatch(index, "batch_number", e.target.value)}
                                                        placeholder="B1"
                                                        className="h-8 text-xs"
                                                    />
                                                </TableCell>
                                                <TableCell className="p-2">
                                                    <Input 
                                                        value={batch.barcode ?? ''} 
                                                        onChange={(e) => updateBatch(index, "barcode", e.target.value)}
                                                        placeholder="Barcode"
                                                        className="h-8 text-xs"
                                                    />
                                                </TableCell>
                                                <TableCell className="p-2">
                                                    <Input 
                                                        type="number"
                                                        value={batch.original_price ?? ''} 
                                                        onChange={(e) => updateBatch(index, "original_price", e.target.value)}
                                                        className="h-8 text-xs"
                                                    />
                                                </TableCell>
                                                <TableCell className="p-2">
                                                    <Input 
                                                        type="number"
                                                        value={batch.price ?? ''} 
                                                        onChange={(e) => updateBatch(index, "price", e.target.value)}
                                                        className="h-8 text-xs"
                                                    />
                                                </TableCell>
                                                <TableCell className="p-2">
                                                    <Input 
                                                        type="number"
                                                        value={batch.quantity ?? ''} 
                                                        onChange={(e) => updateBatch(index, "quantity", e.target.value)}
                                                        className="h-8 text-xs"
                                                    />
                                                </TableCell>
                                                <TableCell className="p-2 text-center">
                                                    <button 
                                                        type="button"
                                                        onClick={() => updateBatch(index, "show_on_app", !batch.show_on_app)}
                                                        className={`p-1 rounded ${batch.show_on_app ? 'text-primary' : 'text-muted-foreground'}`}
                                                    >
                                                        {batch.show_on_app ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                                    </button>
                                                </TableCell>
                                                <TableCell className="p-2">
                                                    <Button 
                                                        type="button" 
                                                        variant="ghost" 
                                                        size="sm" 
                                                        onClick={() => removeBatch(index)}
                                                        className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                {batches.length === 0 && (
                                    <div className="p-4 text-center text-sm text-muted-foreground">
                                        No batches added. Click "Add Batch" to start.
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                        
                        <div className="flex items-center space-x-2 rounded-md border p-4 bg-muted/5">
                            <Switch
                                id="trackInventoryBatches"
                                checked={trackInventory}
                                onCheckedChange={setTrackInventory}
                            />
                            <Label htmlFor="trackInventoryBatches" className="flex-1 cursor-pointer">
                                Track Inventory Stock (Globally)
                            </Label>
                        </div>
                    </div>
                )}

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

                {/* Product Grouping (Pack & Bulk sizing) KAN-13 */}
                <div className="md:col-span-2 space-y-4 rounded-md border p-4 bg-muted/5 mt-4">
                    <h3 className="text-sm font-semibold text-primary">Fractional Sizing (Pack & Bulk)</h3>

                    {/* Toggle 1: Is Master Bulk Product */}
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="isParentBulk"
                            checked={isParentBulk}
                            onCheckedChange={(checked) => {
                                setIsParentBulk(checked);
                                if (checked) {
                                    // Cannot be both parent and child
                                    setIsLinkedToParent(false);
                                    setParentBulkProductId("");
                                    setParentBulkProductSearch("");
                                    setConversionFactor("");
                                }
                            }}
                        />
                        <Label htmlFor="isParentBulk" className="flex-1 cursor-pointer">
                            Set as Master Bulk Product
                            <span className="block text-xs font-normal text-muted-foreground">
                                Turn ON if this is the main large-size product (e.g. 50kg bag) from which smaller packs are derived.
                            </span>
                        </Label>
                    </div>

                    {/* Toggle 2: Link to a Parent Bulk Product */}
                    {!isParentBulk && (
                        <div className="flex items-center space-x-2 mt-2">
                            <Switch
                                id="isLinkedToParent"
                                checked={isLinkedToParent}
                                onCheckedChange={(checked) => {
                                    setIsLinkedToParent(checked);
                                    if (!checked) {
                                        setParentBulkProductId("");
                                        setParentBulkProductSearch("");
                                        setConversionFactor("");
                                        setChildIsAvailable(true);
                                    }
                                }}
                            />
                            <Label htmlFor="isLinkedToParent" className="flex-1 cursor-pointer">
                                Link to a Master Bulk Product
                                <span className="block text-xs font-normal text-muted-foreground">
                                    Turn ON to link this product as a smaller pack (e.g. 5kg) of a master bulk product. Stock will be managed by the parent.
                                </span>
                            </Label>
                        </div>
                    )}

                    {/* Child fields: Parent selection, Conversion Factor, Availability */}
                    {isLinkedToParent && !isParentBulk && (
                        <div className="space-y-4 mt-4 animate-in slide-in-from-top-2 duration-300">
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="parentBulkProduct">Parent Bulk Product *</Label>
                                    <Autocomplete
                                        value={parentBulkProductSearch}
                                        onChange={(val) => {
                                            setParentBulkProductSearch(val);
                                            // Always clear the ID when typing. 
                                            // Autocomplete's onSelect will immediately set it back if they clicked an item.
                                            setParentBulkProductId("");
                                        }}
                                        onSelect={(id) => setParentBulkProductId(id)}
                                        suggestions={parentProductSuggestions}
                                        placeholder="Search parent product..."
                                        isLoading={isSearchingParents}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="conversionFactor">Conversion Factor (Ratio) *</Label>
                                    <Input
                                        id="conversionFactor"
                                        type="number"
                                        step="0.0001"
                                        placeholder="e.g. 0.10 for 5kg from 50kg"
                                        value={conversionFactor}
                                        onChange={(e) => setConversionFactor(e.target.value)}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        This is the weight ratio of this pack relative to the parent. E.g. 5kg ÷ 50kg = 0.10
                                    </p>
                                </div>
                            </div>

                            {/* Availability Toggle for Child */}
                            {parentBulkProductId && (
                                <div className="flex items-center space-x-2 rounded-md border p-4 bg-blue-50/50 border-blue-200 animate-in slide-in-from-top-2 duration-300">
                                    <Switch
                                        id="childIsAvailable"
                                        checked={childIsAvailable}
                                        onCheckedChange={setChildIsAvailable}
                                    />
                                    <Label htmlFor="childIsAvailable" className="flex-1 cursor-pointer">
                                        Show on Customer App (Online)
                                        <span className="block text-xs font-normal text-muted-foreground">
                                            If OFF, this pack size will only be available for POS (in-store) sales, not on the customer app.
                                        </span>
                                    </Label>
                                </div>
                            )}

                            <div className="rounded-md border border-amber-200 bg-amber-50/50 p-3">
                                <p className="text-xs text-amber-800">
                                    <strong>⚠ Note:</strong> Once linked, this product&apos;s stock will be calculated automatically from the parent product.
                                    If this product currently has stock, please transfer it to the parent&apos;s inventory first and set this product&apos;s stock to 0.
                                </p>
                            </div>
                        </div>
                    )}
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
