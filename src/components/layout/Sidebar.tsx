import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
    Layers
} from 'lucide-react';

const Sidebar = () => {
    const pathname = usePathname();

    const handleLogout = () => {
        // Clear tokens and redirect
        if (typeof window !== 'undefined') {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            window.location.href = '/login';
        }
    };

    const navItems = [
        { label: 'Overview', icon: LayoutDashboard, href: '/dashboard' },
        { label: 'Products', icon: ShoppingBag, href: '/dashboard/products' },
        { label: 'Categories', icon: Layers, href: '/dashboard/categories' },
        { label: 'Orders', icon: ClipboardList, href: '/dashboard/orders' },
        { label: 'Reviews', icon: Star, href: '/dashboard/reviews' },
        { label: 'Customers', icon: Users, href: '/dashboard/customers' },
        { label: 'Offers', icon: Award, href: '/dashboard/offers' },
        { label: 'Profile', icon: User, href: '/dashboard/profile' },
        { label: 'Operating Hours', icon: Clock, href: '/dashboard/operating-hours' },
    ];

    return (
        <aside className="hidden md:flex flex-col w-64 bg-sidebar border-r border-sidebar-border h-full fixed left-0 top-0 shadow-xl shadow-primary/5">
            <div className="p-8">
                <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                        <ShoppingBag className="text-primary-foreground size-5" />
                    </div>
                    <h1 className="text-xl font-bold tracking-tight text-foreground">Retailer</h1>
                </div>
            </div>

            <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto pt-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${isActive
                                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 font-semibold'
                                : 'text-muted-foreground hover:bg-white/80 hover:text-primary hover:translate-x-1'
                                }`}
                        >
                            <item.icon size={20} className={isActive ? 'text-primary-foreground' : 'group-hover:text-primary transition-colors'} />
                            <span>{item.label}</span>
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
