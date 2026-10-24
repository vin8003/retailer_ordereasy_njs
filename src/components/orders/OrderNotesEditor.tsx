"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import api from "@/services/api";
import { ORDER_NOTES_MAX, normalizeOrderNotes, orderNotesSaveError, validateOrderNotes } from "@/lib/orderNotes";

/** Edit the shop's internal order notes (OE-325). Customers never see these. */
export function OrderNotesEditor({
    orderId,
    notes,
    onSaved,
}: {
    orderId: number;
    notes?: string | null;
    onSaved: (notes: string) => void;
}) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState("");
    const [saving, setSaving] = useState(false);

    const startEditing = () => {
        setDraft(notes ?? "");
        setEditing(true);
    };

    const save = async () => {
        const invalid = validateOrderNotes(draft);
        if (invalid) {
            toast.error(invalid);
            return;
        }
        setSaving(true);
        try {
            const response = await api.patch(`/orders/${orderId}/notes/`, { notes: normalizeOrderNotes(draft) });
            onSaved(response.data?.notes ?? normalizeOrderNotes(draft));
            setEditing(false);
            toast.success("Notes saved");
        } catch (error) {
            toast.error(orderNotesSaveError(error));
        } finally {
            setSaving(false);
        }
    };

    if (!editing) {
        return (
            <Button variant="ghost" size="sm" className="h-7 px-2 w-fit text-muted-foreground" onClick={startEditing}>
                <Pencil className="mr-1 h-3 w-3" /> {normalizeOrderNotes(notes) ? "Edit notes" : "Add notes"}
            </Button>
        );
    }

    return (
        <div className="space-y-2 max-w-xl">
            <Textarea
                aria-label="Order notes"
                value={draft}
                maxLength={ORDER_NOTES_MAX}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Internal notes for your shop (not shown to the customer)"
                rows={3}
            />
            <div className="flex gap-2">
                <Button size="sm" onClick={save} disabled={saving}>
                    {saving ? "Saving..." : "Save notes"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditing(false)} disabled={saving}>
                    Cancel
                </Button>
            </div>
        </div>
    );
}
