"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { productService } from "@/services/api";
import { ArrowLeft, Save, CheckCircle, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// Simple Debounce hook
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

export default function SessionReviewPage() {
    const router = useRouter();
    const params = useParams();
    const [isLoading, setIsLoading] = useState(true);
    const [session, setSession] = useState<any>(null);
    const [matchedItems, setMatchedItems] = useState<any[]>([]);
    const [unmatchedItems, setUnmatchedItems] = useState<any[]>([]);
    const [modifiedItems, setModifiedItems] = useState<Set<number>>(new Set());
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadSession();
    }, [params]);

    const loadSession = async () => {
        setIsLoading(true);
        try {
            const id = Number(params?.id);
            if (!id) throw new Error("Invalid Session ID");
            const response = await productService.getSessionDetails(id);
            const { session, matched_items, unmatched_items } = response.data;

            // Hydrate items logic (similar to Flutter)
            const hydrate = (items: any[]) => items.map(item => {
                // Ensure product_details has essential fields from uiData if missing
                const details = item.product_details || {};
                const uiData = item.uiData || {};

                return {
                    ...item,
                    product_details: {
                        ...details,
                        name: details.name || uiData.name || "",
                        price: details.price || "",
                        original_price: details.original_price || "",
                        quantity: details.quantity || "",
                        brand: details.brand || uiData.brand || "",
                        category: details.category || uiData.category || "",
                    }
                };
            });

            setSession(session);
            setMatchedItems(hydrate(matched_items));
            setUnmatchedItems(hydrate(unmatched_items));
            setModifiedItems(new Set()); // Reset modifications on reload
        } catch (err: any) {
            toast.error("Failed to load session details");
            router.push('/dashboard/products/bulk');
        } finally {
            setIsLoading(false);
        }
    };

    const handleItemChange = (id: number, field: string, value: any, isMatched: boolean) => {
        const updateList = (items: any[]) => items.map(item => {
            if (item.id === id) {
                return {
                    ...item,
                    product_details: {
                        ...item.product_details,
                        [field]: value
                    }
                };
            }
            return item;
        });

        if (isMatched) {
            setMatchedItems(prev => updateList(prev));
        } else {
            setUnmatchedItems(prev => updateList(prev));
        }

        setModifiedItems(prev => new Set(prev).add(id));
    };

    const handleSaveDraft = async () => {
        if (modifiedItems.size === 0) return;
        setIsSaving(true);
        try {
            const id = Number(params?.id);
            const allItems = [...matchedItems, ...unmatchedItems];
            const itemsToUpdate = allItems
                .filter(i => modifiedItems.has(i.id))
                .map(i => ({ id: i.id, product_details: i.product_details }));

            await productService.updateSessionItems(id, itemsToUpdate);
            toast.success("Draft saved successfully");
            setModifiedItems(new Set());
        } catch (error) {
            toast.error("Failed to save draft");
        } finally {
            setIsSaving(false);
        }
    };

    const handleCommit = async () => {
        setIsSaving(true);
        try {
            // First save everything explicitly to ensure backend states match UI
            const id = Number(params?.id);
            const allItems = [...matchedItems, ...unmatchedItems];
            const itemsToUpdate = allItems.map(i => ({ id: i.id, product_details: i.product_details }));

            if (itemsToUpdate.length > 0) {
                await productService.updateSessionItems(id, itemsToUpdate);
            }

            // Commit
            const result = await productService.commitSession(id);
            toast.success(`Session finalized! Created: ${result.data.created_count}, Updated: ${result.data.updated_count}`);
            router.push('/dashboard/products');
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed to finalize session");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="p-8 text-center">Loading session details...</div>;
    if (!session) return null;

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Session #{session.id}</h2>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Smartphone className="h-4 w-4" />
                            <span>Scanner Upload</span>
                            <span>•</span>
                            <span>{new Date(session.created_at).toLocaleString()}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {modifiedItems.size > 0 && (
                        <Button variant="outline" onClick={handleSaveDraft} disabled={isSaving}>
                            <Save className="h-4 w-4 mr-2" />
                            Save Draft ({modifiedItems.size})
                        </Button>
                    )}
                </div>
            </div>

            <Tabs defaultValue={unmatchedItems.length > 0 ? "unmatched" : "matched"}>
                <TabsList className="grid w-full max-w-[400px] grid-cols-2">
                    <TabsTrigger value="unmatched" className="relative">
                        Unmatched
                        <Badge variant="secondary" className="ml-2 bg-orange-100 text-orange-700 hover:bg-orange-100">{unmatchedItems.length}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="matched">
                        Matched
                        <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700 hover:bg-green-100">{matchedItems.length}</Badge>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="unmatched" className="space-y-4 mt-6">
                    {unmatchedItems.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">No unmatched items. Great job!</div>
                    ) : (
                        unmatchedItems.map(item => (
                            <SessionItemCard
                                key={item.id}
                                item={item}
                                isMatched={false}
                                onChange={(field, val) => handleItemChange(item.id, field, val, false)}
                            />
                        ))
                    )}
                </TabsContent>

                <TabsContent value="matched" className="space-y-4 mt-6">
                    {matchedItems.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">No matched items yet.</div>
                    ) : (
                        matchedItems.map(item => (
                            <SessionItemCard
                                key={item.id}
                                item={item}
                                isMatched={true}
                                onChange={(field, val) => handleItemChange(item.id, field, val, true)}
                            />
                        ))
                    )}
                </TabsContent>
            </Tabs>

            {/* Sticky Footer */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t flex justify-end gap-4 shadow-lg md:pl-64 z-50">
                <Button size="lg" onClick={handleCommit} disabled={isSaving} className="w-full md:w-auto min-w-[200px]">
                    {isSaving ? "Processing..." : "Finalize & Import to Catalog"}
                </Button>
            </div>
        </div>
    );
}

