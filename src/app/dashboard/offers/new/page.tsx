'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Save, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import Link from 'next/link';

import { productService, offerService } from '@/services/api';
import { ProductMultiSelect } from '@/components/offer/ProductMultiSelect';

export default function NewOfferPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    // ... formData state ...
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        benefit_type: 'discount',
        offer_type: 'percentage',
        value_type: 'percent',
        value: '',
        min_order_value: 0,
        max_discount_amount: null,
        buy_quantity: null,
        get_quantity: null,
        is_cheapest_free: true,
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        is_active: true,
        is_stackable: false,
        priority: 0,
        usage_limit_total: null,
        usage_limit_per_user: null,
        bxgy_strategy: 'mixed'
    });

    // Targets state
    const [targets, setTargets] = useState<{
        target_type: string,
        product_id?: string,
        product_ids?: string[], // New field for multi-select
        category_id?: string,
        is_excluded: boolean
    }[]>([
        { target_type: 'all_products', is_excluded: false }
    ]);

    const [availableProducts, setAvailableProducts] = useState<{ id: number, name: string }[]>([]);
    const [availableCategories, setAvailableCategories] = useState<{ id: number, name: string }[]>([]);

    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                // Fetch Categories
                const catRes = await productService.fetchAllCategories();
                setAvailableCategories(catRes.data.results || catRes.data);
            } catch (e) {
                console.error("Failed to load products/categories", e);
            }
        };
        fetchMetadata();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? (value === '' ? null : Number(value)) : value
        }));
    };

    const handleSwitchChange = (name: string, checked: boolean) => {
        setFormData(prev => ({ ...prev, [name]: checked }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const addTarget = () => {
        setTargets([...targets, { target_type: 'product', is_excluded: false }]);
    };

    const removeTarget = (index: number) => {
        const newTargets = [...targets];
        newTargets.splice(index, 1);
        setTargets(newTargets);
    };

    const updateTarget = (index: number, field: string, value: any) => {
        const newTargets = [...targets];
        newTargets[index] = { ...newTargets[index], [field]: value };
        setTargets(newTargets);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Clean up payload and flatten targets
            const finalTargets: any[] = [];
            targets.forEach(t => {
                if (t.target_type === 'product' && t.product_ids && t.product_ids.length > 0) {
                    // Flatten multiple products
                    t.product_ids.forEach(pid => {
                        finalTargets.push({
                            target_type: 'product',
                            is_excluded: t.is_excluded,
                            product: Number(pid)
                        });
                    });
                } else if (t.target_type === 'product' && t.product_id) {
                    // Legacy/Fallback for single ID
                    finalTargets.push({
                        target_type: 'product',
                        is_excluded: t.is_excluded,
                        product: Number(t.product_id)
                    });
                } else {
                    // Other types (category, etc)
                    finalTargets.push({
                        target_type: t.target_type,
                        is_excluded: t.is_excluded,
                        category: t.category_id ? Number(t.category_id) : null,
                        product: null
                    });
                }
            });

            const payload = {
                ...formData,
                // Ensure value is present
                value: formData.value === '' || formData.value === null ? 0 : formData.value,
                targets: finalTargets
            };

            await offerService.createOffer(payload);
            router.push('/dashboard/offers');
        } catch (error: any) {
            console.error('Error creating offer:', error);
            alert(error.response?.data ? `Failed to create offer: ${JSON.stringify(error.response.data)}` : 'Something went wrong');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-10">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/offers">
                    <Button variant="ghost" size="icon">
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold">Create New Offer</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Basic Info */}
                <Card>
                    <CardHeader>
                        <CardTitle>Basic Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="name">Offer Name</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    placeholder="e.g. Summer Sale 2026"
                                    required
                                    value={formData.name}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="offer_type">Offer Type</Label>
                                <Select
                                    value={formData.offer_type}
                                    onValueChange={(val) => handleSelectChange('offer_type', val)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="percentage">Percentage</SelectItem>
                                        <SelectItem value="bxgy">Buy X Get Y Free</SelectItem>
                                        <SelectItem value="flat_amount">Flat Amount</SelectItem>
                                        <SelectItem value="cart_value">Cart Value</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="benefit_type">Benefit Type</Label>
                                <Select
                                    value={formData.benefit_type}
                                    onValueChange={(val) => handleSelectChange('benefit_type', val)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Benefit" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="discount">Instant Discount</SelectItem>
                                        <SelectItem value="credit_points">Loyalty Points (Cashback)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description (Optional)</Label>
                                <Textarea
                                    id="description"
                                    name="description"
                                    placeholder="Terms and conditions..."
                                    value={formData.description}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Offer Logic Configuration - Dynamic based on Type */}
                <Card>
                    <CardHeader>
                        <CardTitle>Offer Rules</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {formData.offer_type === 'percentage' && (
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>
                                        {formData.benefit_type === 'credit_points' ? 'Cashback Percentage (%)' : 'Discount Percentage (%)'}
                                    </Label>
                                    <Input
                                        type="number"
                                        name="value"
                                        required
                                        min="1"
                                        max="100"
                                        value={formData.value}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Max Cap (Optional)</Label>
                                    <Input
                                        type="number"
                                        name="max_discount_amount"
                                        placeholder="No Limit"
                                        value={formData.max_discount_amount || ''}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>
                        )}

                        {formData.offer_type === 'bxgy' && (
                            <>
                                <div className="grid gap-4 sm:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label>Buy Quantity (X)</Label>
                                        <Input
                                            type="number"
                                            name="buy_quantity"
                                            required
                                            min="1"
                                            value={formData.buy_quantity || ''}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Get Free (Y)</Label>
                                        <Input
                                            type="number"
                                            name="get_quantity"
                                            required
                                            min="1"
                                            value={formData.get_quantity || ''}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Strategy</Label>
                                        <Select
                                            value={formData.bxgy_strategy}
                                            onValueChange={(val) => handleSelectChange('bxgy_strategy', val)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="mixed">Mix & Match (Pool)</SelectItem>
                                                <SelectItem value="same_product">Same Product Only</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2 pt-2">
                                    <Switch
                                        id="cheapest_free"
                                        checked={formData.is_cheapest_free}
                                        onCheckedChange={(checked) => handleSwitchChange('is_cheapest_free', checked)}
                                    />
                                    <Label htmlFor="cheapest_free">Cheapest Item Free</Label>
                                </div>
                            </>
                        )}

                        {formData.offer_type === 'cart_value' && (
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Min Order Value</Label>
                                    <Input
                                        type="number"
                                        name="min_order_value"
                                        required
                                        min="0"
                                        value={formData.min_order_value}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>
                                        {formData.benefit_type === 'credit_points' ? 'Points Value / Percent' : 'Discount Amount / Percent'}
                                    </Label>
                                    <div className="flex gap-2">
                                        <Input
                                            type="number"
                                            name="value"
                                            required
                                            value={formData.value}
                                            onChange={handleInputChange}
                                        />
                                        <Select
                                            value={formData.value_type}
                                            onValueChange={(val) => handleSelectChange('value_type', val)}
                                        >
                                            <SelectTrigger className="w-[100px]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="percent">%</SelectItem>
                                                <SelectItem value="amount">Flat</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Eligibility / Targets */}
                {formData.offer_type !== 'cart_value' && (
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Eligible Products</CardTitle>
                            <Button type="button" variant="outline" size="sm" onClick={addTarget} className="gap-2">
                                <Plus size={16} /> Add Rule
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {targets.map((target, index) => (
                                <div key={index} className="flex gap-4 items-end bg-accent/20 p-3 rounded-md">
                                    <div className="flex-1 space-y-2">
                                        <Label>Target Type</Label>
                                        <Select
                                            value={target.target_type}
                                            onValueChange={(val) => updateTarget(index, 'target_type', val)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all_products">All Products</SelectItem>
                                                <SelectItem value="product">Specific Product</SelectItem>
                                                <SelectItem value="category">Specific Category</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {target.target_type === 'product' && (
                                        <div className="flex-1 space-y-2">
                                            <Label>Select Products</Label>
                                            <ProductMultiSelect
                                                selectedIds={target.product_ids || (target.product_id ? [String(target.product_id)] : [])}
                                                onSelectionChange={(ids) => updateTarget(index, 'product_ids', ids)}
                                                initialProducts={availableProducts}
                                            />
                                        </div>
                                    )}

                                    {target.target_type === 'category' && (
                                        <div className="flex-1 space-y-2">
                                            <Label>Select Category</Label>
                                            <Select
                                                value={target.category_id ? String(target.category_id) : undefined}
                                                onValueChange={(val) => updateTarget(index, 'category_id', val)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Choose Category" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {availableCategories.map(c => (
                                                        <SelectItem key={c.id} value={String(c.id)}>
                                                            {c.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}

                                    <div className="flex items-center space-x-2 pb-3">
                                        <Switch
                                            checked={target.is_excluded}
                                            onCheckedChange={(checked) => updateTarget(index, 'is_excluded', checked)}
                                        />
                                        <Label>Exclude</Label>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="text-red-500"
                                            onClick={() => removeTarget(index)}
                                        >
                                            <Trash2 size={16} />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}

                {/* Availability */}
                <Card>
                    <CardHeader>
                        <CardTitle>Validity & Limits</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Start Date</Label>
                                <Input
                                    type="date"
                                    name="start_date"
                                    required
                                    value={formData.start_date}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>End Date</Label>
                                <Input
                                    type="date"
                                    name="end_date"
                                    value={formData.end_date}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="is_active"
                                checked={formData.is_active}
                                onCheckedChange={(checked) => handleSwitchChange('is_active', checked)}
                            />
                            <Label htmlFor="is_active">Offer is Active</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="is_stackable"
                                checked={formData.is_stackable}
                                onCheckedChange={(checked) => handleSwitchChange('is_stackable', checked)}
                            />
                            <Label htmlFor="is_stackable">Allow Stacking</Label>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            If enabled, this offer can be applied along with other offers on the same item.
                        </p>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-4">
                    <Link href="/dashboard/offers">
                        <Button variant="outline" type="button">Cancel</Button>
                    </Link>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : 'Create Offer'}
                        <Save className="w-4 h-4 ml-2" />
                    </Button>
                </div>
            </form>
        </div >
    );
}
