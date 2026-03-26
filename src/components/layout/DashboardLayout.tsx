import Sidebar from './Sidebar';
import Header from './Header';
import BottomNav from './BottomNav';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
    return (
        <div className="min-h-screen bg-background pb-16 md:pb-0 font-sans selection:bg-primary/20">
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_right,var(--color-primary),transparent)] opacity-[0.03] pointer-events-none" />
            <Sidebar />
            <div className="md:ml-64 flex flex-col min-h-screen relative z-10">
                <Header />
                <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                    {children}
                </main>
            </div>
            <BottomNav />
        </div>
    );
};

export default DashboardLayout;
