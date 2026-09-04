'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
    LayoutDashboard, 
    ShoppingBag, 
    ClipboardList, 
    Menu, 
    User,
    Layers,
    Users,
    Award,
    Star,
    Clock,
    LogOut,
    Calculator,
    Package,
    BookOpen,
    Barcode
} from 'lucide-react';
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer";

const BottomNav = () => {
    const pathname = usePathname();

    const mainNavItems = [
        { label: 'Home', icon: LayoutDashboard, href: '/dashboard' },
        { label: 'POS', icon: Calculator, href: '/dashboard/pos' },
        { label: 'Orders', icon: ClipboardList, href: '/dashboard/orders' },
    ];

    const moreNavItems = [
        { label: 'Products', icon: ShoppingBag, href: '/dashboard/products' },
        { label: 'Print Labels', icon: Barcode, href: '/dashboard/print-labels' },
        { label: 'Purchases', icon: Package, href: '/dashboard/purchases' },
        { label: 'Suppliers', icon: BookOpen, href: '/dashboard/suppliers' },
        { label: 'Profile', icon: User, href: '/dashboard/profile' },
        { label: 'Categories', icon: Layers, href: '/dashboard/categories' },
        { label: 'Customers', icon: Users, href: '/dashboard/customers' },
        { label: 'Reviews', icon: Star, href: '/dashboard/reviews' },
        { label: 'Offers', icon: Award, href: '/dashboard/offers' },
        { label: 'Operating Hours', icon: Clock, href: '/dashboard/operating-hours' },
    ];

    const handleLogout = () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            window.location.href = '/login';
        }
    };

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-border z-50 flex items-center justify-around pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
            {mainNavItems.map((item) => {
                const isItemActive = item.href === '/dashboard' 
                    ? pathname === '/dashboard' 
                    : pathname.startsWith(item.href);

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`flex flex-col items-center justify-center py-3 space-y-1 transition-all duration-300 w-1/4 relative ${
                            isItemActive ? 'text-primary' : 'text-muted-foreground hover:text-primary'
                        }`}
                    >
                        {isItemActive && (
                            <div className="absolute top-0 w-8 h-1 bg-primary rounded-b-full shadow-lg shadow-primary/40 transition-all animate-in slide-in-from-top-1" />
                        )}
                        <item.icon className={`h-5 w-5 transition-transform duration-300 ${isItemActive ? 'scale-110' : ''}`} />
                        <span className={`text-[10px] font-semibold tracking-wide ${isItemActive ? 'opacity-100' : 'opacity-70'}`}>{item.label}</span>
                    </Link>
                );
            })}

            {/* Menu Drawer */}
            <Drawer>
                <DrawerTrigger asChild>
                    <button className="flex flex-col items-center justify-center py-2 space-y-1 transition-colors w-1/4 text-muted-foreground hover:text-foreground">
                        <Menu className="h-5 w-5" />
                        <span className="text-[10px] font-medium">Menu</span>
                    </button>
                </DrawerTrigger>
                <DrawerContent>
                    <DrawerHeader>
                        <DrawerTitle className="text-left">More Options</DrawerTitle>
                    </DrawerHeader>
                    <div className="grid grid-cols-3 gap-4 p-4 pb-8">
                        {moreNavItems.map((item) => {
                            const isItemActive = pathname === item.href || pathname.startsWith(item.href);
                            return (
                                <DrawerClose asChild key={item.href}>
                                    <Link
                                        href={item.href}
                                        className={`flex flex-col items-center justify-center gap-2 p-3 rounded-lg border bg-card text-center transition-colors ${
                                            isItemActive ? 'border-primary bg-primary/5 text-primary' : 'hover:bg-muted'
                                        }`}
                                    >
                                        <item.icon className="h-6 w-6" />
                                        <span className="text-xs font-medium">{item.label}</span>
                                    </Link>
                                </DrawerClose>
                            )
                        })}
                        
                        <DrawerClose asChild>
                            <button
                                onClick={handleLogout}
                                className="flex flex-col items-center justify-center gap-2 p-3 rounded-lg border border-red-200 bg-red-50 text-red-600 text-center transition-colors hover:bg-red-100"
                            >
                                <LogOut className="h-6 w-6" />
                                <span className="text-xs font-medium">Logout</span>
                            </button>
                        </DrawerClose>
                    </div>
                </DrawerContent>
            </Drawer>
        </nav>
    );
};

export default BottomNav;
