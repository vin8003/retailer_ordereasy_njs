'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, LogOut, Upload, User, MapPin, Store, CreditCard, ScanLine, CheckCircle, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import PhoneVerification from '@/components/auth/PhoneVerification';

interface RetailerProfile {
    // Basic
    shopName: string;
    shopDescription?: string;
    username: string;

    // Contact
    contactEmail: string;
    contactPhone: string;
    whatsappNumber?: string;
    isPhoneVerified?: boolean;

    // Address
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    country: string;

    // Business
    businessType?: string;
    gstNumber?: string;
    panNumber?: string;
    upiId?: string;
    upiQrCode?: string; // URL
    acceptsCod: boolean;
    acceptsUpi: boolean;

    // Settings
    offersDelivery: boolean;
    offersPickup: boolean;
    deliveryRadius: number;
    minimumOrderAmount: number;
    deliveryCharge: number;
    freeDeliveryThreshold: number;
    serviceablePincodes: string[];

    // Images
    shopImage?: string;
}

export default function ProfilePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [profile, setProfile] = useState<RetailerProfile | null>(null);
    const [allCategories, setAllCategories] = useState<{ id: number; name: string }[]>([]);
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);

    // Form States (controlled inputs for simplicity)
    const [formData, setFormData] = useState<Partial<RetailerProfile>>({});

    // File Uploads
    const [shopImageFile, setShopImageFile] = useState<File | null>(null);
    const [qrCodeFile, setQrCodeFile] = useState<File | null>(null);

    // Phone Verification
    const [showVerification, setShowVerification] = useState(false);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const response = await authService.fetchProfile();
            if (response.status === 200) {
                // Map API snake_case to camelCase
                const data = response.data;
                const mappedProfile: RetailerProfile = {
                    shopName: data.shop_name,
                    shopDescription: data.shop_description,
                    username: data.username,
                    contactEmail: data.contact_email,
                    contactPhone: data.contact_phone, // This is profile contact phone, usually same as user phone
                    whatsappNumber: data.whatsapp_number,
                    isPhoneVerified: data.is_phone_verified, // Added to serializer
                    addressLine1: data.address_line1,
                    addressLine2: data.address_line2,
                    city: data.city,
                    state: data.state,
                    pincode: data.pincode,
                    country: data.country,
                    businessType: data.business_type,
                    gstNumber: data.gst_number,
                    panNumber: data.pan_number,
                    upiId: data.upi_id,
                    upiQrCode: data.upi_qr_code,
                    acceptsCod: data.accepts_cod,
                    acceptsUpi: data.accepts_upi,
                    offersDelivery: data.offers_delivery,
                    offersPickup: data.offers_pickup,
                    deliveryRadius: data.delivery_radius,
                    minimumOrderAmount: data.minimum_order_amount,
                    deliveryCharge: data.delivery_charge || 0,
                    freeDeliveryThreshold: data.free_delivery_threshold || 0,
                    serviceablePincodes: data.serviceable_pincodes || [],
                    shopImage: data.shop_image,
                };
                setProfile(mappedProfile);
                setFormData(mappedProfile);
                setSelectedCategoryIds(data.categories?.map((c: any) => c.id) || []);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load profile");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const loadPageData = async () => {
             await fetchProfile();
             try {
                 const res = await authService.fetchRetailerCategories();
                 if (res.status === 200) {
                     setAllCategories(res.data);
                 }
             } catch (error) {
                 console.error("Error fetching categories:", error);
             }
        };
        loadPageData();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        router.push('/login');
        toast.success("Logged out successfully");
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const formDataToSend = new FormData();

            Object.entries(formData).forEach(([key, value]) => {
                const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);

                if (key === 'serviceablePincodes' && Array.isArray(value)) {
                    value.forEach(p => formDataToSend.append('serviceable_pincodes', p));
                } else if (value !== undefined && value !== null && key !== 'isPhoneVerified') {
                    formDataToSend.append(snakeKey, value.toString());
                }
            });

            selectedCategoryIds.forEach(id => formDataToSend.append('categories', id.toString()));

            if (shopImageFile) {
                formDataToSend.append('shop_image', shopImageFile);
            }
            if (qrCodeFile) {
                formDataToSend.append('upi_qr_code', qrCodeFile);
            }

            const response = await authService.updateProfile(formDataToSend);
            if (response.status === 200) {
                toast.success("Profile updated successfully");
                setIsEditing(false);
                fetchProfile(); // Refresh
            }
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.detail || "Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    const formatImageUrl = (path?: string) => {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        const baseUrl = 'https://api.ordereasy.win';
        return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!profile) return null;

    return (
        <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
            <PhoneVerification
                isOpen={showVerification}
                onClose={() => setShowVerification(false)}
                initialPhone={profile.contactPhone}
                onVerified={() => {
                    fetchProfile();
                    setShowVerification(false);
                }}
            />

            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Store Profile</h1>
                {!isEditing && (
                    <div className="flex gap-2">
                        <Button variant="destructive" onClick={handleLogout}>
                            <LogOut className="mr-2 h-4 w-4" /> Logout
                        </Button>
                        <Button onClick={() => setIsEditing(true)}>
                            Edit Profile
                        </Button>
                    </div>
                )}
                {isEditing && (
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => { setIsEditing(false); setFormData(profile); }}>Cancel</Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Column: Image & Contact */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Display Picture</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center gap-4">
                            <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
                                <AvatarImage src={shopImageFile ? URL.createObjectURL(shopImageFile) : formatImageUrl(profile.shopImage)} />
                                <AvatarFallback className="text-4xl">{profile.shopName?.[0]}</AvatarFallback>
                            </Avatar>
                            {isEditing && (
                                <div className="w-full">
                                    <Label htmlFor="shop-image" className="cursor-pointer">
                                        <div className="flex items-center justify-center gap-2 border border-dashed rounded-md p-4 hover:bg-slate-50">
                                            <Upload className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm text-muted-foreground">Change Image</span>
                                        </div>
                                    </Label>
                                    <Input
                                        id="shop-image"
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => {
                                            if (e.target.files?.[0]) setShopImageFile(e.target.files[0]);
                                        }}
                                    />
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Contact Info</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input disabled={!isEditing} value={formData.contactEmail} onChange={e => setFormData({ ...formData, contactEmail: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <Label>Phone</Label>
                                    <div className="flex items-center gap-1">
                                        {profile.isPhoneVerified ? (
                                            <span className="flex items-center text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                                                <CheckCircle className="w-3 h-3 mr-1" /> Verified
                                            </span>
                                        ) : (
                                            <Button
                                                variant="link"
                                                size="sm"
                                                className="h-auto p-0 text-xs text-blue-600 font-normal"
                                                onClick={() => setShowVerification(true)}
                                            >
                                                Verify Now
                                            </Button>
                                        )}
                                    </div>
                                </div>
                                <Input disabled={!isEditing} value={formData.contactPhone} onChange={e => setFormData({ ...formData, contactPhone: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>WhatsApp</Label>
                                <Input disabled={!isEditing} value={formData.whatsappNumber || ''} onChange={e => setFormData({ ...formData, whatsappNumber: e.target.value })} />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Middle & Right: Details Form */}
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Store className="h-5 w-5 text-blue-600" />
                                <CardTitle>Basic Information</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Shop Name</Label>
                                <Input disabled={!isEditing} value={formData.shopName} onChange={e => setFormData({ ...formData, shopName: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea disabled={!isEditing} value={formData.shopDescription || ''} onChange={e => setFormData({ ...formData, shopDescription: e.target.value })} />
                            </div>

                            <div className="space-y-2">
                                <Label>Store Categories</Label>
                                <div className="flex flex-wrap gap-2 pt-1">
                                    {[...allCategories].sort((a, b) => {
                                        const order = ['Grocery', 'Food', 'Customize Gift', 'Others'];
                                        const indexA = order.indexOf(a.name);
                                        const indexB = order.indexOf(b.name);
                                        return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
                                    }).map(cat => {
                                        const isSelected = selectedCategoryIds.includes(cat.id);
                                        return (
                                            <Button
                                                key={cat.id}
                                                type="button"
                                                variant={isSelected ? "default" : "outline"}
                                                size="sm"
                                                className={`rounded-full transition-all ${
                                                    isSelected 
                                                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm' 
                                                        : 'hover:bg-slate-50'
                                                }`}
                                                disabled={!isEditing}
                                                onClick={() => {
                                                    const newIds = isSelected 
                                                        ? selectedCategoryIds.filter(id => id !== cat.id) 
                                                        : [...selectedCategoryIds, cat.id];
                                                    setSelectedCategoryIds(newIds);
                                                }}
                                            >
                                                {cat.name}
                                            </Button>
                                        );
                                    })}
                                </div>
                                <p className="text-xs text-muted-foreground">Select all that apply to your store</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <MapPin className="h-5 w-5 text-green-600" />
                                <CardTitle>Address</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Address Line 1</Label>
                                <Input disabled={!isEditing} value={formData.addressLine1} onChange={e => setFormData({ ...formData, addressLine1: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Address Line 2</Label>
                                <Input disabled={!isEditing} value={formData.addressLine2 || ''} onChange={e => setFormData({ ...formData, addressLine2: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>City</Label>
                                    <Input disabled={!isEditing} value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>State</Label>
                                    <Input disabled={!isEditing} value={formData.state} onChange={e => setFormData({ ...formData, state: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Pincode</Label>
                                    <Input disabled={!isEditing} value={formData.pincode} onChange={e => setFormData({ ...formData, pincode: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Country</Label>
                                    <Input disabled={!isEditing} value={formData.country} onChange={e => setFormData({ ...formData, country: e.target.value })} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5 text-purple-600" />
                                <CardTitle>Business & Payment</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Business Type</Label>
                                    <Input disabled={!isEditing} value={formData.businessType || ''} onChange={e => setFormData({ ...formData, businessType: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>GST Number</Label>
                                    <Input disabled={!isEditing} value={formData.gstNumber || ''} onChange={e => setFormData({ ...formData, gstNumber: e.target.value })} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>UPI ID</Label>
                                <Input disabled={!isEditing} value={formData.upiId || ''} onChange={e => setFormData({ ...formData, upiId: e.target.value })} />
                            </div>

                            <div className="grid grid-cols-2 gap-6 pt-2">
                                <div className="flex items-center justify-between border rounded-lg p-3 bg-slate-50">
                                    <div className="space-y-0.5">
                                        <Label className="text-sm">Accept Cash (COD)</Label>
                                        <div className="text-[10px] text-muted-foreground">Enable at-door/store cash</div>
                                    </div>
                                    <Switch
                                        disabled={!isEditing}
                                        checked={formData.acceptsCod}
                                        onCheckedChange={val => setFormData({ ...formData, acceptsCod: val })}
                                    />
                                </div>
                                <div className="flex items-center justify-between border rounded-lg p-3 bg-slate-50">
                                    <div className="space-y-0.5">
                                        <Label className="text-sm">Accept UPI</Label>
                                        <div className="text-[10px] text-muted-foreground">Enable digital payments</div>
                                    </div>
                                    <Switch
                                        disabled={!isEditing}
                                        checked={formData.acceptsUpi}
                                        onCheckedChange={val => setFormData({ ...formData, acceptsUpi: val })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 border rounded-lg p-4">
                                <div className="flex justify-between items-center mb-2">
                                    <Label>UPI QR Code</Label>
                                    {isEditing && (
                                        <div className=" text-right">
                                            <Label htmlFor="qr-code" className="cursor-pointer text-xs text-blue-600 hover:underline">
                                                Update QR
                                            </Label>
                                            <Input
                                                id="qr-code"
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={(e) => {
                                                    if (e.target.files?.[0]) setQrCodeFile(e.target.files[0]);
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                                <div className="flex justify-center bg-slate-100 p-4 rounded">
                                    {qrCodeFile ? (
                                        <p className="text-sm text-green-600">New QR Selected: {qrCodeFile.name}</p>
                                    ) : (formData.upiQrCode ? (
                                        <img src={formatImageUrl(formData.upiQrCode)} alt="QR Code" className="h-32 w-32 object-contain" />
                                    ) : (
                                        <div className="h-32 w-32 flex items-center justify-center text-muted-foreground">
                                            <ScanLine className="h-8 w-8" />
                                            <span className="ml-2">No QR</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Delivery Settings</CardTitle>
                            <CardDescription>Configure how you deliver to customers</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Offers Delivery</Label>
                                    <div className="text-sm text-muted-foreground">Enable direct delivery to customers</div>
                                </div>
                                <Switch
                                    disabled={!isEditing}
                                    checked={formData.offersDelivery}
                                    onCheckedChange={val => setFormData({ ...formData, offersDelivery: val })}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Offers Pickup</Label>
                                    <div className="text-sm text-muted-foreground">Allow customers to pick up orders</div>
                                </div>
                                <Switch
                                    disabled={!isEditing}
                                    checked={formData.offersPickup}
                                    onCheckedChange={val => setFormData({ ...formData, offersPickup: val })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Delivery Radius (km)</Label>
                                    <Input
                                        type="number"
                                        disabled={!isEditing}
                                        value={formData.deliveryRadius}
                                        onChange={e => setFormData({ ...formData, deliveryRadius: parseFloat(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Min Order Amount</Label>
                                    <Input
                                        type="number"
                                        disabled={!isEditing}
                                        value={formData.minimumOrderAmount}
                                        onChange={e => setFormData({ ...formData, minimumOrderAmount: parseFloat(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Serviceable Pincodes (Comma separated)</Label>
                                <Input
                                    disabled={!isEditing}
                                    value={Array.isArray(formData.serviceablePincodes) ? formData.serviceablePincodes.join(', ') : ''}
                                    onChange={e => setFormData({ ...formData, serviceablePincodes: e.target.value.split(',').map(s => s.trim()) })}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Delivery Charges</CardTitle>
                            <CardDescription>Configure delivery fees and free delivery thresholds</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Delivery Charge</Label>
                                    <Input
                                        type="number"
                                        disabled={!isEditing}
                                        value={formData.deliveryCharge || 0}
                                        onChange={e => setFormData({ ...formData, deliveryCharge: parseFloat(e.target.value) })}
                                    />
                                    <p className="text-xs text-muted-foreground">Standard delivery fee</p>
                                </div>
                                <div className="space-y-2">
                                    <Label>Free Delivery Above</Label>
                                    <Input
                                        type="number"
                                        disabled={!isEditing}
                                        value={formData.freeDeliveryThreshold || 0}
                                        onChange={e => setFormData({ ...formData, freeDeliveryThreshold: parseFloat(e.target.value) })}
                                    />
                                    <p className="text-xs text-muted-foreground">Order amount to waive delivery fee</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
