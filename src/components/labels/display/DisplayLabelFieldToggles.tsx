"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { DisplayLabelFieldFlags } from "@/lib/labelPrint";

interface DisplayLabelFieldTogglesProps {
  fields: DisplayLabelFieldFlags;
  onChange: (fields: DisplayLabelFieldFlags) => void;
}

export function DisplayLabelFieldToggles({ fields, onChange }: DisplayLabelFieldTogglesProps) {
  const toggle = (key: keyof DisplayLabelFieldFlags, checked: boolean) => {
    onChange({ ...fields, [key]: checked });
  };

  const ITEMS: { key: keyof DisplayLabelFieldFlags; label: string }[] = [
    { key: "productName", label: "Product Name" },
    { key: "mrp", label: "MRP" },
    { key: "sellingPrice", label: "Selling Price" },
    { key: "savings", label: "Savings" },
    { key: "discount", label: "Discount %" },
    { key: "barcode", label: "Barcode" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 rounded-md border p-4 bg-muted/20">
      {ITEMS.map(({ key, label }) => (
        <div key={key} className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 bg-background">
          <Label htmlFor={key} className="text-xs font-medium cursor-pointer">
            {label}
          </Label>
          <Switch
            id={key}
            checked={fields[key]}
            onCheckedChange={(checked) => toggle(key, checked)}
          />
        </div>
      ))}
    </div>
  );
}
