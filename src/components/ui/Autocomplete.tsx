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
        if (!isOpen) return;
        const q = (value || "").trim().toLowerCase();
        // Edit/prefill stores the selected suggestion name (product group, category).
        // Filtering by that exact name hides every other option, so typing a new
        // query after the prefill looks like "No results found."
        const valueIsExactName = suggestions.some((s) => {
            if (s == null) return false;
            const name = typeof s === "string" ? s : (s?.name ?? "");
            return String(name).trim().toLowerCase() === q;
        });
        const filtered = !q || valueIsExactName
            ? suggestions
            : suggestions.filter((s) => {
                const name = typeof s === "string" ? s : (s?.name ?? "");
                return String(name).toLowerCase().includes(q);
            });
        setFilteredSuggestions(filtered);
        setActiveIndex(-1);
    }, [suggestions, isOpen, value]);

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
                onFocus={(e) => {
                    setIsOpen(true);
                    // Prefill on edit: select so the next keystroke replaces the stored
                    // group/category name instead of appending to it.
                    e.target.select();
                }}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="w-full"
            />
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-popover text-popover-foreground border rounded-md shadow-md max-h-60 overflow-auto animate-in fade-in zoom-in-95 duration-200">
                    {isLoading && filteredSuggestions.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground animate-pulse">Loading...</div>
                    ) : (
                        <>
                            {filteredSuggestions.length === 0 && !isLoading ? (
                                <div className="p-2 text-sm text-muted-foreground">No results found.</div>
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
                                            onMouseDown={(e) => {
                                                // Prevent input from losing focus before click
                                                e.preventDefault();
                                            }}
                                            onClick={() => handleSelect(s)}
                                        >
                                            {name}
                                        </div>
                                    );
                                })
                            )}
                            {isLoading && filteredSuggestions.length > 0 && (
                                <div className="p-2 text-xs text-muted-foreground text-center bg-muted/50 border-t animate-pulse">
                                    Updating...
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
