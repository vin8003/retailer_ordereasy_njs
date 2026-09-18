import {
    getSupplierFssaiNumberLabel,
    type SupplierDetailFssaiDisplay,
} from "@/utils/supplierDetailFssai";

/** Optional supplier-detail FSSAI row. Renders nothing when BE omitted `fssai_number`. */
export function SupplierDetailFssai({
    supplier,
}: {
    supplier: SupplierDetailFssaiDisplay;
}) {
    const label = getSupplierFssaiNumberLabel(supplier);
    if (!label) return null;

    return (
        <div>
            <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">
                FSSAI Number
            </p>
            <p
                aria-label={`FSSAI ${label}`}
                className="text-sm sm:text-lg font-bold text-gray-900 truncate"
            >
                {label}
            </p>
        </div>
    );
}
