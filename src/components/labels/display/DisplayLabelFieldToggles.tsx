"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { DisplayLabelFieldFlags } from "@/lib/labelPrint";

interface DisplayLabelFieldTogglesProps {
  fields: DisplayLabelFieldFlags;
  onChange: (fields: DisplayLabelFieldFlags) => void;
}

export function DisplayLabelFieldToggles({ fields, onChange }: DisplayLabelFieldTogglesProps) {
  const toggle = (key: keyof DisplayLabelFieldFlags) => {
    onChange({ ...fields, [key]: !fields[key] });
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
    <div className="flex flex-wrap gap-4 rounded-md border p-4 bg-muted/20">
      {ITEMS.map(({ key, label }) => (
        <div key={key} className="flex items-center space-x-2">
          <Checkbox id={key} checked={fields[key]} onCheckedChange={() => toggle(key)} />
          <Label htmlFor={key} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
            {label}
          </Label>
        </div>
      ))}
    </div>
  );
}
