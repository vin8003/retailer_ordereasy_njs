import {
    getSupplierPanNumber,
    type SupplierDetailPanDisplay,
} from "@/utils/supplierDetailPan";

/** Optional PAN row on supplier detail. Renders nothing when BE omitted `pan_number`. */
export function SupplierDetailPan({
    supplier,
}: {
    supplier: SupplierDetailPanDisplay;
}) {
    const pan = getSupplierPanNumber(supplier);
    if (!pan) return null;

    return (
        <div>
            <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">
                PAN Number
            </p>
            <p
                aria-label={`PAN ${pan}`}
                className="text-sm sm:text-lg font-bold text-gray-900 truncate"
            >
                {pan}
            </p>
        </div>
    );
}
