/** The stats endpoint sends money as decimal strings ("0.00") and a fresh shop has none of the optional parts. */
export type DashboardStatsData = {
    total_orders: number;
    total_revenue: number;
    total_products: number;
    average_rating: number;
    average_order_value: number;
    recent_reviews: unknown[];
    recent_orders: unknown[];
    cash_sales: number;
    digital_sales: number;
    pos_sales: number;
    online_sales: number;
};

const num = (value: unknown): number => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
};

export function normalizeStats(raw: Record<string, unknown> | null | undefined): DashboardStatsData {
    const data = raw ?? {};
    return {
        total_orders: num(data.total_orders),
        total_revenue: num(data.total_revenue),
        total_products: num(data.total_products),
        average_rating: num(data.average_rating),
        average_order_value: num(data.average_order_value),
        recent_reviews: Array.isArray(data.recent_reviews) ? (data.recent_reviews as unknown[]) : [],
        recent_orders: Array.isArray(data.recent_orders) ? (data.recent_orders as unknown[]) : [],
        cash_sales: num(data.cash_sales),
        digital_sales: num(data.digital_sales),
        pos_sales: num(data.pos_sales),
        online_sales: num(data.online_sales),
    };
}

export const formatRupees = (value: number) =>
    `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

/** Cash share of revenue as a whole percent; 0 when nothing was sold. */
export function cashPercent(stats: Pick<DashboardStatsData, "cash_sales" | "total_revenue">): number {
    return stats.total_revenue > 0 ? Math.round((stats.cash_sales / stats.total_revenue) * 100) : 0;
}
