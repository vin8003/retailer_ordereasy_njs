"use client";

import { useRouter } from "next/navigation";
import { Edit, Trash2, MoreHorizontal, ImageIcon } from "lucide-react";

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
}

interface ProductTableProps {
    products: Product[];
    isLoading: boolean;
    onDelete?: (product: Product) => void;
}

export function ProductTable({ products, isLoading, onDelete }: ProductTableProps) {
    const router = useRouter();

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground">Loading products...</div>;
    }

    if (products.length === 0) {
        return <div className="p-8 text-center text-muted-foreground">No products found.</div>;
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[80px]">Image</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {products.map((product) => (
                        <TableRow key={product.id}>
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
                                            onClick={() => router.push(`/dashboard/products/${product.id}/edit`)}
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
    );
}
