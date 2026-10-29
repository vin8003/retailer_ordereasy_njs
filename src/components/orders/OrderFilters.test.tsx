import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { OrderFilters } from './OrderFilters';

describe('OrderFilters', () => {
    it('renders Active Inbox and All Orders tabs', () => {
        const onStatusChange = vi.fn();
        const markup = renderToStaticMarkup(
            <OrderFilters currentStatus="all" onStatusChange={onStatusChange} />
        );

        expect(markup).toContain('Active Inbox');
        expect(markup).toContain('All Orders');
        expect(markup).toContain('Delivered');
        expect(markup).toContain('Pending');
    });

    it('renders all statuses including Active Inbox', () => {
        const onStatusChange = vi.fn();
        const markup = renderToStaticMarkup(
            <OrderFilters currentStatus="active" onStatusChange={onStatusChange} />
        );

        expect(markup).toContain('Active Inbox');
        expect(markup).toContain('All Orders');
        expect(markup).toContain('Out for Delivery');
        expect(markup).toContain('Cancelled');
        expect(markup).toContain('Returned');
    });
});
