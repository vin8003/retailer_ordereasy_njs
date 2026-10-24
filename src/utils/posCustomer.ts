/**
 * Stars the POS "Rate Customer" box starts at, on the first bill of a session and after
 * every later one. 0 stars blacklists the customer, so it is never the starting value.
 */
export const POS_DEFAULT_RATING = 5;

/** Response of `products/erp/verify-pos-customer/` for the mobile number typed at the POS. */
export type PosCustomerCheck = {
    status: "verified" | "returning_guest" | "new" | null;
    name?: string | null;
};

/**
 * Session fields once the mobile-number check returns. The cashier may have typed a name
 * while it was loading: that name stays, and the saved name only fills an empty field.
 */
export function customerCheckUpdate(currentName: string, check: PosCustomerCheck) {
    return {
        verificationStatus: check.status,
        customerName: currentName || check.name || "",
    };
}
