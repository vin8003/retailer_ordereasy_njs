'use client';

import React from 'react';
import { X, Keyboard, RotateCcw } from 'lucide-react';

interface KeyboardShortcutPanelProps {
    isOpen: boolean;
    onClose: () => void;
    onReplayTour: () => void;
}

const Kbd = ({ children }: { children: React.ReactNode }) => (
    <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-mono font-bold border border-gray-200 shadow-sm min-w-[28px] justify-center">
        {children}
    </span>
);

interface ShortcutRowProps {
    label: string;
    shortcut: React.ReactNode;
}

const ShortcutRow = ({ label, shortcut }: ShortcutRowProps) => (
    <div className="flex items-center justify-between py-2 px-1 hover:bg-gray-50 rounded-lg transition-colors">
        <span className="text-sm text-gray-700">{label}</span>
        <span className="flex items-center gap-1">{shortcut}</span>
    </div>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mt-5 mb-2 px-1">{children}</h3>
);

export default function KeyboardShortcutPanel({ isOpen, onClose, onReplayTour }: KeyboardShortcutPanelProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[90] flex justify-end">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" 
                onClick={onClose} 
            />
            
            {/* Panel */}
            <div className="relative w-[380px] bg-white shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                            <Keyboard size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-gray-900 tracking-tight">Keyboard Shortcuts</h2>
                            <p className="text-[11px] text-gray-400 font-medium">Speed up your billing</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-600"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-5 pb-6 scrollbar-hide">
                    <SectionTitle>Billing</SectionTitle>
                    <ShortcutRow label="Search / Scan" shortcut={<><Kbd>Alt</Kbd><span className="text-gray-300">+</span><Kbd>S</Kbd></>} />
                    <ShortcutRow label="New Bill" shortcut={<><Kbd>Alt</Kbd><span className="text-gray-300">+</span><Kbd>N</Kbd></>} />
                    <ShortcutRow label="Complete Bill" shortcut={<><Kbd>Ctrl</Kbd><span className="text-gray-300">+</span><Kbd>↵</Kbd></>} />
                    <ShortcutRow label="Print Receipt" shortcut={<><Kbd>Ctrl</Kbd><span className="text-gray-300">+</span><Kbd>P</Kbd></>} />

                    <SectionTitle>Cart Operations</SectionTitle>
                    <ShortcutRow label="Focus Cart" shortcut={<><Kbd>Alt</Kbd><span className="text-gray-300">+</span><Kbd>C</Kbd></>} />
                    <ShortcutRow label="Navigate Items" shortcut={<><Kbd>↑</Kbd><Kbd>↓</Kbd></>} />
                    <ShortcutRow label="Increase Qty" shortcut={<><Kbd>+</Kbd> <span className="text-gray-400 text-xs mx-1">or</span> <Kbd>→</Kbd></>} />
                    <ShortcutRow label="Decrease Qty" shortcut={<><Kbd>-</Kbd> <span className="text-gray-400 text-xs mx-1">or</span> <Kbd>←</Kbd></>} />
                    <ShortcutRow label="Remove Item" shortcut={<><Kbd>Del</Kbd> <span className="text-gray-400 text-xs mx-1">or</span> <Kbd>Bksp</Kbd></>} />

                    <SectionTitle>Product Grid</SectionTitle>
                    <ShortcutRow label="Navigate Products" shortcut={<><Kbd>↑</Kbd><Kbd>↓</Kbd><Kbd>←</Kbd><Kbd>→</Kbd></>} />
                    <ShortcutRow label="Add to Cart" shortcut={<Kbd>Enter</Kbd>} />
                    <ShortcutRow label="Bulk Add (Qty)" shortcut={<><Kbd>barcode*qty</Kbd><span className="text-gray-300">+</span><Kbd>↵</Kbd></>} />

                    <SectionTitle>Payment</SectionTitle>
                    <ShortcutRow label="Cash" shortcut={<><Kbd>Alt</Kbd><span className="text-gray-300">+</span><Kbd>1</Kbd></>} />
                    <ShortcutRow label="UPI" shortcut={<><Kbd>Alt</Kbd><span className="text-gray-300">+</span><Kbd>2</Kbd></>} />
                    <ShortcutRow label="Customer Mobile" shortcut={<><Kbd>Alt</Kbd><span className="text-gray-300">+</span><Kbd>M</Kbd></>} />
                    <ShortcutRow label="Discount" shortcut={<><Kbd>Alt</Kbd><span className="text-gray-300">+</span><Kbd>D</Kbd></>} />

                    <SectionTitle>Multi-Bill</SectionTitle>
                    <ShortcutRow label="New Tab" shortcut={<><Kbd>Alt</Kbd><span className="text-gray-300">+</span><Kbd>T</Kbd></>} />
                    <ShortcutRow label="Next Bill" shortcut={<><Kbd>Alt</Kbd><span className="text-gray-300">+</span><Kbd>]</Kbd></>} />
                    <ShortcutRow label="Previous Bill" shortcut={<><Kbd>Alt</Kbd><span className="text-gray-300">+</span><Kbd>[</Kbd></>} />

                    <SectionTitle>Other</SectionTitle>
                    <ShortcutRow label="Sales Return" shortcut={<><Kbd>Alt</Kbd><span className="text-gray-300">+</span><Kbd>R</Kbd></>} />
                    <ShortcutRow label="This Panel" shortcut={<><Kbd>Alt</Kbd><span className="text-gray-300">+</span><Kbd>K</Kbd></>} />
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                    <button
                        onClick={onReplayTour}
                        className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-primary font-bold hover:bg-primary/5 rounded-xl transition-colors"
                    >
                        <RotateCcw size={16} /> Replay Onboarding Tour
                    </button>
                </div>
            </div>
        </div>
    );
}
