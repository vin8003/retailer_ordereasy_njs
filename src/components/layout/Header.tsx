'use client';

import { useEffect, useState } from 'react';
import { authService } from '@/services/api';

import { ShoppingBag } from 'lucide-react';

const Header = () => {
    const [shopName, setShopName] = useState<string>('Retailer');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await authService.fetchProfile();
                if (response.data && response.data.shop_name) {
                    setShopName(response.data.shop_name);
                } else if (response.data && response.data.user && response.data.user.shop_name) {
                    setShopName(response.data.user.shop_name);
                }
            } catch (error) {
                console.error('Failed to fetch profile', error);
            }
        };

        fetchProfile();
    }, []);

    // Get initials for shop icon
    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || 'R';
    };

    return (
        <header className="h-16 border-b bg-card flex items-center justify-between px-6 sticky top-0 z-10 shadow-sm shadow-black/[0.01]">
            <div className="flex items-center gap-2">
                {/* Mobile Shop Branding */}
                <div className="flex items-center gap-2.5 md:hidden">
                    <div className="size-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-md shadow-primary/20 shrink-0">
                        {getInitials(shopName)}
                    </div>
                    <span className="text-base font-bold text-foreground truncate max-w-[150px] sm:max-w-[250px]">{shopName}</span>
                </div>
                {/* Desktop title */}
                <h2 className="text-lg font-semibold hidden md:block text-gray-800">Retailer Dashboard</h2>
            </div>
            <div className="flex items-center gap-4">
                <div className="text-sm text-muted-foreground hidden sm:block">
                    Welcome back, <span className="font-medium text-foreground">{shopName}</span>!
                </div>
            </div>
        </header>
    );
};

export default Header;
