import {
    getSupplierEmailLabel,
    getSupplierPhoneLabel,
    type SupplierDetailContactDisplay,
} from "@/utils/supplierDetailContact";

/** Optional supplier-detail contact rows. Renders nothing when BE omitted email/phone. */
export function SupplierDetailContact({
    supplier,
}: {
    supplier: SupplierDetailContactDisplay;
}) {
    const phone = getSupplierPhoneLabel(supplier);
    const email = getSupplierEmailLabel(supplier);
    if (!phone && !email) return null;

    return (
        <>
            {phone ? (
                <div>
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">
                        Mobile Number
                    </p>
                    <p
                        aria-label={`Phone ${phone}`}
                        className="text-sm sm:text-lg font-bold text-gray-900 truncate"
                    >
                        {phone}
                    </p>
                </div>
            ) : null}
            {email ? (
                <div>
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">
                        Email
                    </p>
                    <p
                        aria-label={`Email ${email}`}
                        className="text-sm sm:text-lg font-bold text-gray-900 truncate"
                    >
                        {email}
                    </p>
                </div>
            ) : null}
        </>
    );
}
