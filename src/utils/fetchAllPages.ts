import api from '@/services/api';

/**
 * Fetches ALL results from a paginated DRF endpoint by looping through pages.
 * Uses page_size=100 (max allowed by backend) to minimize requests.
 *
 * @param endpoint - API path, e.g. '/products/erp/suppliers/'
 * @param params   - Optional extra query params (e.g. { search: 'abc' })
 * @returns        - Combined array of all results across all pages
 */
export async function fetchAllPages<T = any>(
    endpoint: string,
    params: Record<string, any> = {}
): Promise<T[]> {
    let allResults: T[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
        const res = await api.get(endpoint, {
            params: { ...params, page, page_size: 100 },
        });

        const data = res.data;

        // Handle both paginated ({ results: [...], next }) and flat array responses
        if (Array.isArray(data)) {
            allResults = allResults.concat(data);
            hasMore = false;
        } else {
            allResults = allResults.concat(data.results || []);
            hasMore = !!data.next;
            page += 1;
        }
    }

    return allResults;
}
