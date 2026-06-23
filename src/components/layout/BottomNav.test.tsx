import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import BottomNav from './BottomNav';

vi.mock('next/navigation', () => ({
    usePathname: () => '/dashboard'
}));

// Mock Drawer components as they use ResizeObserver which might not be available in jsdom
vi.mock('@/components/ui/drawer', () => {
    return {
        Drawer: ({ children }: any) => <div data-testid="drawer">{children}</div>,
        DrawerTrigger: ({ children }: any) => <div data-testid="drawer-trigger">{children}</div>,
        DrawerContent: ({ children }: any) => <div data-testid="drawer-content">{children}</div>,
        DrawerHeader: ({ children }: any) => <div>{children}</div>,
        DrawerTitle: ({ children }: any) => <div>{children}</div>,
        DrawerClose: ({ children }: any) => <div>{children}</div>,
    }
});

describe('BottomNav Mobile View', () => {
    it('shows POS in main navigation', () => {
        render(<BottomNav />);
        const nav = screen.getByRole('navigation');
        expect(nav).toBeInTheDocument();
        
        // Find links in main nav (excluding drawer content)
        const mainLinks = Array.from(nav.querySelectorAll('a')).filter(
            a => !a.closest('[data-testid="drawer-content"]')
        );
        
        const mainNavLabels = mainLinks.map(link => link.textContent);
        expect(mainNavLabels).toContain('POS');
        expect(mainNavLabels).not.toContain('Products');
    });

    it('shows Products, Purchases, and Suppliers in the drawer', () => {
        render(<BottomNav />);
        const drawerContent = screen.getByTestId('drawer-content');
        const drawerLabels = Array.from(drawerContent.querySelectorAll('a')).map(a => a.textContent);
        
        expect(drawerLabels).toContain('Products');
        expect(drawerLabels).toContain('Purchases');
        expect(drawerLabels).toContain('Suppliers');
    });
});
