"use client";

import { useEffect, useState } from "react";
import { productService } from "@/services/api";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QrCode, ChevronRight, Clock } from "lucide-react";

export function SessionList() {
    const router = useRouter();
    const [sessions, setSessions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSessions = async () => {
        setIsLoading(true);
        try {
            const response = await productService.getActiveSessions();
            setSessions(response.data);
            setError(null);
        } catch (err: any) {
            console.error("Failed to load sessions", err);
            setError("Failed to load active sessions");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading sessions...</div>;

    if (error) {
        return (
            <div className="p-8 text-center">
                <p className="text-red-500 mb-4">{error}</p>
                <button onClick={fetchSessions} className="text-primary hover:underline">Retry</button>
            </div>
        );
    }

    if (sessions.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground bg-muted/10 rounded-lg border-2 border-dashed">
                <QrCode className="mx-auto h-12 w-12 mb-3 opacity-50" />
                <h3 className="text-lg font-medium">No Active Sessions</h3>
                <p>Use the Mobile Scanner App to start scanning products.</p>
            </div>
        );
    }

    return (
        <div className="h-[600px] pr-4 overflow-y-auto custom-scrollbar">
            <div className="space-y-4">
                {sessions.map((session) => (
                    <Card
                        key={session.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => router.push(`/dashboard/products/bulk/details?id=${session.id}`)}
                    >
                        <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0">
                            <div className="flex items-center gap-4">
                                <div className="bg-primary/10 p-2 rounded-full">
                                    <QrCode className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <CardTitle className="text-base">Session #{session.id}</CardTitle>
                                    <CardDescription className="flex items-center gap-1 mt-1">
                                        <Clock className="h-3 w-3" />
                                        {new Date(session.created_at).toLocaleString()}
                                    </CardDescription>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <Badge variant="secondary">{session.items?.length || 0} Items</Badge>
                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            </div>
                        </CardHeader>
                    </Card>
                ))}
            </div>
        </div>
    );
}