function SessionItemCard({ item, isMatched, onChange }: { item: any, isMatched: boolean, onChange: (field: string, val: any) => void }) {
    const details = item.product_details;
    const imageUrl = item.image || item.uiData?.image || item.uiData?.image_url;

    return (
        <Card>
            <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Image */}
                    <div className="w-24 h-24 bg-muted rounded-md flex-shrink-0 relative overflow-hidden border">
                        {imageUrl ? (
                            <img src={imageUrl} alt={details.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="flex items-center justify-center h-full text-xs text-muted-foreground">No Image</div>
                        )}
                    </div>

                    <div className="flex-1 space-y-4">
                        {/* Header Info */}
                        <div>
                            <h4 className="font-semibold text-lg">{details.name || "Unknown Product"}</h4>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                <span className="font-mono bg-muted px-2 py-0.5 rounded">{item.barcode}</span>
                                {details.brand && <span>{details.brand}</span>}
                            </div>
                        </div>

                        <Separator />

                        {/* Editable Fields */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div className="md:col-span-1">
                                <Label className="text-xs">Product Name</Label>
                                <Input
                                    value={details.name}
                                    onChange={(e) => onChange('name', e.target.value)}
                                    className="h-8 text-sm"
                                />
                            </div>
                            <div>
                                <Label className="text-xs">Selling Price</Label>
                                <Input
                                    type="number"
                                    value={details.price}
                                    onChange={(e) => onChange('price', e.target.value)}
                                    className="h-8 text-sm"
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <Label className="text-xs">MRP</Label>
                                <Input
                                    type="number"
                                    value={details.original_price}
                                    onChange={(e) => onChange('original_price', e.target.value)}
                                    className="h-8 text-sm"
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <Label className="text-xs">Stock Qty</Label>
                                <Input
                                    type="number"
                                    value={details.quantity}
                                    onChange={(e) => onChange('quantity', e.target.value)}
                                    className="h-8 text-sm"
                                    placeholder="0"
                                />
                            </div>
                            <div>
                                <Label className="text-xs">Category</Label>
                                <Input
                                    value={details.category}
                                    onChange={(e) => onChange('category', e.target.value)}
                                    className="h-8 text-sm"
                                    placeholder="Category"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
