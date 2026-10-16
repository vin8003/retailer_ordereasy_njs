"use client";

import { useRef, useState, useEffect } from "react";
import { toast } from "sonner";
import { useVirtualizer } from "@tanstack/react-virtual";
import { X, Save, AlertCircle, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    GST_RATE_OPTIONS,
    buildBulkTaxChanges,
    shouldRecommendBulkHsnWarning,
    type GstRate,
} from "@/lib/productTax";

interface Product {
    id: number;
    name: string;
    price: string | number;
    app_price?: string | number | null;
    quantity: number;
    original_price?: string | number;
    barcode?: string;
    is_active?: boolean;
    is_seasonal?: boolean;
    image?: string;
    hsn_code?: string;
    gst_rate?: string | number;
}

interface BulkEditMatrixProps {
    open: boolean;
    products: Product[];
    onClose: () => void;
    onSave: (changes: any[]) => Promise<void>;
    canEditAppPrice?: boolean;
    canAdjustInventory?: boolean;
}

export function BulkEditMatrix({ open, products, onClose, onSave, canEditAppPrice = false, canAdjustInventory = false }: BulkEditMatrixProps) {
    const parentRef = useRef<HTMLDivElement>(null);
    const [changes, setChanges] = useState<Record<number, {
        price?: string,
        app_price?: string,
        quantity?: string,
        name?: string,
        original_price?: string,
        barcode?: string,
        is_active?: boolean,
        is_seasonal?: boolean,
        hsn_code?: string,
        gst_rate?: string | number
    }>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [applyHsn, setApplyHsn] = useState(false);
    const [bulkHsnCode, setBulkHsnCode] = useState("");
    const [applyGst, setApplyGst] = useState(false);
    const [bulkGstRate, setBulkGstRate] = useState("0");

    // Reset changes when opening
    useEffect(() => {
        if (open) {
            setChanges({});
            setApplyHsn(false);
            setBulkHsnCode("");
            setApplyGst(false);
            setBulkGstRate("0");
        }
    }, [open]);

    const rowVirtualizer = useVirtualizer({
        count: products.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 70, // Row height
        overscan: 10,
    });

    if (!open) return null;

    const handleInputChange = (id: number, field: string, value: any) => {
        setChanges(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                [field]: value
            }
        }));
    };

    const handleSave = async () => {
        // Reject non-numeric money/stock input; Number("abc") would be NaN and silently
        // serialise as null (clearing the app price).
        for (const [idStr, changeData] of Object.entries(changes)) {
            const numericFields: Array<[string, string | undefined, boolean]> = [
                ["Price", changeData.price, false],
                ["App price", canEditAppPrice ? changeData.app_price : undefined, true],
                ["Stock", changeData.quantity, false],
                ["MRP", changeData.original_price, false],
            ];
            for (const [label, raw, canBeEmpty] of numericFields) {
                if (raw === undefined || (raw === "" && canBeEmpty)) continue;
                if (raw === "") continue;
                const value = Number(raw);
                if (!Number.isFinite(value) || value < 0 || (label === "App price" && value === 0)) {
                    toast.error(`${label} for product #${idStr} must be a valid positive number`);
                    return;
                }
            }
        }

        // Prepare payload only for modified items
        const payload = Object.entries(changes).map(([idStr, changeData]) => {
            const id = parseInt(idStr, 10);
            const payloadItem: any = { id };
            if (changeData.price !== undefined && changeData.price !== "") {
                payloadItem.price = Number(changeData.price);
            }
            if (canEditAppPrice && changeData.app_price !== undefined) {
                payloadItem.app_price = changeData.app_price === "" ? null : Number(changeData.app_price);
            }
            if (canAdjustInventory && changeData.quantity !== undefined && changeData.quantity !== "") {
                payloadItem.quantity = Number(changeData.quantity);
            }
            if (changeData.name !== undefined) {
                payloadItem.name = changeData.name;
            }
            if (changeData.original_price !== undefined && changeData.original_price !== "") {
                payloadItem.original_price = Number(changeData.original_price);
            }
            if (changeData.barcode !== undefined) {
                payloadItem.barcode = changeData.barcode;
            }
            if (changeData.is_active !== undefined) {
                payloadItem.is_active = changeData.is_active;
            }
            if (changeData.is_seasonal !== undefined) {
                payloadItem.is_seasonal = changeData.is_seasonal;
            }
            if (changeData.hsn_code !== undefined) {
                payloadItem.hsn_code = changeData.hsn_code.trim();
            }
            if (changeData.gst_rate !== undefined) {
                payloadItem.gst_rate = Number(changeData.gst_rate);
            }
            return payloadItem;
        }).filter(item => Object.keys(item).length > 1);

        if (payload.length === 0) {
            onClose();
            return;
        }

        setIsSaving(true);
        try {
            await onSave(payload);
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const changesCount = Object.keys(changes).length;

    const handleApplyTaxToAll = () => {
        if (!applyHsn && !applyGst) return;

        setChanges((previous) => {
            const next = { ...previous };
            const taxChanges = buildBulkTaxChanges(
                products.map((product) => product.id),
                {
                    hsnCode: applyHsn ? bulkHsnCode : undefined,
                    gstRate: applyGst ? Number(bulkGstRate) as GstRate : undefined,
                },
            );
            taxChanges.forEach(({ id, ...taxFields }) => {
                next[id] = {
                    ...next[id],
                    ...taxFields,
                };
            });
            return next;
        });
    };

    return (
        <div className="fixed inset-0 z-[100] bg-background flex flex-col animate-in slide-in-from-bottom-4 duration-300">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-card">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={onClose} disabled={isSaving}>
                        <X className="w-5 h-5" />
                    </Button>
                    <div>
                        <h2 className="font-semibold text-lg">Bulk Edit Products</h2>
                        <p className="text-xs text-muted-foreground">{products.length} products selected</p>
                    </div>
                </div>
                <Button onClick={handleSave} disabled={isSaving || changesCount === 0}>
                    {isSaving ? "Saving..." : `Save Changes (${changesCount})`}
                </Button>
            </div>

            <div className="flex flex-wrap items-end gap-4 border-b bg-muted/20 p-4 md:px-6">
                <div className="flex items-center gap-2">
                    <Switch checked={applyHsn} onCheckedChange={setApplyHsn} aria-label="Update HSN for all selected products" />
                    <div className="space-y-1">
                        <label className="text-xs font-medium" htmlFor="bulkHsnCode">Set HSN for all</label>
                        <Input
                            id="bulkHsnCode"
                            className="h-9 w-44 bg-background"
                            value={bulkHsnCode}
                            maxLength={8}
                            onChange={(event) => setBulkHsnCode(event.target.value)}
                            disabled={!applyHsn}
                            placeholder="HSN code"
                        />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Switch checked={applyGst} onCheckedChange={setApplyGst} aria-label="Update GST for all selected products" />
                    <div className="space-y-1">
                        <label className="text-xs font-medium" htmlFor="bulkGstRate">Set GST for all</label>
                        <Select value={bulkGstRate} onValueChange={setBulkGstRate} disabled={!applyGst}>
                            <SelectTrigger id="bulkGstRate" className="h-9 w-32 bg-background">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {GST_RATE_OPTIONS.map((rate) => (
                                    <SelectItem key={rate} value={String(rate)}>{rate}%</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <Button type="button" variant="outline" onClick={handleApplyTaxToAll} disabled={!applyHsn && !applyGst}>
                    Apply to selected
                </Button>
                {applyGst && shouldRecommendBulkHsnWarning(bulkGstRate, applyHsn, bulkHsnCode, products, changes) && (
                    <p className="text-xs font-medium text-amber-600">
                        HSN recommended when GST is not 0%
                    </p>
                )}
            </div>

            {/* Matrix Header Columns */}
            <div className="overflow-x-auto w-full">
                <div className={`grid ${canEditAppPrice ? "grid-cols-[200px_100px_100px_100px_100px_150px_130px_100px_80px_100px] min-w-[1180px]" : "grid-cols-[200px_100px_100px_100px_150px_130px_100px_80px_100px] min-w-[1080px]"} gap-2 p-3 border-b bg-muted/30 text-xs font-medium text-muted-foreground sticky top-0 md:px-6`}>
                    <div>Product Name</div>
                    <div className="text-right">Original Price (₹)</div>
                    <div className="text-right">Store (₹)</div>
                    {canEditAppPrice && <div className="text-right">App (₹)</div>}
                    <div className="text-right" title={canAdjustInventory ? undefined : "inventory.adjust is required to change on-hand quantity."}>Stock</div>
                    <div>Barcode</div>
                    <div>HSN Code</div>
                    <div>GST Rate</div>
                    <div className="text-center">Active</div>
                    <div className="text-center">Seasonal Pick</div>
                </div>

                {/* Virtualized List Body */}
                <div
                    ref={parentRef}
                    className="flex-1 overflow-x-auto overflow-y-auto bg-slate-50/50 dark:bg-slate-900/10 p-2 md:px-4"
                >
                    <div
                        style={{
                            height: `${rowVirtualizer.getTotalSize()}px`,
                            width: '100%',
                            position: 'relative',
                        }}
                    >
                        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                            const product = products[virtualRow.index];
                            const productChanges = changes[product.id];

                            const currentName = productChanges?.name !== undefined ? productChanges.name : product.name;
                            const currentMRP = productChanges?.original_price !== undefined ? productChanges.original_price : (product.original_price || "");
                            const currentPrice = productChanges?.price !== undefined ? productChanges.price : product.price;
                            const currentAppPrice = productChanges?.app_price !== undefined ? productChanges.app_price : (product.app_price ?? "");
                            const currentQuantity = productChanges?.quantity !== undefined ? productChanges.quantity : product.quantity;
                            const currentBarcode = productChanges?.barcode !== undefined ? productChanges.barcode : (product.barcode || "");
                            const currentHsnCode = productChanges?.hsn_code !== undefined ? productChanges.hsn_code : (product.hsn_code || "");
                            const currentGstRate = productChanges?.gst_rate !== undefined ? productChanges.gst_rate : String(Number(product.gst_rate) || 0);
                            const currentIsActive = productChanges?.is_active !== undefined ? productChanges.is_active : (product.is_active !== false);
                            const currentIsSeasonal = productChanges?.is_seasonal !== undefined ? productChanges.is_seasonal : (product.is_seasonal === true);

                            const isEdited = productChanges !== undefined && Object.keys(productChanges).length > 0;

                            return (
                                <div
                                    key={virtualRow.index}
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        minWidth: '1080px',
                                        transform: `translateY(${virtualRow.start}px)`,
                                    }}
                                    className={`
                                    grid ${canEditAppPrice ? "grid-cols-[200px_100px_100px_100px_100px_150px_130px_100px_80px_100px] min-w-[1180px]" : "grid-cols-[200px_100px_100px_100px_150px_130px_100px_80px_100px] min-w-[1080px]"} gap-2 items-center
                                    p-2 border-b bg-background
                                    ${isEdited ? 'border-l-2 border-l-blue-500 bg-blue-50/20' : ''}
                                `}
                                >
                                    <div>
                                        <Input
                                            className="h-9 w-full bg-white dark:bg-black focus:ring-blue-500 text-sm"
                                            value={currentName}
                                            onChange={(e) => handleInputChange(product.id, 'name', e.target.value)}
                                            placeholder="Product Name"
                                        />
                                    </div>
                                    <div>
                                        <Input
                                            type="number"
                                            inputMode="decimal"
                                            className="h-9 w-full text-right bg-white dark:bg-black focus:ring-blue-500"
                                            value={currentMRP}
                                            onChange={(e) => handleInputChange(product.id, 'original_price', e.target.value)}
                                            placeholder="MRP"
                                        />
                                    </div>
                                    <div>
                                        <Input
                                            type="number"
                                            inputMode="decimal"
                                            className="h-9 w-full text-right bg-white dark:bg-black focus:ring-blue-500"
                                            value={currentPrice}
                                            onChange={(e) => handleInputChange(product.id, 'price', e.target.value)}
                                            placeholder="0.00"
                                        />
                                    </div>
                                    {canEditAppPrice && (
                                    <div>
                                        <Input
                                            type="number"
                                            inputMode="decimal"
                                            className="h-9 w-full text-right bg-white dark:bg-black focus:ring-blue-500"
                                            value={currentAppPrice}
                                            onChange={(e) => handleInputChange(product.id, 'app_price', e.target.value)}
                                            placeholder="Store"
                                        />
                                    </div>
                                    )}
                                    <div>
                                        <Input
                                            type="number"
                                            inputMode="numeric"
                                            className="h-9 w-full text-right bg-white dark:bg-black"
                                            value={currentQuantity}
                                            onChange={(e) => handleInputChange(product.id, 'quantity', e.target.value)}
                                            placeholder="0"
                                            disabled={!canAdjustInventory}
                                            title={!canAdjustInventory ? "inventory.adjust is required to change on-hand quantity." : undefined}
                                        />
                                    </div>
                                    <div>
                                        <Input
                                            className="h-9 w-full bg-white dark:bg-black focus:ring-blue-500 text-xs"
                                            value={currentBarcode}
                                            onChange={(e) => handleInputChange(product.id, 'barcode', e.target.value)}
                                            placeholder="Barcode"
                                        />
                                    </div>
                                    <div>
                                        <Input
                                            className="h-9 w-full bg-white text-xs dark:bg-black"
                                            value={currentHsnCode}
                                            maxLength={8}
                                            onChange={(e) => handleInputChange(product.id, 'hsn_code', e.target.value)}
                                            placeholder="HSN code"
                                        />
                                    </div>
                                    <div>
                                        <Select
                                            value={String(currentGstRate)}
                                            onValueChange={(value) => handleInputChange(product.id, 'gst_rate', value)}
                                        >
                                            <SelectTrigger className="h-9 w-full bg-white dark:bg-black">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {GST_RATE_OPTIONS.map((rate) => (
                                                    <SelectItem key={rate} value={String(rate)}>{rate}%</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex justify-center">
                                        <Switch
                                            checked={currentIsActive}
                                            onCheckedChange={(checked) => handleInputChange(product.id, 'is_active', checked)}
                                        />
                                    </div>
                                    <div className="flex justify-center">
                                        <Switch
                                            checked={currentIsSeasonal}
                                            onCheckedChange={(checked) => handleInputChange(product.id, 'is_seasonal', checked)}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Warning Footer for massive edits */}
            {products.length > 100 && (
                <div className="p-2 border-t bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400 text-xs flex items-center justify-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Editing large volumes. Only modified cells will be saved.
                </div>
            )}
        </div>
    );
}
