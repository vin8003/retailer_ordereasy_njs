'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { operatingHoursService } from '@/services/api';
import { toast } from 'sonner';
import { Loader2, Copy } from 'lucide-react';

type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

interface OperatingHour {
    day_of_week: DayOfWeek;
    is_open: boolean;
    opening_time: string;
    closing_time: string;
}

const DAYS = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' },
];

export default function OperatingHoursPage() {
    const [hours, setHours] = useState<OperatingHour[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchHours();
    }, []);

    const fetchHours = async () => {
        setIsLoading(true);
        try {
            const res = await operatingHoursService.getOperatingHours();
            if (res.data && Array.isArray(res.data)) {
                // Merge with default days to ensure all 7 exist in state
                const currentHours = res.data;
                const fullWeek = DAYS.map(d => {
                    const existing = currentHours.find((h: any) => h.day_of_week === d.value);
                    if (existing) {
                        return {
                            day_of_week: existing.day_of_week,
                            is_open: existing.is_open,
                            // Convert standard backend time (e.g. "09:00:00") to HH:mm for input type="time"
                            opening_time: existing.opening_time ? existing.opening_time.substring(0, 5) : '09:00',
                            closing_time: existing.closing_time ? existing.closing_time.substring(0, 5) : '21:00'
                        };
                    }
                    return {
                        day_of_week: d.value as DayOfWeek,
                        is_open: false,
                        opening_time: '09:00',
                        closing_time: '21:00'
                    };
                });
                setHours(fullWeek);
            }
        } catch (error) {
            console.error('Failed to fetch operating hours:', error);
            toast.error('Failed to load operating hours');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        // Validate times
        for (const h of hours) {
            if (h.is_open && h.opening_time >= h.closing_time) {
                toast.error(`Invalid times on ${h.day_of_week}. Opening must be before closing.`);
                return;
            }
        }

        setIsSaving(true);
        try {
            const formattedData = hours.map(h => ({
                day_of_week: h.day_of_week,
                is_open: h.is_open,
                opening_time: h.opening_time,
                closing_time: h.closing_time
            }));

            await operatingHoursService.updateOperatingHours({
                operating_hours: formattedData
            });

            toast.success('Operating hours updated successfully');
        } catch (error) {
            console.error('Failed to save operating hours:', error);
            toast.error('Failed to save operating hours');
        } finally {
            setIsSaving(false);
        }
    };

    const updateDay = (dayValue: DayOfWeek, field: keyof OperatingHour, value: any) => {
        setHours(prev => prev.map(h => {
            if (h.day_of_week === dayValue) {
                return { ...h, [field]: value };
            }
            return h;
        }));
    };

    const copyMondayToAll = () => {
        const monday = hours.find(h => h.day_of_week === 'monday');
        if (!monday) return;

        setHours(prev => prev.map(h => ({
            ...h,
            is_open: monday.is_open,
            opening_time: monday.opening_time,
            closing_time: monday.closing_time
        })));
        toast.info('Copied Monday\'s hours to all days');
    };

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Operating Hours</h1>
                    <p className="text-muted-foreground mt-2">
                        Set your store's regular working hours. Orders placed outside these hours will be scheduled for processing when you open next.
                    </p>
                </div>
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Save Changes
                </Button>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="space-y-1">
                        <CardTitle>Weekly Schedule</CardTitle>
                        <CardDescription>Configure open and close times for each day of the week.</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={copyMondayToAll} className="h-8">
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Monday to All
                    </Button>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="space-y-6">
                        {hours.map((hour) => {
                            const dayConfig = DAYS.find(d => d.value === hour.day_of_week);
                            return (
                                <div key={hour.day_of_week} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg bg-card">
                                    <div className="flex items-center gap-4 w-48">
                                        <Switch
                                            checked={hour.is_open}
                                            onCheckedChange={(val) => updateDay(hour.day_of_week, 'is_open', val)}
                                        />
                                        <Label className="font-medium text-base">
                                            {dayConfig?.label}
                                        </Label>
                                    </div>

                                    {hour.is_open ? (
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="flex items-center gap-2">
                                                <Label className="text-sm text-muted-foreground w-12 text-right">Opens</Label>
                                                <Input
                                                    type="time"
                                                    value={hour.opening_time}
                                                    onChange={(e) => updateDay(hour.day_of_week, 'opening_time', e.target.value)}
                                                    className="w-32"
                                                />
                                            </div>
                                            <span className="text-muted-foreground">-</span>
                                            <div className="flex items-center gap-2">
                                                <Label className="text-sm text-muted-foreground w-12 text-right">Closes</Label>
                                                <Input
                                                    type="time"
                                                    value={hour.closing_time}
                                                    onChange={(e) => updateDay(hour.day_of_week, 'closing_time', e.target.value)}
                                                    className="w-32"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex-1 text-muted-foreground italic px-4">
                                            Closed all day
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
