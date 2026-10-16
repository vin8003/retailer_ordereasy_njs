import {
    getSupplierGstNumber,
    getSupplierPaymentTerms,
    type SupplierDetailScalarDisplay,
} from "@/utils/supplierDetailScalars";

/** Optional GST / payment-terms rows on supplier detail. Renders nothing when BE omitted the scalars. */
export function SupplierDetailScalars({
    supplier,
}: {
    supplier: SupplierDetailScalarDisplay;
}) {
    const gst = getSupplierGstNumber(supplier);
    const terms = getSupplierPaymentTerms(supplier);
    if (!gst && !terms) return null;

    return (
        <>
            {gst ? (
                <div>
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">GST Number</p>
                    <p aria-label={`GSTIN ${gst}`} className="text-sm sm:text-lg font-bold text-gray-900 truncate">
                        {gst}
                    </p>
                </div>
            ) : null}
            {terms ? (
                <div>
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Payment Terms</p>
                    <p aria-label={`Payment terms ${terms}`} className="text-sm sm:text-lg font-bold text-gray-900 truncate">
                        {terms}
                    </p>
                </div>
            ) : null}
        </>
    );
}
