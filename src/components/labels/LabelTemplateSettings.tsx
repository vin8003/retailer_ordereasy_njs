"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LABEL_SIZES } from "@/lib/labelPrint";
import type { BarcodeFormat, ColumnCount, LabelSizeId, LabelTemplatePrefs } from "@/lib/labelPrint";
import { LabelFieldToggles } from "./LabelFieldToggles";

interface LabelTemplateSettingsProps {
  prefs: LabelTemplatePrefs;
  onChange: (prefs: LabelTemplatePrefs) => void;
}

export function LabelTemplateSettings({ prefs, onChange }: LabelTemplateSettingsProps) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>Label size</Label>
          <Select
            value={prefs.sizeId}
            onValueChange={(value) => onChange({ ...prefs, sizeId: value as LabelSizeId })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LABEL_SIZES.map((size) => (
                <SelectItem key={size.id} value={size.id}>
                  {size.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Columns</Label>
          <Select
            value={String(prefs.columns)}
            onValueChange={(value) => onChange({ ...prefs, columns: Number(value) as ColumnCount })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1-column roll</SelectItem>
              <SelectItem value="2">2-column roll</SelectItem>
              <SelectItem value="3">3-column roll</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Barcode format</Label>
          <Select
            value={prefs.barcodeFormat}
            onValueChange={(value) => onChange({ ...prefs, barcodeFormat: value as BarcodeFormat })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CODE128">Code 128</SelectItem>
              <SelectItem value="EAN13">EAN-13</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Default fields</Label>
        <LabelFieldToggles
          fields={prefs.fields}
          onChange={(fields) => onChange({ ...prefs, fields })}
        />
      </div>
    </div>
  );
}
