import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import DashboardPage from './page';
import { authService, productService } from '@/services/api';

vi.mock('@/services/api', () => ({
    authService: {
        fetchProfile: vi.fn().mockResolvedValue({ data: { shop_name: 'Test Shop' } }),
        fetchStats: vi.fn().mockResolvedValue({ data: {} })
    },
    productService: {
        fetchDemandInsights: vi.fn().mockResolvedValue({ data: [] })
    }
}));

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn() })
}));

describe('Dashboard Page Mobile Layout', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('applies correct responsive classes to date picker and select', async () => {
        render(<DashboardPage />);
        
        // Wait for loading to finish
        await waitFor(() => {
            expect(screen.queryByRole('status')).not.toBeInTheDocument(); // Loader2 should be gone
            expect(screen.getByText('Overview')).toBeInTheDocument();
        });

        const select = screen.getByRole('combobox');
        expect(select).toHaveClass('w-full', 'sm:w-auto');

        // Change select to custom to show date inputs
        fireEvent.change(select, { target: { value: 'custom' } });

        // Wait for custom date range container
        await waitFor(() => {
            expect(screen.getByText('to')).toBeInTheDocument();
        });

        const customDateContainer = screen.getByText('to').parentElement;
        expect(customDateContainer).toHaveClass('flex-col', 'sm:flex-row', 'items-start', 'sm:items-center');
    });
});
