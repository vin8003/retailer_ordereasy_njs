"use client";

import { useRef, useState, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { X, Save, AlertCircle, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

interface Product {
    id: number;
    name: string;
    price: string | number;
    quantity: number;
    original_price?: string | number;
    barcode?: string;
    is_active?: boolean;
    image?: string;
}

interface BulkEditMatrixProps {
    open: boolean;
    products: Product[];
    onClose: () => void;
    onSave: (changes: any[]) => Promise<void>;
}

export function BulkEditMatrix({ open, products, onClose, onSave }: BulkEditMatrixProps) {
    const parentRef = useRef<HTMLDivElement>(null);
    const [changes, setChanges] = useState<Record<number, {
        price?: string,
        quantity?: string,
        name?: string,
        original_price?: string,
        barcode?: string,
        is_active?: boolean
    }>>({});
    const [isSaving, setIsSaving] = useState(false);

    // Reset changes when opening
    useEffect(() => {
        if (open) {
            setChanges({});
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
        // Prepare payload only for modified items
        const payload = Object.entries(changes).map(([idStr, changeData]) => {
            const id = parseInt(idStr, 10);
            const payloadItem: any = { id };
            if (changeData.price !== undefined && changeData.price !== "") {
                payloadItem.price = Number(changeData.price);
            }
            if (changeData.quantity !== undefined && changeData.quantity !== "") {
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

            {/* Matrix Header Columns */}
            <div className="overflow-x-auto w-full">
                <div className="grid grid-cols-[200px_100px_100px_100px_150px_80px] min-w-[730px] gap-2 p-3 border-b bg-muted/30 text-xs font-medium text-muted-foreground sticky top-0 md:px-6">
                    <div>Product Name</div>
                    <div className="text-right">Original Price (₹)</div>
                    <div className="text-right">Sell Price (₹)</div>
                    <div className="text-right">Stock</div>
                    <div>Barcode</div>
                    <div className="text-center">Active</div>
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
                            const currentQuantity = productChanges?.quantity !== undefined ? productChanges.quantity : product.quantity;
                            const currentBarcode = productChanges?.barcode !== undefined ? productChanges.barcode : (product.barcode || "");
                            const currentIsActive = productChanges?.is_active !== undefined ? productChanges.is_active : (product.is_active !== false);

                            const isEdited = productChanges !== undefined && Object.keys(productChanges).length > 0;

                            return (
                                <div
                                    key={virtualRow.index}
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        minWidth: '730px',
                                        transform: `translateY(${virtualRow.start}px)`,
                                    }}
                                    className={`
                                    grid grid-cols-[200px_100px_100px_100px_150px_80px] min-w-[730px] gap-2 items-center 
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
                                    <div>
                                        <Input
                                            type="number"
                                            inputMode="numeric"
                                            className="h-9 w-full text-right bg-white dark:bg-black"
                                            value={currentQuantity}
                                            onChange={(e) => handleInputChange(product.id, 'quantity', e.target.value)}
                                            placeholder="0"
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
                                    <div className="flex justify-center">
                                        <Switch
                                            checked={currentIsActive}
                                            onCheckedChange={(checked) => handleInputChange(product.id, 'is_active', checked)}
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
