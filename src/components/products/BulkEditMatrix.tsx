"use client";

import { useRef, useState, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { X, Save, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Product {
    id: number;
    name: string;
    price: string | number;
    quantity: number;
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
    const [changes, setChanges] = useState<Record<number, { price?: string, quantity?: string }>>({});
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

    const handleInputChange = (id: number, field: 'price' | 'quantity', value: string) => {
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
            return payloadItem;
        }).filter(item => item.price !== undefined || item.quantity !== undefined);

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
            <div className="grid grid-cols-[1fr_80px_80px] sm:grid-cols-[1fr_120px_120px] gap-2 p-3 border-b bg-muted/30 text-xs font-medium text-muted-foreground sticky top-0 md:px-6">
                <div>Product Name</div>
                <div className="text-right">Price (₹)</div>
                <div className="text-right">Stock</div>
            </div>

            {/* Virtualized List Body */}
            <div
                ref={parentRef}
                className="flex-1 overflow-auto bg-slate-50/50 dark:bg-slate-900/10 p-2 md:px-4"
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

                        const currentPrice = productChanges?.price !== undefined ? productChanges.price : product.price;
                        const currentQuantity = productChanges?.quantity !== undefined ? productChanges.quantity : product.quantity;

                        const isEdited = productChanges !== undefined && (productChanges.price !== undefined || productChanges.quantity !== undefined);

                        return (
                            <div
                                key={virtualRow.index}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    transform: `translateY(${virtualRow.start}px)`,
                                }}
                                className={`
                                    grid grid-cols-[1fr_80px_80px] sm:grid-cols-[1fr_120px_120px] gap-2 items-center 
                                    p-2 border-b bg-background
                                    ${isEdited ? 'border-l-2 border-l-blue-500 bg-blue-50/20' : ''}
                                `}
                            >
                                <div className="text-sm font-medium truncate pr-2">
                                    {product.name}
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
                            </div>
                        );
                    })}
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
