import { Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSupplierEmailLabel, type SupplierListEmailDisplay } from "@/utils/supplierListEmail";

/** Contact-details email row. Renders nothing when BE omitted or blanked `email`. */
export function SupplierListEmail({
    supplier,
    className,
    iconSize = 14,
}: {
    supplier: SupplierListEmailDisplay;
    className?: string;
    iconSize?: number;
}) {
    const email = getSupplierEmailLabel(supplier);
    if (!email) return null;

    return (
        <div
            aria-label={`Email ${email}`}
            className={cn("flex items-center gap-2 text-gray-400", className)}
        >
            <Mail size={iconSize} className="text-gray-300 flex-shrink-0" />
            <span className="truncate">{email}</span>
        </div>
    );
}
