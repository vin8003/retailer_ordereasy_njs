import { FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
    getEInvoiceAckDateLabel,
    type EInvoiceAckDateDisplay,
} from "@/utils/eInvoiceAckDate";

/** Thin e-invoice panel. Renders nothing when BE omitted `ack_date`. */
export function EInvoicePanel({
    invoice,
    className,
}: {
    invoice: EInvoiceAckDateDisplay;
    className?: string;
}) {
    const ackDate = getEInvoiceAckDateLabel(invoice);
    if (!ackDate) return null;

    return (
        <Card className={cn(className)}>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" /> E-Invoice
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div
                    aria-label={`E-invoice acknowledgement date ${ackDate}`}
                    className="text-sm text-muted-foreground font-normal truncate"
                >
                    Ack date {ackDate}
                </div>
            </CardContent>
        </Card>
    );
}
