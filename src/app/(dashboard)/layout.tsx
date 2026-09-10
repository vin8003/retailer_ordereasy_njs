"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { usePendingOrderCount } from "@/hooks/usePendingOrderCount";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pendingCount = usePendingOrderCount();

    useEffect(() => {
        // Basic auth check
        const token = localStorage.getItem("access_token");
        if (!token) {
            router.push("/login");
        }
    }, [router]);

    return (
        <div className="grid min-h-screen w-full lg:grid-cols-[250px_1fr]">
            <Sidebar pendingCount={pendingCount} />
            <div className="flex flex-col">
                <Header />
                <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
