"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, Plus, Printer, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { DisplayLabelPreview } from "@/components/labels/display/DisplayLabelPreview";
import { DisplayLabelFieldToggles } from "@/components/labels/display/DisplayLabelFieldToggles";
import { DisplayLabelSettings } from "@/components/labels/display/DisplayLabelSettings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { productService } from "@/services/api";
import {
  DEFAULT_DISPLAY_LABEL_FIELDS,
  DEFAULT_DISPLAY_LABEL_PREFS,
  buildDisplayLabelPrintDocument,
  printLabelDocument,
  resolveProductBarcode,
} from "@/lib/labelPrint";
import type { CatalogProduct } from "@/lib/labelPrint/printList";
import type { DisplayLabelItem, DisplayLabelTemplatePrefs, DisplayLabelFieldFlags } from "@/lib/labelPrint";

const SAMPLE_ITEM: DisplayLabelItem = {
  id: 0,
  name: "Sample Product",
  barcode: "8901234567890",
  mrp: 120,
  price: 99,
  quantity: 1,
  fields: { ...DEFAULT_DISPLAY_LABEL_FIELDS },
  savingsOverride: "Save ₹21",
  discountOverride: "18% OFF",
};

function calculatePromo(mrp: number, price: number) {
  const savings = Math.max(0, mrp - price);
  const discount = mrp > 0 ? Math.round((savings / mrp) * 100) : 0;
  return {
    savingsOverride: savings > 0 ? `Save ₹${savings}` : "",
    discountOverride: discount > 0 ? `${discount}% OFF` : "",
  };
}

