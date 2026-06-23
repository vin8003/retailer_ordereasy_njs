import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { OrderTable } from './OrderTable';

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn() })
}));

describe('OrderTable Responsive View', () => {
    const mockOrders = [
        {
            id: 1,
            order_number: 'ORD-001',
            total_amount: 100,
            status: 'pending',
            created_at: '2023-01-01T00:00:00Z',
            customer_name: 'John Doe',
            refund_amount: 0,
            net_amount: 100,
            is_returned: false
        }
    ];

    it('renders both desktop table and mobile card list with correct responsive classes', () => {
        const { container } = render(<OrderTable orders={mockOrders} isLoading={false} />);
        
        // Find the desktop container (should have 'hidden md:block')
        const desktopContainer = container.querySelector('.hidden.md\\:block');
        expect(desktopContainer).toBeInTheDocument();
        expect(desktopContainer?.querySelector('table')).toBeInTheDocument();

        // Find the mobile container (should have 'block md:hidden')
        const mobileContainer = container.querySelector('.block.md\\:hidden');
        expect(mobileContainer).toBeInTheDocument();
        
        // Assert content in both
        expect(desktopContainer?.textContent).toContain('ORD-001');
        expect(mobileContainer?.textContent).toContain('ORD-001');
    });
});
