"use client";

import React, { useState } from "react";
import { Edit3, CheckSquare, X, ArrowUpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BulkActionBarProps {
    selectionMode?: boolean;
    selectedCount: number;
    totalCount?: number;
    onCancel: () => void;
    onEditSelected: () => void;
    onSelectAll?: () => void;
    isSelectingAll?: boolean;
}

export function BulkActionBar({
    selectionMode,
    selectedCount,
    totalCount = 0,
    onCancel,
    onEditSelected,
    onSelectAll,
    isSelectingAll = false
}: BulkActionBarProps) {
    if (!selectionMode && selectedCount === 0) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 md:left-64 z-50 bg-background border-t shadow-[0_-10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.5)] transform transition-transform duration-300 translate-y-0">
            <div className="flex flex-col sm:flex-row items-center justify-between p-4 max-w-5xl mx-auto gap-4">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Button variant="ghost" size="icon" onClick={onCancel} className="h-8 w-8 rounded-full bg-muted/50 hover:bg-muted">
                        <X className="h-4 w-4" />
                    </Button>
                    <div className="flex flex-col items-start pr-4 border-r">
                        <span className="text-sm font-semibold">{selectedCount} Selected</span>
                        <span className="text-xs text-muted-foreground">Bulk operations active</span>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    {onSelectAll && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onSelectAll}
                            disabled={isSelectingAll || totalCount === 0 || selectedCount === totalCount}
                            className="flex-1 sm:flex-none h-11 px-6 border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-900 dark:text-blue-400 dark:hover:bg-blue-900/30"
                        >
                            {isSelectingAll ? (
                                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
                            ) : (
                                <CheckSquare className="w-4 h-4 mr-2" />
                            )}
                            Select All ({totalCount})
                        </Button>
                    )}
                    <Button variant="default" size="sm" onClick={onEditSelected} disabled={selectedCount === 0} className="flex-1 sm:flex-none h-11 px-6">
                        <Edit3 className="w-4 h-4 mr-2" />
                        Edit Selected
                    </Button>
                </div>
            </div>
        </div>
    );
}
