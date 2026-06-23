import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import Header from './Header';
import { authService } from '@/services/api';

vi.mock('@/services/api', () => ({
    authService: {
        fetchProfile: vi.fn()
    }
}));

describe('Header Mobile View', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('displays shop name with ShoppingBag icon on mobile', async () => {
        (authService.fetchProfile as any).mockResolvedValue({
            data: { shop_name: 'Test Mobile Shop' }
        });

        render(<Header />);

        await waitFor(() => {
            expect(screen.getAllByText('Test Mobile Shop').length).toBeGreaterThan(0);
        });

        const shopNameEls = screen.getAllByText('Test Mobile Shop');
        // The first one is the mobile branding
        const shopNameEl = shopNameEls[0];
        const mobileContainer = shopNameEl.parentElement;
        expect(mobileContainer).toHaveClass('md:hidden');
        
        expect(shopNameEl).toHaveClass('truncate');
        expect(shopNameEl).toHaveClass('max-w-[160px]');

        // Assert ShoppingBag icon is present. We can query it by its SVG or test id
        const iconContainer = mobileContainer?.querySelector('svg.lucide-shopping-bag');
        expect(iconContainer).toBeInTheDocument();
    });
});
