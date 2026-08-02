'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check, X } from 'lucide-react';

interface Supplier {
    id: number;
    company_name: string;
}

interface SearchableSupplierSelectProps {
    suppliers: Supplier[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export default function SearchableSupplierSelect({
    suppliers,
    value,
    onChange,
    placeholder = 'Select Supplier',
}: SearchableSupplierSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                setSearch('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Auto-focus search input when dropdown opens
    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen]);

    const selectedSupplier = suppliers.find(s => s.id.toString() === value);

    const filteredSuppliers = search.trim()
        ? suppliers.filter(s =>
            s.company_name.toLowerCase().includes(search.trim().toLowerCase())
        )
        : suppliers;

    const handleSelect = (supplierId: string) => {
        onChange(supplierId);
        setIsOpen(false);
        setSearch('');
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange('');
        setSearch('');
    };

    return (
        <div ref={containerRef} className="relative">
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 text-left flex items-center justify-between gap-2 transition-all hover:bg-gray-100"
            >
                <span className={`font-medium truncate ${selectedSupplier ? 'text-gray-900' : 'text-gray-400'}`}>
                    {selectedSupplier ? selectedSupplier.company_name : placeholder}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                    {selectedSupplier && (
                        <span
                            onClick={handleClear}
                            className="p-0.5 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                        >
                            <X size={14} />
                        </span>
                    )}
                    <ChevronDown
                        size={16}
                        className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    />
                </div>
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-30 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Search Input */}
                    <div className="p-3 border-b border-gray-100">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search supplier name..."
                                className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 placeholder:text-gray-300"
                            />
                        </div>
                    </div>

                    {/* Options List */}
                    <div className="max-h-60 overflow-y-auto overscroll-contain">
                        {filteredSuppliers.length === 0 ? (
                            <div className="px-4 py-6 text-center text-gray-400 text-sm font-medium">
                                No suppliers found
                            </div>
                        ) : (
                            filteredSuppliers.map(s => {
                                const isSelected = s.id.toString() === value;
                                return (
                                    <button
                                        key={s.id}
                                        type="button"
                                        onClick={() => handleSelect(s.id.toString())}
                                        className={`w-full px-4 py-3 flex items-center justify-between text-left transition-colors border-b border-gray-50 last:border-b-0 ${
                                            isSelected
                                                ? 'bg-primary/5 text-primary font-bold'
                                                : 'hover:bg-gray-50 text-gray-700 font-medium'
                                        }`}
                                    >
                                        <span className="truncate text-sm">{s.company_name}</span>
                                        {isSelected && <Check size={16} className="text-primary shrink-0" />}
                                    </button>
                                );
                            })
                        )}
                    </div>

                    {/* Footer count */}
                    <div className="px-4 py-2 border-t border-gray-100 bg-gray-50/50">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            {filteredSuppliers.length} of {suppliers.length} suppliers
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
