'use client';

import { useEffect, useState } from 'react';
import { authService } from '@/services/api';

const Header = () => {
    const [shopName, setShopName] = useState<string>('Retailer');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await authService.fetchProfile();
                // Assuming the response matches the Flutter profile model which likely has store_name or shop_name
                // Based on analysis, let's assume 'shop_name' or similar. 
                // If not found, fallback to 'Retailer'.
                // We will adjust this if the API response structure is known to be different.
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

    return (
        <header className="h-16 border-b bg-card flex items-center justify-between px-6 sticky top-0 z-10">
            <h2 className="text-lg font-semibold">Retailer Dashboard</h2>
            <div className="flex items-center gap-4">
                <div className="text-sm text-muted-foreground">
                    Welcome back, <span className="font-medium text-foreground">{shopName}</span>!
                </div>
            </div>
        </header>
    );
};

export default Header;
