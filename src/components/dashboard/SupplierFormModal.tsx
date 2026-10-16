'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { GSTIN_FORMAT_MESSAGE, PAYMENT_TERMS_WHITESPACE } from '@/lib/suppliers';

export type SupplierFormValues = {
    company_name: string;
    contact_person: string;
    phone_number: string;
    email: string;
    address: string;
    gst_number: string;
    payment_terms: string;
    is_active: boolean;
};

export const EMPTY_SUPPLIER_FORM: SupplierFormValues = {
    company_name: '',
    contact_person: '',
    phone_number: '',
    email: '',
    address: '',
    gst_number: '',
    payment_terms: '',
    is_active: true,
};

type SupplierFormModalProps = {
    open: boolean;
    mode: 'add' | 'edit';
    values: SupplierFormValues;
    onChange: (values: SupplierFormValues) => void;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
    isSubmitting?: boolean;
    canEditTerms?: boolean;
};

export function SupplierFormModal({
    open,
    mode,
    values,
    onChange,
    onClose,
    onSubmit,
    isSubmitting = false,
    canEditTerms = false,
}: SupplierFormModalProps) {
    if (!open) return null;

    const set = (field: keyof SupplierFormValues, value: string | boolean) =>
        onChange({ ...values, [field]: value });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl p-10 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-black text-gray-900 mb-2">
                    {mode === 'edit' ? 'Edit Distributor' : 'New Distributor'}
                </h2>
                <p className="text-gray-500 mb-8 font-medium">
                    {mode === 'edit'
                        ? 'Update this stock provider. Inactive distributors can be edited without reactivating.'
                        : 'Create a record for your stock provider.'}
                </p>

                <form onSubmit={onSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Company Name *</label>
                            <input
                                required
                                type="text"
                                placeholder="e.g. ABC Foods Ltd"
                                value={values.company_name}
                                onChange={e => set('company_name', e.target.value)}
                                className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Contact Person</label>
                            <input
                                type="text"
                                placeholder="John Doe"
                                value={values.contact_person}
                                onChange={e => set('contact_person', e.target.value)}
                                className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Phone Number (recommended)</label>
                            <input
                                type="tel"
                                placeholder="10-digit mobile (optional)"
                                value={values.phone_number}
                                onChange={e => set('phone_number', e.target.value)}
                                className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Email Address</label>
                            <input
                                type="email"
                                placeholder="distributor@mail.com"
                                value={values.email}
                                onChange={e => set('email', e.target.value)}
                                className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">GSTIN (optional)</label>
                        <input
                            type="text"
                            maxLength={15}
                            placeholder="22AAAAA0000A1Z5"
                            value={values.gst_number}
                            onChange={e => set('gst_number', e.target.value.toUpperCase())}
                            className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 uppercase tracking-wide"
                        />
                        <p className="text-[11px] text-gray-400 pl-1">{GSTIN_FORMAT_MESSAGE}</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Payment terms</label>
                        <input
                            type="text"
                            maxLength={80}
                            placeholder="e.g. Net 30"
                            value={values.payment_terms}
                            onChange={e => set('payment_terms', e.target.value)}
                            disabled={!canEditTerms}
                            className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 disabled:opacity-60 disabled:cursor-not-allowed"
                        />
                        <p className="text-[11px] text-gray-400 pl-1">
                            {canEditTerms
                                ? PAYMENT_TERMS_WHITESPACE
                                : 'purchasing.terms is required to change payment terms.'}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Office Address</label>
                        <textarea
                            rows={3}
                            placeholder="Full office or warehouse address..."
                            value={values.address}
                            onChange={e => set('address', e.target.value)}
                            className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 focus:ring-2 focus:ring-primary/20 resize-none"
                        />
                    </div>

                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={values.is_active}
                            onChange={e => set('is_active', e.target.checked)}
                            className="size-4 rounded border-gray-300 text-primary focus:ring-primary/20"
                        />
                        <span className="text-sm font-medium text-gray-700">
                            Active — inactive suppliers cannot be chosen on a new purchase invoice
                        </span>
                    </label>

                    <div className="flex gap-4 pt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-4 rounded-2xl font-bold bg-gray-100 text-gray-600 hover:bg-gray-200"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-[2] bg-primary text-white px-6 py-4 rounded-2xl font-bold hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <Loader2 className="animate-spin mx-auto" size={20} />
                            ) : mode === 'edit' ? (
                                'Save Changes'
                            ) : (
                                'Register Distributor'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
