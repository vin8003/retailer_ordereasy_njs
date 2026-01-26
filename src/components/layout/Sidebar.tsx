import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    ShoppingBag,
    ClipboardList,
    Users,
    Award,
    User,
    LogOut
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
        { label: 'Orders', icon: ClipboardList, href: '/dashboard/orders' },
        { label: 'Customers', icon: Users, href: '/dashboard/customers' },
        { label: 'Offers', icon: Award, href: '/dashboard/offers' },
        { label: 'Profile', icon: User, href: '/dashboard/profile' },
    ];

    return (
        <aside className="hidden md:flex flex-col w-64 bg-card border-r h-full fixed left-0 top-0">
            <div className="p-6 border-b">
                <h1 className="text-xl font-bold text-primary">Retailer</h1>
            </div>

            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${isActive
                                ? 'bg-primary/10 text-primary font-medium'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                }`}
                        >
                            <item.icon size={20} />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 w-full rounded-md text-red-500 hover:bg-red-50 transition-colors"
                >
                    <LogOut size={20} />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
