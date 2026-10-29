import { describe, it, expect, vi, afterEach } from 'vitest';
import api, { orderService } from './api';

describe('orderService.fetchOrderList routing', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('routes status="all" to orders/history/ without status parameter', async () => {
        const get = vi.spyOn(api, 'get').mockResolvedValue({ data: [] });
        await orderService.fetchOrderList({ status: 'all', search: '123' });

        expect(get).toHaveBeenCalledWith('orders/history/', {
            params: { search: '123' },
        });
    });

    it('routes undefined status to orders/history/ without status parameter', async () => {
        const get = vi.spyOn(api, 'get').mockResolvedValue({ data: [] });
        await orderService.fetchOrderList({ search: 'ORD-999' });

        expect(get).toHaveBeenCalledWith('orders/history/', {
            params: { search: 'ORD-999' },
        });
    });

    it('routes status="active" to orders/inbox/ without status parameter', async () => {
        const get = vi.spyOn(api, 'get').mockResolvedValue({ data: [] });
        await orderService.fetchOrderList({ status: 'active', page: 2 });

        expect(get).toHaveBeenCalledWith('orders/inbox/', {
            params: { page: 2 },
        });
    });

    it('routes terminal status="delivered" to orders/history/', async () => {
        const get = vi.spyOn(api, 'get').mockResolvedValue({ data: [] });
        await orderService.fetchOrderList({ status: 'delivered' });

        expect(get).toHaveBeenCalledWith('orders/history/', {
            params: { status: 'delivered' },
        });
    });

    it('routes terminal status="cancelled" to orders/history/', async () => {
        const get = vi.spyOn(api, 'get').mockResolvedValue({ data: [] });
        await orderService.fetchOrderList({ status: 'cancelled' });

        expect(get).toHaveBeenCalledWith('orders/history/', {
            params: { status: 'cancelled' },
        });
    });

    it('routes terminal status="returned" to orders/history/', async () => {
        const get = vi.spyOn(api, 'get').mockResolvedValue({ data: [] });
        await orderService.fetchOrderList({ status: 'returned' });

        expect(get).toHaveBeenCalledWith('orders/history/', {
            params: { status: 'returned' },
        });
    });

    it('routes active pipeline status="pending" to orders/inbox/', async () => {
        const get = vi.spyOn(api, 'get').mockResolvedValue({ data: [] });
        await orderService.fetchOrderList({ status: 'pending' });

        expect(get).toHaveBeenCalledWith('orders/inbox/', {
            params: { status: 'pending' },
        });
    });

    it('routes active pipeline status="processing" to orders/inbox/', async () => {
        const get = vi.spyOn(api, 'get').mockResolvedValue({ data: [] });
        await orderService.fetchOrderList({ status: 'processing' });

        expect(get).toHaveBeenCalledWith('orders/inbox/', {
            params: { status: 'processing' },
        });
    });
});