function DisplayLabelsContent() {
  // Using basic local state for prefs since it's a new feature. We can add localStorage later.
  const [prefs, setPrefs] = useState<DisplayLabelTemplatePrefs>(DEFAULT_DISPLAY_LABEL_PREFS);
  const [list, setList] = useState<DisplayLabelItem[]>([]);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<CatalogProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    const query = search.trim();
    if (!query) {
      setResults([]);
      return;
    }
    const handle = window.setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await productService.searchProducts(query);
        const data = response.data;
        const rows: CatalogProduct[] = Array.isArray(data) ? data : data?.results || [];
        setResults(rows);
      } catch {
        toast.error("Failed to search products");
      } finally {
        setIsSearching(false);
      }
    }, 250);
    return () => window.clearTimeout(handle);
  }, [search]);

  const selectedItem = list.find((item) => item.id === selectedId) || list[0] || null;
  const previewItem = useMemo(() => {
    if (selectedItem) return selectedItem;
    return { ...SAMPLE_ITEM, fields: { ...SAMPLE_ITEM.fields, ...prefs.fields } };
  }, [selectedItem, prefs.fields]);

  const handleAdd = async (product: CatalogProduct) => {
    let catalogProduct = product;
    if (!resolveProductBarcode(product) || product.original_price == null) {
      try {
        const response = await productService.fetchProductDetails(product.id);
        const detail = response.data as CatalogProduct | undefined;
        if (detail?.id) catalogProduct = { ...product, ...detail };
      } catch {
        // keep search row
      }
    }

    const mrp = catalogProduct.original_price ? Number(catalogProduct.original_price) : Number(catalogProduct.price);
    const price = Number(catalogProduct.price);
    const promo = calculatePromo(mrp, price);

    const newItem: DisplayLabelItem = {
      id: catalogProduct.id,
      name: catalogProduct.name,
      barcode: resolveProductBarcode(catalogProduct) || "",
      mrp: catalogProduct.original_price || null,
      price: catalogProduct.price ?? 0,
      quantity: 1, // Default 1 for display labels
      fields: { ...prefs.fields },
      savingsOverride: promo.savingsOverride,
      discountOverride: promo.discountOverride,
    };

    setList((current) => {
      if (current.some(item => item.id === newItem.id)) return current;
      return [newItem, ...current];
    });
    setSelectedId(catalogProduct.id);
    setSearch("");
    setResults([]);
  };

  const handlePrintAll = () => {
    if (list.length === 0) {
      toast.error("Add at least one product to the print list");
      return;
    }
    const html = buildDisplayLabelPrintDocument({ prefs, items: list });
    printLabelDocument(html);
  };

  const updateItem = (id: number, updates: Partial<DisplayLabelItem>) => {
    setList((current) => current.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  const removeItem = (id: number) => {
    setList((current) => current.filter((item) => item.id !== id));
  };

  const totalLabels = list.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Display Labels</h2>
          <p className="text-muted-foreground">
            Create rack labels to highlight prices and discounts. Search products and configure templates.
          </p>
        </div>
        <Button onClick={handlePrintAll} disabled={totalLabels === 0}>
          <Printer className="mr-2 h-4 w-4" />
          Print Labels ({totalLabels})
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Tabs defaultValue="list" className="min-w-0">
          <TabsList>
            <TabsTrigger value="list">Products list</TabsTrigger>
            <TabsTrigger value="templates">Templates & Setup</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products by name or barcode..."
                className="pl-9 py-6"
              />
              {(isSearching || results.length > 0 || (search && !isSearching)) && (
                <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border bg-card shadow-lg">
                  {isSearching && (
                    <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" /> Searching...
                    </div>
                  )}
                  {!isSearching && results.length === 0 && search.trim() && (
                    <div className="p-3 text-sm text-muted-foreground">No products found.</div>
                  )}
                  {results.map((product) => {
                    const code = resolveProductBarcode(product);
                    return (
                      <button
                        key={product.id}
                        type="button"
                        className="flex w-full items-center justify-between gap-3 border-t px-4 py-3 text-left hover:bg-muted/60 first:border-t-0"
                        onClick={() => handleAdd(product)}
                      >
                        <div>
                          <div className="text-sm font-medium">{product.name}</div>
                          <div className="text-xs text-muted-foreground">
                            ₹{product.price} {code ? `· ${code}` : ""}
                          </div>
                        </div>
                        <Plus className="h-4 w-4 text-primary" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {list.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Search and add products to design display labels.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {list.map((item) => (
                  <Card
                    key={item.id}
                    className={`py-4 ${selectedId === item.id ? "ring-2 ring-primary/40" : ""}`}
                    onClick={() => setSelectedId(item.id)}
                  >
                    <CardContent className="space-y-3 px-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold">{item.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {item.barcode || "No barcode"} · MRP {item.mrp ?? "—"} · ₹{item.price}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Label className="text-xs">Qty</Label>
                          <Input
                            type="number"
                            min={1}
                            className="h-9 w-20"
                            value={item.quantity}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => updateItem(item.id, { quantity: Number(e.target.value) })}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Remove ${item.name}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              removeItem(item.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Savings Text (Edit manually)</Label>
                          <Input
                            value={item.savingsOverride}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => updateItem(item.id, { savingsOverride: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Discount Text (Edit manually)</Label>
                          <Input
                            value={item.discountOverride}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => updateItem(item.id, { discountOverride: e.target.value })}
                          />
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedId((current) => (current === item.id ? null : item.id));
                        }}
                      >
                        {expandedId === item.id ? "Hide fields" : "Configure fields"}
                      </Button>
                      {expandedId === item.id && (
                        <DisplayLabelFieldToggles
                          fields={item.fields}
                          onChange={(fields) => updateItem(item.id, { fields })}
                        />
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="templates">
            <Card>
              <CardHeader>
                <CardTitle>Display Label settings</CardTitle>
                <CardDescription>
                  Choose between Thermal Rolls and A4 Grid layouts.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DisplayLabelSettings prefs={prefs} onChange={setPrefs} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Live preview</h3>
          <DisplayLabelPreview
            item={previewItem}
            sizeId={prefs.sizeId}
            barcodeFormat={prefs.barcodeFormat}
          />
          <p className="text-xs text-muted-foreground">
            Preview updates as you configure the label. A4 layouts will automatically print multiple labels in a grid.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function DisplayLabelsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading display labels...</div>}>
      <DisplayLabelsContent />
    </Suspense>
  );
}
