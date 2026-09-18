import { FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    getEInvoiceAckNoLabel,
    resolveEInvoiceAckSource,
    type EInvoiceAckDisplay,
} from "@/utils/eInvoiceAckNo";

/** Order-detail e-invoice card. Renders nothing when BE omitted `ack_no`. */
export function EInvoicePanel({
    invoice,
    className,
}: {
    invoice: EInvoiceAckDisplay;
    className?: string;
}) {
    const ackNo = getEInvoiceAckNoLabel(resolveEInvoiceAckSource(invoice));
    if (!ackNo) return null;

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" /> E-Invoice
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Ack No</span>
                    <span
                        aria-label={`Ack No ${ackNo}`}
                        className="font-medium tabular-nums"
                    >
                        {ackNo}
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}
