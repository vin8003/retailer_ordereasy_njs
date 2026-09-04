"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, Plus, Printer, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { LabelPreview } from "@/components/labels/LabelPreview";
import { LabelFieldToggles } from "@/components/labels/LabelFieldToggles";
import { LabelTemplateSettings } from "@/components/labels/LabelTemplateSettings";
import { PrintSetupHint } from "@/components/labels/PrintSetupHint";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authService, productService } from "@/services/api";
import {
  DEFAULT_LABEL_FIELDS,
  addProductToPrintList,
  buildLabelPrintDocument,
  consumePrintProductIds,
  loadLabelPrefs,
  parsePrintProductIds,
  printLabelDocument,
  removePrintListItem,
  saveLabelPrefs,
  totalLabelCount,
  updatePrintListItem,
} from "@/lib/labelPrint";
import type { CatalogProduct } from "@/lib/labelPrint/printList";
import type { LabelTemplatePrefs, PrintLabelItem } from "@/lib/labelPrint";

function resolvePrintQuery(searchParams: ReturnType<typeof useSearchParams>) {
  const read = (raw: string | null) => {
    if (!raw) return { productId: null as string | null, ids: null as string | null };
    const q = raw.startsWith("?") ? raw : `?${raw}`;
    const params = new URLSearchParams(q.split("#")[0]);
    return {
      productId: params.get("productId") || params.get("id"),
      ids: params.get("ids"),
    };
  };

  if (typeof window !== "undefined") {
    const fromOe = read((window as unknown as { __OE_SEARCH?: string }).__OE_SEARCH ?? null);
    if (fromOe.productId || fromOe.ids) return fromOe;
    const fromLoc = read(window.location.search);
    if (fromLoc.productId || fromLoc.ids) return fromLoc;
  }

  return {
    productId: searchParams.get("productId") || searchParams.get("id"),
    ids: searchParams.get("ids"),
  };
}

const SAMPLE_ITEM: PrintLabelItem = {
  id: 0,
  name: "Sample Product",
  barcode: "8901234567890",
  mrp: 120,
  price: 99,
  unit: "kg",
  weightLabel: "1kg",
  packingDate: "2026-09-04",
  expiryDate: "2027-03-04",
  quantity: 1,
  fields: { ...DEFAULT_LABEL_FIELDS, weight: true, packingDate: true, expiryDate: true },
};

