import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import Image from 'next/image';
import { useOrgContext } from '@/hooks/useOrgContext';
import { filterNavByModules } from '@/lib/org';
import {
    LayoutDashboard,
    ShoppingBag,
    ClipboardList,
    Users,
    Award,
    User,
    LogOut,
    Star,
    Clock,
    Layers,
    Calculator,
    Package,
    BookOpen,
    Barcode,
    Tag,
    Inbox,
    Shield,
} from 'lucide-react';

const Sidebar = ({ pendingCount }: { pendingCount: number }) => {
    const pathname = usePathname();
    const { moduleFlags, canAccessSettings, org, shopName } = useOrgContext();

    const handleLogout = () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            window.location.href = '/login';
        }
    };

    const navItems = useMemo(() => {
        const items = [
            { label: 'Overview', icon: LayoutDashboard, href: '/dashboard' },
            { label: 'Inbox', icon: Inbox, href: '/dashboard/inbox' },
            { label: 'POS Billing', icon: Calculator, href: '/dashboard/pos' },
            { label: 'Purchases', icon: Package, href: '/dashboard/purchases' },
            { label: 'Khata/Suppliers', icon: BookOpen, href: '/dashboard/suppliers' },
            { label: 'Products', icon: ShoppingBag, href: '/dashboard/products' },
            { label: 'Print Labels', icon: Barcode, href: '/dashboard/print-labels' },
            { label: 'Display Labels', icon: Tag, href: '/dashboard/display-labels' },
            { label: 'Categories', icon: Layers, href: '/dashboard/categories' },
            { label: 'Orders', icon: ClipboardList, href: '/dashboard/orders' },
            { label: 'Reviews', icon: Star, href: '/dashboard/reviews' },
            { label: 'Customers', icon: Users, href: '/dashboard/customers' },
            { label: 'Offers', icon: Award, href: '/dashboard/offers' },
            { label: 'Profile', icon: User, href: '/dashboard/profile' },
            { label: 'Operating Hours', icon: Clock, href: '/dashboard/operating-hours' },
        ];

        if (canAccessSettings) {
            items.push({ label: 'Settings', icon: Shield, href: '/dashboard/settings' });
        }

        return filterNavByModules(items, moduleFlags);
    }, [moduleFlags, canAccessSettings]);

    return (
        <aside className="hidden md:flex flex-col w-64 bg-sidebar border-r border-sidebar-border h-full fixed left-0 top-0 shadow-xl shadow-primary/5">
            <div className="p-6 border-b border-sidebar-border/50">
                <Link href="/dashboard" className="flex flex-col items-center justify-center gap-1">
                    <Image
                        src="/logo.png"
                        alt="Order Easy Retailer Logo"
                        width={180}
                        height={60}
                        className="h-12 w-auto object-contain"
                        priority
                    />
                    {(org?.name || shopName) && (
                        <span className="text-[10px] text-muted-foreground truncate max-w-[200px] text-center">
                            {org?.name ?? shopName}
                        </span>
                    )}
                </Link>
            </div>

            <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto pt-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
                                isActive
                                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 font-semibold'
                                    : 'text-muted-foreground hover:bg-white/80 hover:text-primary hover:translate-x-1'
                                }`}
                        >
                            <item.icon size={20} className={isActive ? 'text-primary-foreground' : 'group-hover:text-primary transition-colors'} />
                            <span className="flex-1">{item.label}</span>
                            
                            {(item.label === 'Orders' || item.label === 'Inbox') && pendingCount > 0 && (
                                <span className="flex items-center gap-1 bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-lg animate-pulse ring-4 ring-red-500/20 shadow-lg shadow-red-600/30 uppercase tracking-tight ml-auto">
                                    <span className="size-1 bg-white rounded-full animate-ping"></span>
                                    {pendingCount}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-500 hover:bg-red-500/10 transition-all duration-300 group"
                >
                    <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="font-medium">Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
