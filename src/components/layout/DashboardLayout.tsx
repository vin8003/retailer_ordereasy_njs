import Sidebar from './Sidebar';
import Header from './Header';
import BottomNav from './BottomNav';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
    return (
        <div className="min-h-screen bg-background pb-16 md:pb-0">
            <Sidebar />
            <div className="md:ml-64 flex flex-col min-h-screen">
                <Header />
                <main className="flex-1 p-6 overflow-y-auto">
                    {children}
                </main>
            </div>
            <BottomNav />
        </div>
    );
};

export default DashboardLayout;
