'use client';

import React from 'react';

type FocusContext = 'search' | 'grid' | 'cart' | 'checkout' | 'success' | 'empty' | 'customer';

interface POSStatusBarProps {
    currentFocus: FocusContext;
    cartItemCount: number;
}

const Kbd = ({ children }: { children: React.ReactNode }) => (
    <span className="inline-flex items-center px-1.5 py-0.5 bg-gray-700 text-gray-100 rounded text-[10px] font-mono font-bold mx-0.5 border border-gray-600 shadow-sm leading-none">
        {children}
    </span>
);

const Separator = () => <span className="text-gray-600 mx-2">•</span>;

const hintMap: Record<FocusContext, React.ReactNode> = {
    search: (
        <>
            <Kbd>↑↓←→</Kbd> Navigate Products <Separator />
            <Kbd>Enter</Kbd> Add to Cart <Separator />
            <Kbd>Alt+C</Kbd> Jump to Cart <Separator />
            <Kbd>Alt+K</Kbd> All Shortcuts
        </>
    ),
    grid: (
        <>
            <Kbd>↑↓←→</Kbd> Move Selection <Separator />
            <Kbd>Enter</Kbd> Add to Cart <Separator />
            <Kbd>Alt+S</Kbd> Back to Search <Separator />
            <Kbd>Alt+C</Kbd> Jump to Cart
        </>
    ),
    cart: (
        <>
            <Kbd>↑↓</Kbd> Navigate Items <Separator />
            <Kbd>+</Kbd> Increase Qty <Separator />
            <Kbd>-</Kbd> Decrease Qty <Separator />
            <Kbd>Del</Kbd> Remove Item <Separator />
            <Kbd>Alt+S</Kbd> Back to Search
        </>
    ),
    customer: (
        <>
            <Kbd>Tab</Kbd> Next Field <Separator />
            <Kbd>Alt+1</Kbd> Cash <Separator />
            <Kbd>Alt+2</Kbd> UPI <Separator />
            <Kbd>Ctrl+Enter</Kbd> Complete Bill
        </>
    ),
    checkout: (
        <>
            <Kbd>Ctrl+Enter</Kbd> Complete Bill <Separator />
            <Kbd>Alt+1</Kbd> Cash <Separator />
            <Kbd>Alt+2</Kbd> UPI <Separator />
            <Kbd>Alt+D</Kbd> Discount <Separator />
            <Kbd>Alt+M</Kbd> Customer Mobile
        </>
    ),
    success: (
        <>
            <Kbd>Ctrl+P</Kbd> Print Receipt <Separator />
            <Kbd>Alt+N</Kbd> New Bill <Separator />
            <Kbd>Alt+K</Kbd> All Shortcuts
        </>
    ),
    empty: (
        <>
            <Kbd>Alt+S</Kbd> Search Products <Separator />
            <Kbd>Alt+T</Kbd> New Bill Tab <Separator />
            <Kbd>Alt+K</Kbd> All Shortcuts
        </>
    ),
};

export default function POSStatusBar({ currentFocus, cartItemCount }: POSStatusBarProps) {
    const focusKey = cartItemCount === 0 && currentFocus === 'search' ? 'empty' : currentFocus;

    return (
        <div className="fixed bottom-0 left-0 right-0 h-8 bg-gray-900 flex items-center justify-center px-6 z-50 text-[11px] text-gray-300 font-medium select-none gap-1 shadow-[0_-2px_10px_rgba(0,0,0,0.2)]">
            <span className="flex items-center gap-0.5">
                {hintMap[focusKey] || hintMap.empty}
            </span>
        </div>
    );
}
