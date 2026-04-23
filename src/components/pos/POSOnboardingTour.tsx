'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ChevronRight, SkipForward, Keyboard } from 'lucide-react';

interface TourStep {
    targetSelector: string;
    title: string;
    description: string;
    shortcut: string;
    position: 'bottom' | 'left' | 'top' | 'right';
}

const TOUR_STEPS: TourStep[] = [
    {
        targetSelector: '[data-tour="search"]',
        title: 'Search & Scan',
        description: 'Start here! Scan a barcode or search by name. This is your primary entry point for every sale.',
        shortcut: 'Alt + S',
        position: 'bottom',
    },
    {
        targetSelector: '[data-tour="product-grid"]',
        title: 'Product Grid',
        description: 'Use Arrow keys to browse products. Press Enter to add the highlighted item to cart.',
        shortcut: '↑↓←→ + Enter',
        position: 'left',
    },
    {
        targetSelector: '[data-tour="cart"]',
        title: 'Cart / Current Order',
        description: 'Jump here to edit quantities. Use + and - keys to adjust, Delete to remove items.',
        shortcut: 'Alt + C',
        position: 'left',
    },
    {
        targetSelector: '[data-tour="payment"]',
        title: 'Payment Mode',
        description: 'Quickly switch between Cash and UPI without clicking.',
        shortcut: 'Alt+1 / Alt+2',
        position: 'top',
    },
    {
        targetSelector: '[data-tour="checkout"]',
        title: 'Complete Bill',
        description: 'Finalize the sale instantly. No mouse needed!',
        shortcut: 'Ctrl + Enter',
        position: 'top',
    },
];

interface POSOnboardingTourProps {
    isActive: boolean;
    onComplete: () => void;
}

export default function POSOnboardingTour({ isActive, onComplete }: POSOnboardingTourProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

    const updateTargetRect = useCallback(() => {
        if (!isActive) return;
        const step = TOUR_STEPS[currentStep];
        const el = document.querySelector(step.targetSelector);
        if (el) {
            setTargetRect(el.getBoundingClientRect());
        }
    }, [currentStep, isActive]);

    useEffect(() => {
        updateTargetRect();
        window.addEventListener('resize', updateTargetRect);
        return () => window.removeEventListener('resize', updateTargetRect);
    }, [updateTargetRect]);

    useEffect(() => {
        if (!isActive) return;
        // Scroll target into view
        const step = TOUR_STEPS[currentStep];
        const el = document.querySelector(step.targetSelector);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Small delay to let scroll complete
            setTimeout(updateTargetRect, 300);
        }
    }, [currentStep, isActive, updateTargetRect]);

    if (!isActive || !targetRect) return null;

    const step = TOUR_STEPS[currentStep];
    const isLastStep = currentStep === TOUR_STEPS.length - 1;

    // Calculate tooltip position
    const PADDING = 16;
    const TOOLTIP_WIDTH = 340;
    let tooltipStyle: React.CSSProperties = {};

    switch (step.position) {
        case 'bottom':
            tooltipStyle = {
                top: targetRect.bottom + PADDING,
                left: targetRect.left + targetRect.width / 2 - TOOLTIP_WIDTH / 2,
            };
            break;
        case 'top':
            tooltipStyle = {
                bottom: window.innerHeight - targetRect.top + PADDING,
                left: targetRect.left + targetRect.width / 2 - TOOLTIP_WIDTH / 2,
            };
            break;
        case 'left':
            tooltipStyle = {
                top: targetRect.top + targetRect.height / 2 - 80,
                right: window.innerWidth - targetRect.left + PADDING,
            };
            break;
        case 'right':
            tooltipStyle = {
                top: targetRect.top + targetRect.height / 2 - 80,
                left: targetRect.right + PADDING,
            };
            break;
    }

    // Clamp tooltip to viewport
    if (tooltipStyle.left !== undefined && typeof tooltipStyle.left === 'number') {
        tooltipStyle.left = Math.max(16, Math.min(tooltipStyle.left, window.innerWidth - TOOLTIP_WIDTH - 16));
    }

    const handleNext = () => {
        if (isLastStep) {
            onComplete();
        } else {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handleSkip = () => {
        onComplete();
    };

    return (
        <div className="fixed inset-0 z-[200]" role="dialog" aria-label="Onboarding Tour">
            {/* Overlay with cutout effect using box-shadow */}
            <div
                className="absolute inset-0 transition-all duration-300"
                style={{
                    boxShadow: `0 0 0 9999px rgba(0,0,0,0.55)`,
                    top: targetRect.top - 8,
                    left: targetRect.left - 8,
                    width: targetRect.width + 16,
                    height: targetRect.height + 16,
                    borderRadius: '16px',
                    border: '3px solid rgba(var(--primary-rgb, 79, 70, 229), 0.8)',
                    pointerEvents: 'none',
                }}
            />

            {/* Click blocker (but allow clicks on target area) */}
            <div 
                className="absolute inset-0" 
                onClick={handleSkip}
                style={{ cursor: 'default' }}
            />

            {/* Tooltip */}
            <div
                className="absolute bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 fade-in duration-300"
                style={{ ...tooltipStyle, width: TOOLTIP_WIDTH, zIndex: 201 }}
            >
                {/* Progress bar */}
                <div className="h-1 bg-gray-100">
                    <div 
                        className="h-full bg-primary transition-all duration-500 rounded-full" 
                        style={{ width: `${((currentStep + 1) / TOUR_STEPS.length) * 100}%` }}
                    />
                </div>
                
                <div className="p-5">
                    {/* Step counter */}
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            Step {currentStep + 1} of {TOUR_STEPS.length}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary rounded-lg text-xs font-bold font-mono">
                            <Keyboard size={12} /> {step.shortcut}
                        </span>
                    </div>

                    {/* Content */}
                    <h3 className="text-lg font-black text-gray-900 mb-1.5">{step.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed mb-5">{step.description}</p>

                    {/* Actions */}
                    <div className="flex items-center justify-between">
                        <button
                            onClick={handleSkip}
                            className="text-sm text-gray-400 hover:text-gray-600 font-medium flex items-center gap-1 transition-colors"
                        >
                            <SkipForward size={14} /> Skip Tour
                        </button>
                        <button
                            onClick={handleNext}
                            className="px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-sm flex items-center gap-1.5 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95"
                        >
                            {isLastStep ? 'Got it!' : 'Next'} 
                            {!isLastStep && <ChevronRight size={16} />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
