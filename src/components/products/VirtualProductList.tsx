"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useRouter } from "next/navigation";
import { Edit, Trash2, MoreHorizontal, ImageIcon, Star } from "lucide-react";
import { useSwipeable } from "react-swipeable";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { InlineNumpadSheet } from "@/components/products/InlineNumpadSheet";

interface Product {
    id: number;
    name: string;
    category_name?: string;
    unit: string;
    price: string | number;
    original_price?: string | number;
    quantity: number;
    image?: string;
    is_active: boolean;
    is_featured: boolean;
}

interface VirtualProductListProps {
    products: Product[];
    isLoading: boolean;
    onDelete?: (product: Product) => void;
    onToggleFeatured?: (product: Product) => void;
    onEdit?: (product: Product) => void;
    highlightedProductId?: number | null;
    loadMore?: () => void;
    hasMore?: boolean;
    onUpdateStock?: (product: Product, newStock: number) => Promise<void>;
    onUpdatePrice?: (product: Product, newPrice: number) => Promise<void>;
    selectionMode?: boolean;
    selectedIds?: Set<number>;
    onToggleSelect?: (productId: number) => void;
    onToggleSelectionMode?: () => void;
}

export function VirtualProductList({
    products,
    isLoading,
    onDelete,
    onToggleFeatured,
    onEdit,
    highlightedProductId,
    loadMore,
    hasMore,
    onUpdateStock,
    onUpdatePrice,
    selectionMode = false,
    selectedIds = new Set(),
    onToggleSelect,
    onToggleSelectionMode
}: VirtualProductListProps) {
    const parentRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const [editingProduct, setEditingProduct] = useState<{ product: Product | null, type: 'stock' | 'price' }>({ product: null, type: 'stock' });

    const rowVirtualizer = useVirtualizer({
        count: hasMore ? products.length + 1 : products.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 80, // Approximate row height
        overscan: 5,
    });

    const items = rowVirtualizer.getVirtualItems();

    useEffect(() => {
        const [lastItem] = [...items].reverse();

        if (
            lastItem &&
            lastItem.index >= products.length - 1 &&
            hasMore &&
            !isLoading
        ) {
            loadMore?.();
        }
    }, [
        items,
        hasMore,
        isLoading,
        products.length,
        loadMore,
    ]);

    if (isLoading && products.length === 0) {
        return (
            <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4 border rounded-lg p-4">
                        <Skeleton className="h-12 w-12 rounded" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-[250px]" />
                            <Skeleton className="h-4 w-[200px]" />
                        </div>
                        <Skeleton className="h-8 w-[100px]" />
                    </div>
                ))}
            </div>
        );
    }

    if (!isLoading && products.length === 0) {
        return <div className="p-8 text-center text-muted-foreground border rounded-lg">No products found.</div>;
    }

    return (
        <div className="rounded-md border overflow-hidden flex flex-col h-[600px] bg-card">
            {/* Header */}
            <div className="grid grid-cols-[80px_1fr_1fr_100px_100px_80px_50px] gap-4 p-4 border-b bg-muted/50 font-medium text-sm text-muted-foreground sticky top-0 z-10 hidden md:grid">
                <div>Image</div>
                <div>Name</div>
                <div>Category</div>
                <div>Stock</div>
                <div className="text-right">Price</div>
                <div className="text-center">Featured</div>
                <div></div>
            </div>

            {/* Virtualized Body */}
            <div
                ref={parentRef}
                className="flex-1 overflow-auto"
                style={{ contain: 'strict' }}
            >
                <div
                    style={{
                        height: `${rowVirtualizer.getTotalSize()}px`,
                        width: '100%',
                        position: 'relative',
                    }}
                >
                    {items.map((virtualRow) => {
                        const isLoaderRow = virtualRow.index > products.length - 1;

                        if (isLoaderRow) {
                            return (
                                <div
                                    key={`loader-${virtualRow.index}`}
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: `${virtualRow.size}px`,
                                        transform: `translateY(${virtualRow.start}px)`,
                                    }}
                                    className="flex justify-center flex-col p-4 border-b space-y-2"
                                >
                                    <Skeleton className="h-4 w-[250px] mx-auto" />
                                </div>
                            );
                        }

                        const product = products[virtualRow.index];
                        const isHighlighted = highlightedProductId === product.id;

                        // Create a separate functional component or logic scope for Swipeable Row
                        return (
                            <SwipeableRow
                                key={virtualRow.index}
                                product={product}
                                virtualRow={virtualRow}
                                isHighlighted={isHighlighted}
                                measureElement={rowVirtualizer.measureElement}
                                onDelete={onDelete}
                                onEdit={onEdit}
                                onToggleFeatured={onToggleFeatured}
                                onStockClick={() => setEditingProduct({ product, type: 'stock' })}
                                onPriceClick={() => setEditingProduct({ product, type: 'price' })}
                                selectionMode={selectionMode}
                                isSelected={selectedIds.has(product.id)}
                                onToggleSelect={onToggleSelect}
                                onToggleSelectionMode={onToggleSelectionMode}
                            />
                        );
                    })}
                </div>
            </div>

            {/* Inline Editor Sheet */}
            <InlineNumpadSheet
                open={editingProduct.product !== null}
                onOpenChange={(open) => {
                    if (!open) setEditingProduct({ product: null, type: 'stock' });
                }}
                title={editingProduct.type === 'stock' ? `Update Stock for ${editingProduct.product?.name}` : `Update Price for ${editingProduct.product?.name}`}
                initialValue={editingProduct.product ? (editingProduct.type === 'stock' ? editingProduct.product.quantity : editingProduct.product.price) : 0}
                type={editingProduct.type === 'stock' ? 'number' : 'currency'}
                onSave={async (value) => {
                    if (editingProduct.product) {
                        try {
                            if (editingProduct.type === 'stock' && onUpdateStock) {
                                await onUpdateStock(editingProduct.product, Number(value));
                            } else if (editingProduct.type === 'price' && onUpdatePrice) {
                                await onUpdatePrice(editingProduct.product, Number(value));
                            }
                        } catch (e) { throw e; }
                    }
                }}
            />
        </div>
    );
}

