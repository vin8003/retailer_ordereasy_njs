import { pickPosCartLineSchemeName } from "@/utils/posCartLineScheme";

export type POSCartLineSchemeDetailsItem = {
    name: string;
    scheme_name?: string | null;
    batch_name?: string | null;
    /** Allowed on payloads / tests; never used to invent scheme_name. */
    brand_name?: string | null;
    offer_name?: string | null;
    scheme?: { name?: string | null } | null;
};

/** Item name + optional muted scheme on a POS cart line. Batch unchanged. */
export function POSCartLineSchemeDetails({ item }: { item: POSCartLineSchemeDetailsItem }) {
    const schemeName = pickPosCartLineSchemeName(item);

    return (
        <div className="flex flex-col">
            <span className="text-sm font-bold text-gray-800 line-clamp-1">{item.name}</span>
            {schemeName ? (
                <div
                    aria-label={`Scheme ${schemeName}`}
                    className="text-xs text-muted-foreground font-normal truncate"
                >
                    {schemeName}
                </div>
            ) : null}
            {item.batch_name ? (
                <span className="text-[10px] text-primary font-bold uppercase mt-0.5 tracking-tighter">
                    Batch: {item.batch_name}
                </span>
            ) : null}
        </div>
    );
}
