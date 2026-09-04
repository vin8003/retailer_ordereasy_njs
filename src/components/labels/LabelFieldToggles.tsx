"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { LabelFieldFlags } from "@/lib/labelPrint";

export const FIELD_TOGGLE_ITEMS: { key: keyof LabelFieldFlags; label: string }[] = [
  { key: "shopName", label: "Store name" },
  { key: "productName", label: "Product name" },
  { key: "mrp", label: "MRP" },
  { key: "sellingPrice", label: "Selling price" },
  { key: "weight", label: "Weight / quantity" },
  { key: "packingDate", label: "Packing date" },
  { key: "expiryDate", label: "Expiry date" },
  { key: "barcode", label: "Barcode" },
];

interface LabelFieldTogglesProps {
  fields: LabelFieldFlags;
  onChange: (fields: LabelFieldFlags) => void;
}

export function LabelFieldToggles({ fields, onChange }: LabelFieldTogglesProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {FIELD_TOGGLE_ITEMS.map((item) => (
        <div key={item.key} className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2">
          <Label htmlFor={`label-field-${item.key}`} className="text-xs font-medium">
            {item.label}
          </Label>
          <Switch
            id={`label-field-${item.key}`}
            checked={fields[item.key]}
            onCheckedChange={(checked) => onChange({ ...fields, [item.key]: checked })}
          />
        </div>
      ))}
    </div>
  );
}
