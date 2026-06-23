import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import POSPage from './page';

vi.mock('@/services/api', () => ({
    default: {
        get: vi.fn().mockResolvedValue({ data: [] }),
        post: vi.fn().mockResolvedValue({ data: {} })
    },
    offerService: {
        calculateOffers: vi.fn().mockResolvedValue({ data: { total_savings: 0, applied_offers: [] } })
    }
}));

describe('POS Page Mobile Overlay', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        Element.prototype.scrollTo = vi.fn();
        Object.defineProperty(window, 'localStorage', {
            value: {
                getItem: vi.fn(),
                setItem: vi.fn(),
                removeItem: vi.fn(),
            },
            writable: true
        });
        // Mock window.innerWidth
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: 1024,
        });
        Object.defineProperty(window, 'location', {
            writable: true,
            configurable: true,
            value: { href: '' },
        });
    });

    it('shows blocking overlay without Proceed button on mobile screens (< 640px)', () => {
        // Set mobile viewport
        window.innerWidth = 400;
        
        render(<POSPage />);
        
        // Ensure overlay is shown
        expect(screen.getByText('Desktop Recommended')).toBeInTheDocument();
        expect(screen.getByText(/Point of Sale billing terminal is optimized for desktop viewports/i)).toBeInTheDocument();
        
        // Ensure 'Proceed Anyway' is NOT shown (blocking)
        expect(screen.queryByText('Proceed Anyway')).not.toBeInTheDocument();
        
        // Ensure 'Back to Dashboard' is available
        expect(screen.getByText('Back to Dashboard')).toBeInTheDocument();
    });
    
    it('does not show overlay on desktop', () => {
        // Set desktop viewport
        window.innerWidth = 1024;
        
        render(<POSPage />);
        
        // Overlay shouldn't be there
        expect(screen.queryByText('Desktop Recommended')).not.toBeInTheDocument();
    });
});