// Sub-component for Swipe logic to prevent state re-renders from killing Virtualizer
function SwipeableRow({
    product,
    virtualRow,
    isHighlighted,
    measureElement,
    onDelete,
    onEdit,
    onToggleFeatured,
    onStockClick,
    onPriceClick,
    selectionMode,
    isSelected,
    onToggleSelect,
    onToggleSelectionMode
}: any) {
    const router = useRouter();
    const [swipeOffset, setSwipeOffset] = useState(0);
    const longPressTimer = useRef<NodeJS.Timeout | null>(null);

    const handlers = useSwipeable({
        onSwiping: (e) => {
            // Restrict swipe between -80px (left) and 80px (right)
            if (e.dir === "Left" || e.dir === "Right") {
                let offset = e.deltaX;
                if (offset > 80) offset = 80;
                if (offset < -80) offset = -80;
                setSwipeOffset(offset);
            }
        },
        onSwiped: (e) => {
            if (e.deltaX > 50) {
                // Swiped right -> Edit
                if (onEdit) onEdit(product);
                else router.push(`/dashboard/products/edit?id=${product.id}`);
            } else if (e.deltaX < -50) {
                // Swiped left -> Delete
                if (onDelete) onDelete(product);
            }
            // Spring back
            setSwipeOffset(0);
        },
        trackMouse: true
    });

    const handleStart = () => {
        if (!selectionMode) {
            longPressTimer.current = setTimeout(() => {
                onToggleSelectionMode && onToggleSelectionMode();
                onToggleSelect && onToggleSelect(product.id);
            }, 600);
        }
    };

    const handleEnd = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    };

    const handleClick = (e: React.MouseEvent) => {
        if (selectionMode) {
            e.preventDefault();
            e.stopPropagation();
            onToggleSelect && onToggleSelect(product.id);
        }
    };

    return (
        <div
            data-index={virtualRow.index}
            ref={measureElement}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
                overflow: 'hidden' // hide background actions
            }}
            className="border-b bg-background"
        >
            {/* Background Action Layers */}
            <div className="absolute inset-0 flex items-center justify-between px-6 bg-slate-100 dark:bg-slate-900 z-0">
                <div className="text-blue-500 font-medium flex items-center gap-2">
                    <Edit className="w-5 h-5" /> Edit
                </div>
                <div className="text-red-500 font-medium flex items-center gap-2">
                    Delete <Trash2 className="w-5 h-5" />
                </div>
            </div>

            {/* Foreground Draggable Layer */}
            <div
                {...handlers}
                onTouchStart={(e) => { handleStart(); (handlers as any).onTouchStart?.(e); }}
                onTouchEnd={(e) => { handleEnd(); (handlers as any).onTouchEnd?.(e); }}
                onTouchMove={(e) => { handleEnd(); (handlers as any).onTouchMove?.(e); }}
                onMouseDown={(e) => { handleStart(); (handlers as any).onMouseDown?.(e); }}
                onMouseUp={(e) => { handleEnd(); (handlers as any).onMouseUp?.(e); }}
                onMouseLeave={(e) => { handleEnd(); (handlers as any).onMouseLeave?.(e); }}
                onClick={handleClick}
                style={{ transform: `translateX(${swipeOffset}px)`, transition: swipeOffset === 0 ? 'transform 0.2s ease-out' : 'none' }}
                className={`
                    p-4 md:grid md:grid-cols-[80px_1fr_1fr_100px_100px_80px_50px] gap-4 items-center flex flex-col md:flex-row relative z-10 cursor-pointer
                    ${selectionMode ? (isSelected ? "bg-blue-50 dark:bg-blue-950/30 border-blue-200" : "bg-background") : (isHighlighted ? "bg-green-100/50 dark:bg-green-900/30 transition-colors duration-500" : "hover:bg-muted/50 transition-colors bg-background")}
                `}
            >
                {/* Mobile-first card view or grid row */}
                <div className="flex items-center gap-3 w-full md:w-auto">
                    {/* Checkbox for Selection Mode */}
                    {selectionMode && (
                        <div className="flex-shrink-0">
                            <div className={`w-5 h-5 rounded-sm border flex items-center justify-center ${isSelected ? "bg-blue-600 border-blue-600 shadow-sm" : "border-gray-300"}`}>
                                {isSelected && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                            </div>
                        </div>
                    )}

                    <div className="h-12 w-12 rounded bg-muted flex items-center justify-center overflow-hidden flex-shrink-0 mb-2 md:mb-0">
                        {product.image ? (
                            <img
                                src={product.image}
                                alt={product.name}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = '';
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    (e.target as HTMLImageElement).parentElement!.classList.add('bg-muted');
                                }}
                            />
                        ) : (
                            <ImageIcon className="h-6 w-6 text-muted-foreground" />
                        )}
                    </div>
                </div>

                <div className="font-medium flex-1 w-full md:w-auto overflow-hidden text-ellipsis whitespace-nowrap">
                    <div className="truncate">{product.name}</div>
                    {product.is_active === false && (
                        <Badge variant="destructive" className="mt-1 text-[10px] px-1 py-0 h-4">Inactive</Badge>
                    )}
                </div>

                <div className="text-sm text-muted-foreground w-full md:w-auto truncate md:text-left text-left">
                    {product.category_name || 'Uncategorized'}
                </div>

                <div
                    className={`text-sm md:text-left text-left w-full md:w-auto cursor-pointer p-2 -ml-2 rounded-md hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 ${product.quantity < 10 ? "text-red-500 font-medium" : "text-green-600 font-medium"}`}
                    onClick={(e) => { e.stopPropagation(); onStockClick?.(); }}
                >
                    {product.quantity} {product.unit}
                </div>

                <div className="text-right w-full md:w-auto flex flex-row md:flex-col justify-between md:justify-center items-center md:items-end">
                    <span className="md:hidden text-muted-foreground text-sm">Price:</span>
                    <div
                        className="cursor-pointer p-2 -mr-2 rounded-md hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10"
                        onClick={(e) => { e.stopPropagation(); onPriceClick?.(); }}
                    >
                        <div className="font-bold">₹{Number(product.price).toFixed(2)}</div>
                        {product.original_price && Number(product.original_price) > Number(product.price) && (
                            <div className="text-xs text-muted-foreground line-through">
                                ₹{Number(product.original_price).toFixed(2)}
                            </div>
                        )}
                    </div>
                </div>

                <div className="text-center absolute top-4 right-14 md:static md:w-auto">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onToggleFeatured?.(product)}
                        className={`${product.is_featured ? "text-yellow-500" : "text-gray-300"} hover:text-yellow-600 hover:bg-transparent`}
                    >
                        <Star className="h-5 w-5" fill={product.is_featured ? "currentColor" : "none"} />
                    </Button>
                </div>

                <div className="absolute top-4 right-4 md:static md:w-auto">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (onEdit) onEdit(product);
                                    else router.push(`/dashboard/products/edit?id=${product.id}`);
                                }}
                            >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleSelectionMode && onToggleSelectionMode();
                                    onToggleSelect && onToggleSelect(product.id);
                                }}
                            >
                                <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                Select
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete?.(product);
                                }}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </div>
    );
}
