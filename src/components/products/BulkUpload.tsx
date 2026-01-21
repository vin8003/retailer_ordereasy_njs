"use client";

import { useState, useRef } from "react";
import { Upload, FileDown, CheckCircle, AlertTriangle, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { productService } from "@/services/api";

export function BulkUpload() {
    const [file, setFile] = useState<File | null>(null);
    const [isChecking, setIsChecking] = useState(false);
    const [checkResult, setCheckResult] = useState<any>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setCheckResult(null); // Reset check if file changes
        }
    };

    const handleCheck = async () => {
        if (!file) return;
        setIsChecking(true);
        try {
            const response = await productService.checkBulkUpload(file);
            setCheckResult(response.data);
            toast.success("File checked successfully!");
        } catch (error: any) {
            console.error("Check failed", error);
            const msg = error.response?.data?.error || "Failed to check file";
            toast.error(msg);
        } finally {
            setIsChecking(false);
        }
    };

    const handleCompleteUpload = async () => {
        if (!file) return;
        setIsUploading(true);
        try {
            const response = await productService.completeBulkUpload(file);
            toast.success(`Upload completed: ${response.data.success_count} success, ${response.data.failed_count} failed`);
            // Reset
            setFile(null);
            setCheckResult(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
        } catch (error: any) {
            console.error("Upload failed", error);
            const msg = error.response?.data?.error || "Failed to complete upload";
            toast.error(msg);
        } finally {
            setIsUploading(false);
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            const response = await productService.downloadTemplate();
            // Create blob link to download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'product_template.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            toast.error("Failed to download template");
        }
    };

    const handleDownloadUnmatched = () => {
        if (!checkResult?.unmatched_file_url) return;
        window.open(checkResult.unmatched_file_url, '_blank');
    };

    return (
        <div className="space-y-6 max-w-2xl mx-auto p-4">
            <div className="bg-card border rounded-lg p-6 space-y-4">
                <h3 className="text-lg font-medium">Step 1: Upload Excel/CSV</h3>
                <p className="text-sm text-muted-foreground">
                    Upload your product list to check for matches against our main catalog.
                </p>

                <div className="flex items-center gap-4">
                    <Button variant="outline" onClick={handleDownloadTemplate} className="gap-2">
                        <FileDown className="h-4 w-4" /> Download Template
                    </Button>
                </div>

                <div
                    className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv, .xlsx, .xls"
                        className="hidden"
                        onChange={handleFileChange}
                    />

                    {file ? (
                        <div className="flex flex-col items-center gap-2">
                            <FileSpreadsheet className="h-10 w-10 text-green-600" />
                            <span className="font-medium">{file.name}</span>
                            <span className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</span>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2">
                            <Upload className="h-10 w-10 text-muted-foreground" />
                            <span>Click to upload or drag and drop</span>
                            <span className="text-xs text-muted-foreground">Excel or CSV files</span>
                        </div>
                    )}
                </div>

                {file && !checkResult && (
                    <Button onClick={handleCheck} disabled={isChecking} className="w-full">
                        {isChecking ? "Checking File..." : "Check Products"}
                    </Button>
                )}
            </div>

            {checkResult && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                    <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertTitle>File Analysis Complete</AlertTitle>
                        <AlertDescription>
                            Found {checkResult.matched_count} matching products and {checkResult.unmatched_count} unmatched items.
                        </AlertDescription>
                    </Alert>

                    {checkResult.unmatched_count > 0 && (
                        <div className="border border-orange-200 bg-orange-50 p-4 rounded-lg space-y-2 dark:bg-orange-950/20 dark:border-orange-800">
                            <div className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
                                <AlertTriangle className="h-4 w-4" />
                                <span className="font-medium">Unmatched Items Found</span>
                            </div>
                            <p className="text-sm text-orange-700 dark:text-orange-300">
                                Some items could not be automatically matched. You can download them, fill in the missing details (Category, Brand), and re-upload.
                            </p>
                            <Button size="sm" variant="outline" onClick={handleDownloadUnmatched} className="bg-white dark:bg-black mt-2">
                                Download Unmatched Items
                            </Button>
                        </div>
                    )}

                    <div className="flex justify-end pt-4">
                        <Button onClick={handleCompleteUpload} disabled={isUploading} size="lg">
                            {isUploading ? "Uploading..." : "Complete Upload"}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
