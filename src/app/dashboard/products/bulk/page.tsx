"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BulkUpload } from "@/components/products/BulkUpload";
import { SessionList } from "@/components/products/SessionList";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function BulkProductsPage() {
    const router = useRouter();

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Bulk Add Products</h2>
                    <p className="text-muted-foreground">
                        Upload Excel files or process scanner sessions from the mobile app.
                    </p>
                </div>
            </div>

            <Tabs defaultValue="upload" className="w-full">
                <TabsList className="grid w-full max-w-[400px] grid-cols-2">
                    <TabsTrigger value="upload">File Upload</TabsTrigger>
                    <TabsTrigger value="sessions">Scanner Sessions</TabsTrigger>
                </TabsList>

                <TabsContent value="upload" className="mt-6">
                    <BulkUpload />
                </TabsContent>

                <TabsContent value="sessions" className="mt-6">
                    <SessionList />
                </TabsContent>
            </Tabs>
        </div>
    );
}
