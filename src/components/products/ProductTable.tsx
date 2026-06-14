"use client";

import { useRouter } from "next/navigation";
import { Edit, Trash2, MoreHorizontal, ImageIcon, Star } from "lucide-react";
import { cn } from "@/lib/utils";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
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

interface ProductTableProps {
    products: Product[];
    isLoading: boolean;
    onDelete?: (product: Product) => void;
    onToggleFeatured?: (product: Product) => void;
    onEdit?: (product: Product) => void;
    highlightedProductId?: number | null;
}

export function ProductTable({ products, isLoading, onDelete, onToggleFeatured, onEdit, highlightedProductId }: ProductTableProps) {
    const router = useRouter();

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground">Loading products...</div>;
    }

    if (products.length === 0) {
        return <div className="p-8 text-center text-muted-foreground">No products found.</div>;
    }

    return (
        <div className="space-y-4">
            {/* Desktop Table View */}
            <div className="hidden md:block rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[80px]">Image</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Stock</TableHead>
                            <TableHead className="text-right">Price</TableHead>
                            <TableHead className="text-center w-[100px]">Featured</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {products.map((product) => (
                            <TableRow
                                key={product.id}
                                className={highlightedProductId === product.id ? "bg-green-100/50 dark:bg-green-900/30 transition-colors duration-500" : "transition-colors duration-500"}
                            >
                                <TableCell>
                                    <div className="h-12 w-12 rounded bg-muted flex items-center justify-center overflow-hidden">
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
                                </TableCell>
                                <TableCell className="font-medium">
                                    <div>{product.name}</div>
                                    {product.is_active === false && (
                                        <Badge variant="destructive" className="mt-1 text-[10px] px-1 py-0 h-4">Inactive</Badge>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {product.category_name || 'Uncategorized'}
                                </TableCell>
                                <TableCell>
                                    <div className={product.quantity < 10 ? "text-red-500 font-medium" : "text-green-600 font-medium"}>
                                        {product.quantity} {product.unit}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="font-bold">₹{Number(product.price).toFixed(2)}</div>
                                    {product.original_price && Number(product.original_price) > Number(product.price) && (
                                        <div className="text-xs text-muted-foreground line-through">
                                            ₹{Number(product.original_price).toFixed(2)}
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell className="text-center">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onToggleFeatured?.(product)}
                                        className={`${product.is_featured ? "text-yellow-500" : "text-gray-300"} hover:text-yellow-600 hover:bg-transparent`}
                                    >
                                        <Star className="h-5 w-5" fill={product.is_featured ? "currentColor" : "none"} />
                                    </Button>
                                </TableCell>
                                <TableCell>
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
                                                onClick={() => {
                                                    if (onEdit) {
                                                        onEdit(product);
                                                    } else {
                                                        router.push(`/dashboard/products/edit?id=${product.id}`);
                                                    }
                                                }}
                                            >
                                                <Edit className="mr-2 h-4 w-4" />
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                className="text-red-600 focus:text-red-600"
                                                onClick={() => onDelete?.(product)}
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Mobile Card List View */}
            <div className="block md:hidden space-y-3">
                {products.map((product) => (
                    <div
                        key={product.id}
                        className={cn(
                            "bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex gap-3 relative transition-all duration-300",
                            highlightedProductId === product.id && "bg-green-50/50 border-green-200"
                        )}
                    >
                        {/* Image Thumbnail */}
                        <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0 border border-gray-100 shadow-sm">
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
                                <ImageIcon className="h-5 w-5 text-muted-foreground" />
                            )}
                        </div>

                        {/* Card Info */}
                        <div className="flex-1 flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start gap-1.5">
                                    <span className="font-bold text-gray-800 text-sm line-clamp-1 leading-snug">{product.name}</span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onToggleFeatured?.(product)}
                                        className={cn("h-6 w-6 text-gray-300 shrink-0 hover:bg-transparent -mt-1 -mr-1", product.is_featured && "text-yellow-500")}
                                    >
                                        <Star className="h-4 w-4" fill={product.is_featured ? "currentColor" : "none"} />
                                    </Button>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] text-muted-foreground font-semibold uppercase">{product.category_name || 'Uncategorized'}</span>
                                    {product.is_active === false && (
                                        <Badge variant="destructive" className="text-[8px] px-1 py-0 h-3 leading-none font-bold">Inactive</Badge>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-between items-end mt-2 pt-2 border-t border-gray-50/80">
                                <div className="flex flex-col">
                                    <span className="text-xs text-muted-foreground font-semibold">Stock level</span>
                                    <span className={cn("text-xs font-bold mt-0.5", product.quantity < 10 ? "text-red-500" : "text-green-600")}>
                                        {product.quantity} {product.unit}
                                    </span>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] text-muted-foreground font-semibold">Selling Price</span>
                                    <div className="flex items-baseline gap-1 mt-0.5">
                                        <span className="font-extrabold text-[15px] text-gray-900">₹{Number(product.price).toFixed(2)}</span>
                                        {product.original_price && Number(product.original_price) > Number(product.price) && (
                                            <span className="text-[10px] text-muted-foreground line-through">₹{Number(product.original_price).toFixed(0)}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions Overlay / Menu */}
                        <div className="absolute right-3 top-8">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-7 w-7 p-0 shrink-0 text-gray-400">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                        onClick={() => {
                                            if (onEdit) {
                                                onEdit(product);
                                            } else {
                                                router.push(`/dashboard/products/edit?id=${product.id}`);
                                            }
                                        }}
                                    >
                                        <Edit className="mr-2 h-4 w-4" /> Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        className="text-red-600 focus:text-red-600"
                                        onClick={() => onDelete?.(product)}
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
