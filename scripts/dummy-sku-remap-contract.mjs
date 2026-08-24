#!/usr/bin/env node
// Dummy-only contract for Hermes desk mission msn_dummy_sku_remap.
// Do not point this at retailer.ordereasy.win / customer.ordereasy.win / api.ordereasy.win.
// Mirrors src/utils/productMatch.ts findProductByBarcode + POS scan pick.

const BARCODE = "8901234567890";

function remapCatalog(catalog, barcode, newSku) {
  return {
    ...catalog,
    barcodes: { ...catalog.barcodes, [barcode]: newSku },
    updatedAt: Date.now(),
  };
}

function searchCatalog(catalog, barcode) {
  const sku = catalog.barcodes[barcode];
  if (!sku) return null;
  const item = catalog.skus[sku];
  if (!item) return null;
  return { sku, ...item, updatedAt: catalog.updatedAt };
}

function findProductByBarcode(products, raw) {
  const code = String(raw || "").trim();
  if (!code) return undefined;
  const primary = products.find((p) => String(p.barcode || "") === code);
  if (primary) return primary;
  return products.find((p) => {
    const extras = Array.isArray(p.additional_barcodes) ? p.additional_barcodes : [];
    const batches = Array.isArray(p.batches) ? p.batches : [];
    const codes = [p.barcode, ...extras, ...batches.map((b) => b && b.barcode)].filter(Boolean).map(String);
    return codes.includes(code);
  });
}

function runDummyRepro() {
  let catalog = {
    updatedAt: 1,
    skus: {
      A: { name: "Old SKU A" },
      B: { name: "New SKU B" },
    },
    barcodes: { [BARCODE]: "A" },
  };
  catalog = remapCatalog(catalog, BARCODE, "B");
  const hit = searchCatalog(catalog, BARCODE);
  if (!hit || hit.sku !== "B") {
    throw new Error(`stale search: expected SKU B, got ${hit && hit.sku}`);
  }
  console.log("PASS dummy remap → search returns SKU B");
}

function runDashboardRepro() {
  const products = [
    { id: 1, sku: "A", name: "Old SKU A", barcode: "OTHER", additional_barcodes: [BARCODE], batches: [{ barcode: BARCODE }] },
    { id: 2, sku: "B", name: "New SKU B", barcode: BARCODE, additional_barcodes: [], batches: [] },
  ];
  const firstMatch = products.find((p) => {
    const extras = p.additional_barcodes || [];
    const batches = (p.batches || []).map((b) => b.barcode);
    return [p.barcode, ...extras, ...batches].includes(BARCODE);
  });
  if (!firstMatch || firstMatch.sku !== "A") {
    throw new Error("setup: naive first-match should still be SKU A");
  }
  const hit = findProductByBarcode(products, BARCODE);
  if (!hit || hit.sku !== "B") {
    throw new Error(`stale dashboard search: expected SKU B, got ${hit && hit.sku}`);
  }
  console.log("PASS dummy remap → dashboard helper returns SKU B");
}

runDummyRepro();
runDashboardRepro();
