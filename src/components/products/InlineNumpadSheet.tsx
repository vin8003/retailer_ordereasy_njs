"use client";

import React, { useState, useEffect } from "react";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerFooter,
    DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";

interface InlineNumpadSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    initialValue: string | number;
    onSave: (value: string) => Promise<void>;
    type?: "currency" | "number";
}

export function InlineNumpadSheet({
    open,
    onOpenChange,
    title,
    initialValue,
    onSave,
    type = "number"
}: InlineNumpadSheetProps) {
    const [value, setValue] = useState(String(initialValue));
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (open) {
            setValue(String(initialValue));
        }
    }, [open, initialValue]);

    const handleNumpadClick = (num: string) => {
        setValue((prev) => {
            if (prev === "0" && num !== ".") return num;
            if (num === "." && prev.includes(".")) return prev;
            return prev + num;
        });
    };

    const handleDelete = () => {
        setValue((prev) => (prev.length > 1 ? prev.slice(0, -1) : "0"));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave(value);
            onOpenChange(false);
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0"];

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="pb-8">
                <DrawerHeader>
                    <DrawerTitle>{title}</DrawerTitle>
                </DrawerHeader>
                <div className="p-4 flex flex-col items-center">
                    <div className="text-4xl font-bold mb-8 text-center bg-muted w-full rounded-xl py-4 flex justify-center items-center">
                        {type === "currency" && <span className="text-2xl text-muted-foreground mr-1">₹</span>}
                        {value}
                    </div>

                    <div className="grid grid-cols-3 gap-4 w-full max-w-sm">
                        {keys.map((k) => (
                            <Button
                                key={k}
                                variant="outline"
                                className="h-16 text-2xl font-semibold rounded-xl"
                                onClick={() => handleNumpadClick(k)}
                            >
                                {k}
                            </Button>
                        ))}
                        <Button
                            variant="outline"
                            className="h-16 text-2xl font-semibold rounded-xl text-destructive hover:text-destructive"
                            onClick={handleDelete}
                        >
                            ⌫
                        </Button>
                    </div>
                </div>
                <DrawerFooter className="px-4">
                    <Button size="lg" className="w-full text-lg h-14" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
}
