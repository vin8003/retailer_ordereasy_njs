"use client";

import { useState } from "react";
import { Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrintPaperSize, getLabelSize } from "@/lib/labelPrint";
import type { LabelTemplatePrefs } from "@/lib/labelPrint";

interface PrintSetupHintProps {
  prefs: LabelTemplatePrefs;
}

export function PrintSetupHint({ prefs }: PrintSetupHintProps) {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const paperSize = formatPrintPaperSize(prefs.sizeId, prefs.columns);
  const sticker = getLabelSize(prefs.sizeId);
  const multiColumn = prefs.columns > 1;

  return (
    <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
      <div className="flex-1 space-y-1.5">
        <p>
          In the browser print dialog: set <strong>Scale to 100%</strong> (not &quot;Fit to
          page&quot;), margins to <strong>None</strong>, and turn off{" "}
          <strong>Headers and footers</strong>. Leave orientation at <strong>default</strong>{" "}
          (do not force landscape).
        </p>
        <p>
          Paper / custom size: <strong>{paperSize}</strong>
          {multiColumn ? (
            <>
              {" "}
              — this is the full {prefs.columns}-column row width ({sticker.widthMm *
                prefs.columns}
              mm), not a single {sticker.widthMm}mm sticker.
            </>
          ) : null}{" "}
          Set this in the TVS driver too (Printing Preferences → Page Setup → custom paper size).
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Dismiss print setup hint"
        onClick={() => setVisible(false)}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
