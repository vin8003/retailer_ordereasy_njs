import {
    getSupplierBankNameLabel,
    type SupplierDetailBankNameDisplay,
} from "@/utils/supplierDetailBankName";

/** Optional supplier-detail bank row. Renders nothing when BE omitted `bank_name`. */
export function SupplierDetailBankName({
    supplier,
}: {
    supplier: SupplierDetailBankNameDisplay;
}) {
    const label = getSupplierBankNameLabel(supplier);
    if (!label) return null;

    return (
        <div>
            <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">
                Bank Name
            </p>
            <p
                aria-label={`Bank ${label}`}
                className="text-sm sm:text-lg font-bold text-gray-900 truncate"
            >
                {label}
            </p>
        </div>
    );
}
