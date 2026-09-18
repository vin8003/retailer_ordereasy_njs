/** Optional BE order-list field. Dummy payloads only — never invent from siblings. */
export type PriorityFlagDisplay = {
    priority_flag?: boolean | null;
};

/**
 * Compact "Priority" label when BE sent `priority_flag === true`.
 * false / absent / undefined / null / non-boolean → do not show. Never invent.
 */
export function getPriorityFlagLabel(order: PriorityFlagDisplay): string | null {
    return order.priority_flag === true ? "Priority" : null;
}