function PrintLabelsContent() {
  const searchParams = useSearchParams();
  const [prefs, setPrefs] = useState<LabelTemplatePrefs>(() => loadLabelPrefs());
  const [shopName, setShopName] = useState("Your Store");
  const [list, setList] = useState<PrintLabelItem[]>([]);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<CatalogProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSeeding, setIsSeeding] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    saveLabelPrefs(prefs);
  }, [prefs]);

  useEffect(() => {
    authService.fetchProfile()
      .then((response) => {
        const data = response.data;
        setShopName(data?.shop_name || data?.user?.shop_name || "Your Store");
      })
      .catch(() => {
        /* keep fallback */
      });
  }, []);

  const seedFromIds = useCallback(async (ids: number[]) => {
    if (ids.length === 0) return;
    const loaded: CatalogProduct[] = [];
    for (const id of ids) {
      try {
        const response = await productService.fetchProductDetails(id);
        if (response.data) loaded.push(response.data);
      } catch {
        /* skip missing products */
      }
    }
    setList((current) => {
      let next = current;
      for (const product of loaded) {
        if (next.some((item) => item.id === product.id)) continue;
        next = addProductToPrintList(next, product, prefs.fields);
      }
      return next;
    });
    if (loaded[0]) setSelectedId(loaded[0].id);
  }, [prefs.fields]);

  useEffect(() => {
    const query = resolvePrintQuery(searchParams);
    const queued = consumePrintProductIds();
    const ids = [...parsePrintProductIds(query.productId, query.ids), ...queued];
    seedFromIds(ids).finally(() => setIsSeeding(false));
    // Mount only — do not re-run when Next wipes/restores searchParams.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const handleAdd = (product: CatalogProduct) => {
    setList((current) => addProductToPrintList(current, product, prefs.fields));
    setSelectedId(product.id);
    setSearch("");
    setResults([]);
  };

  const handlePrintAll = () => {
    if (list.length === 0 || totalLabelCount(list) === 0) {
      toast.error("Add at least one product to the print list");
      return;
    }
    const html = buildLabelPrintDocument({ shopName, prefs, items: list });
    printLabelDocument(html);
  };

  const handlePrefsChange = (nextPrefs: LabelTemplatePrefs) => {
    const fieldsChanged = JSON.stringify(prefs.fields) !== JSON.stringify(nextPrefs.fields);
    setPrefs(nextPrefs);
    // Size / columns / barcode format must not wipe per-row field overrides.
    if (fieldsChanged) {
      setList((current) => current.map((item) => ({ ...item, fields: { ...nextPrefs.fields } })));
    }
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Print Labels</h2>
          <p className="text-muted-foreground">
            Search products, choose what prints on each sticker, then send a browser print job.
          </p>
        </div>
        <Button onClick={handlePrintAll} disabled={totalLabelCount(list) === 0}>
          <Printer className="h-4 w-4" />
          Print All ({totalLabelCount(list)})
        </Button>
      </div>

      <PrintSetupHint />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Tabs defaultValue="list" className="min-w-0">
          <TabsList>
            <TabsTrigger value="list">Print list</TabsTrigger>
            <TabsTrigger value="templates">Label templates</TabsTrigger>
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
                  {results.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      className="flex w-full items-center justify-between gap-3 border-t px-4 py-3 text-left hover:bg-muted/60 first:border-t-0"
                      onClick={() => handleAdd(product)}
                    >
                      <div>
                        <div className="text-sm font-medium">{product.name}</div>
                        <div className="text-xs text-muted-foreground">
                          ₹{product.price} {product.barcode ? `· ${product.barcode}` : ""}
                        </div>
                      </div>
                      <Plus className="h-4 w-4 text-primary" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {isSeeding ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-4 animate-spin" /> Loading products...
              </div>
            ) : list.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Search and add products to build a print list.
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
                            onChange={(e) =>
                              setList((current) =>
                                updatePrintListItem(current, item.id, { quantity: Number(e.target.value) }),
                              )
                            }
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Remove ${item.name}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setList((current) => removePrintListItem(current, item.id));
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Weight / qty</Label>
                          <Input
                            placeholder={item.unit || "500g"}
                            value={item.weightLabel}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) =>
                              setList((current) =>
                                updatePrintListItem(current, item.id, { weightLabel: e.target.value }),
                              )
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Packing date</Label>
                          <Input
                            type="date"
                            value={item.packingDate}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) =>
                              setList((current) =>
                                updatePrintListItem(current, item.id, { packingDate: e.target.value }),
                              )
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Expiry date</Label>
                          <Input
                            type="date"
                            value={item.expiryDate}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) =>
                              setList((current) =>
                                updatePrintListItem(current, item.id, { expiryDate: e.target.value }),
                              )
                            }
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
                        <LabelFieldToggles
                          fields={item.fields}
                          onChange={(fields) =>
                            setList((current) => updatePrintListItem(current, item.id, { fields }))
                          }
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
                <CardTitle>Barcode preferences</CardTitle>
                <CardDescription>
                  Sticker size, roll columns, barcode format, and the default fields for new labels.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LabelTemplateSettings prefs={prefs} onChange={handlePrefsChange} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Live preview</h3>
          <LabelPreview
            item={previewItem}
            shopName={shopName}
            sizeId={prefs.sizeId}
            barcodeFormat={prefs.barcodeFormat}
          />
          <p className="text-xs text-muted-foreground">
            Preview updates as you toggle fields, dates, and template size. Print All uses the browser
            print dialog — no PDF is generated on the server.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PrintLabelsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading print labels...</div>}>
      <PrintLabelsContent />
    </Suspense>
  );
}
