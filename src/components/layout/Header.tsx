'use client';

import Image from 'next/image';
import { useOrgContext } from '@/hooks/useOrgContext';

const Header = () => {
    const { org, shopName, locationIds, locationId } = useOrgContext();
    const displayName = shopName ?? 'Retailer';
    const orgLabel = org?.name;

    return (
        <header className="h-16 border-b bg-card flex items-center justify-between px-6 sticky top-0 z-10 shadow-sm shadow-black/[0.01]">
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-2.5 md:hidden">
                    <Image
                        src="/icon.png"
                        alt="Order Easy Retailer Icon"
                        width={36}
                        height={36}
                        className="rounded-lg object-contain shrink-0"
                    />
                    <div className="min-w-0">
                        <span className="text-base font-bold text-foreground truncate max-w-[150px] sm:max-w-[250px] block">
                            {displayName}
                        </span>
                        {orgLabel && orgLabel !== displayName && (
                            <span className="text-[10px] text-muted-foreground truncate block max-w-[150px]">
                                {orgLabel}
                            </span>
                        )}
                    </div>
                </div>
                <div className="hidden md:block">
                    <h2 className="text-lg font-semibold text-gray-800">Order Easy Retailer Dashboard</h2>
                    {orgLabel && (
                        <p className="text-xs text-muted-foreground">
                            {orgLabel}
                            {locationIds.length > 1 && locationId
                                ? ` · Location #${locationId}`
                                : ''}
                        </p>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-4">
                <div className="text-sm text-muted-foreground hidden sm:block">
                    Welcome back, <span className="font-medium text-foreground">{displayName}</span>!
                </div>
            </div>
        </header>
    );
};

export default Header;
