"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DISPLAY_LABEL_SIZES } from "@/lib/labelPrint";
import type { BarcodeFormat, DisplayLabelSizeId, DisplayLabelTemplatePrefs } from "@/lib/labelPrint";
import { DisplayLabelFieldToggles } from "./DisplayLabelFieldToggles";

interface DisplayLabelSettingsProps {
  prefs: DisplayLabelTemplatePrefs;
  onChange: (prefs: DisplayLabelTemplatePrefs) => void;
}

export function DisplayLabelSettings({ prefs, onChange }: DisplayLabelSettingsProps) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Label size</Label>
          <Select
            value={prefs.sizeId}
            onValueChange={(value) => onChange({ ...prefs, sizeId: value as DisplayLabelSizeId })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DISPLAY_LABEL_SIZES.map((size) => (
                <SelectItem key={size.id} value={size.id}>
                  {size.label}
                </SelectItem>
              ))}
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
        <DisplayLabelFieldToggles
          fields={prefs.fields}
          onChange={(fields) => onChange({ ...prefs, fields })}
        />
      </div>
    </div>
  );
}
