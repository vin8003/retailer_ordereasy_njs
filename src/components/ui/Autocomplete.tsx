"use client";

import React, { useState, useEffect, useRef } from "react";
import { Input } from "./input";
import { cn } from "@/lib/utils";

interface AutocompleteProps {
    value: string;
    onChange: (value: string) => void;
    onSelect?: (id: string, name: string) => void;
    suggestions: any[]; // Array of strings or objects { id, name }
    placeholder?: string;
    className?: string;
    isLoading?: boolean;
}

export function Autocomplete({
    value,
    onChange,
    onSelect,
    suggestions,
    placeholder,
    className,
    isLoading = false
}: AutocompleteProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [filteredSuggestions, setFilteredSuggestions] = useState<any[]>([]);
    const [activeIndex, setActiveIndex] = useState(-1);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (value && isOpen) {
            const filtered = suggestions.filter(s => {
                const name = typeof s === 'string' ? s : s.name;
                return name.toLowerCase().includes(value.toLowerCase());
            });
            setFilteredSuggestions(filtered);
            setActiveIndex(-1);
        } else {
            setFilteredSuggestions(suggestions);
        }
    }, [value, suggestions, isOpen]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (s: any) => {
        const name = typeof s === 'string' ? s : s.name;
        const id = typeof s === 'string' ? s : s.id?.toString();

        onChange(name);
        if (onSelect) onSelect(id, name);
        setIsOpen(false);
        setActiveIndex(-1);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen) {
            if (e.key === 'ArrowDown') setIsOpen(true);
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                setActiveIndex(prev => (prev < filteredSuggestions.length - 1 ? prev + 1 : prev));
                break;
            case 'ArrowUp':
                setActiveIndex(prev => (prev > 0 ? prev - 1 : prev));
                break;
            case 'Enter':
                if (activeIndex >= 0 && activeIndex < filteredSuggestions.length) {
                    handleSelect(filteredSuggestions[activeIndex]);
                    e.preventDefault();
                }
                break;
            case 'Escape':
                setIsOpen(false);
                break;
        }
    };

    return (
        <div className={cn("relative w-full", className)} ref={wrapperRef}>
            <Input
                value={value}
                onChange={(e) => {
                    onChange(e.target.value);
                    setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="w-full"
            />
            {isOpen && (filteredSuggestions.length > 0 || isLoading) && (
                <div className="absolute z-50 w-full mt-1 bg-popover text-popover-foreground border rounded-md shadow-md max-h-60 overflow-auto animate-in fade-in zoom-in-95 duration-200">
                    {isLoading ? (
                        <div className="p-2 text-sm text-muted-foreground">Loading...</div>
                    ) : (
                        filteredSuggestions.map((s, i) => {
                            const name = typeof s === 'string' ? s : s.name;
                            return (
                                <div
                                    key={i}
                                    className={cn(
                                        "p-2 text-sm cursor-pointer transition-colors",
                                        i === activeIndex ? "bg-accent text-accent-foreground" : "hover:bg-accent hover:text-accent-foreground"
                                    )}
                                    onClick={() => handleSelect(s)}
                                >
                                    {name}
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}
