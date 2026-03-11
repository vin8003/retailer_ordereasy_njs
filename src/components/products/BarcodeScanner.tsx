"use client";

import React, { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats, Html5Qrcode } from "html5-qrcode";
import { X, Camera, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BarcodeScannerProps {
    onScanSuccess: (decodedText: string) => void;
    onClose: () => void;
}

export function BarcodeScanner({ onScanSuccess, onClose }: BarcodeScannerProps) {
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);
    const [hasCameraError, setHasCameraError] = useState(false);

    useEffect(() => {
        // Run only on client side
        if (typeof window === "undefined") return;

        // Clean up previous instance if needed
        if (scannerRef.current) {
            scannerRef.current.clear().catch(console.error);
        }

        const config = {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            formatsToSupport: [
                Html5QrcodeSupportedFormats.EAN_13,
                Html5QrcodeSupportedFormats.EAN_8,
                Html5QrcodeSupportedFormats.UPC_A,
                Html5QrcodeSupportedFormats.UPC_E,
                Html5QrcodeSupportedFormats.QR_CODE,
                Html5QrcodeSupportedFormats.CODE_128,
            ],
            aspectRatio: 1.0,
            disableFlip: false,
        };

        const scanner = new Html5QrcodeScanner(
            "reader",
            config,
            false // verbose
        );

        scanner.render(
            (decodedText) => {
                scanner.pause(true); // Pause scanning on success
                onScanSuccess(decodedText);
            },
            (error) => {
                // Ignore scanning errors (happens constantly while trying to find code)
            }
        );

        scannerRef.current = scanner;

        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(console.error);
            }
        };
    }, [onScanSuccess]);

    return (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center p-4">
            <div className="bg-card w-full max-w-sm rounded-lg shadow-lg border overflow-hidden relative">
                <div className="flex items-center justify-between p-4 border-b bg-muted/50">
                    <h3 className="font-semibold flex items-center gap-2">
                        <Camera className="w-5 h-5" />
                        Scan Product
                    </h3>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-8 w-8">
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                <div className="p-4 flex flex-col items-center">
                    <div id="reader" className="w-full bg-black rounded-lg overflow-hidden min-h-[300px]"></div>
                    <p className="text-xs text-muted-foreground mt-4 text-center">
                        Position the barcode inside the frame to scan automatically.
                    </p>
                </div>
            </div>
        </div>
    );
}
