#!/usr/bin/env node
// Dummy-only contract for Hermes desk mission msn_dummy_sku_remap.
// Do not point this at retailer.ordereasy.win / customer.ordereasy.win / api.ordereasy.win.

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

runDummyRepro();
