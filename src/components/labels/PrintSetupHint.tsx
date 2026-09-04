"use client";

import { useState } from "react";
import { Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintSetupHint() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
      <p className="flex-1">
        One-time printer setup: in the browser print dialog, set margins to <strong>None</strong> and
        uncheck <strong>Headers and footers</strong> so the sticker size matches the template.
      </p>
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
