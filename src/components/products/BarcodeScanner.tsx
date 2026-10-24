"use client";

import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { X, Camera, RefreshCw, ScanLine, SwitchCamera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { playScanBeep } from "@/lib/beep";
import { pickDetectedCode, type Detection } from "@/lib/scanPick";
import { nextCamera, type CameraInfo } from "@/lib/cameraPick";

interface BarcodeScannerProps {
    onScanSuccess: (decodedText: string) => void;
    onClose: () => void;
    /** Read a code only when the cashier taps the Scan button or the camera view, like a counter scanner's trigger. */
    tapToScan?: boolean;
    /** Called when tapping finds no barcode in view. */
    onNothingInView?: () => void;
}

const READER_ID = "reader";
// The same code held in view is read on many frames; one tap should count once.
const REPEAT_WINDOW_MS = 1500;

function scanErrorMessage(error: unknown): string {
    const name = error instanceof DOMException ? error.name : "";
    const text = String(error);
    if (name === "NotAllowedError" || /permission|denied/i.test(text)) {
        return "Camera access is blocked. Allow the camera for this site in your browser settings, then try again.";
    }
    if (name === "NotFoundError" || name === "OverconstrainedError") {
        return "No camera was found on this device.";
    }
    return "Could not start the camera. Search for the product or use a barcode scanner instead.";
}

export function BarcodeScanner({ onScanSuccess, onClose, tapToScan = false, onNothingInView }: BarcodeScannerProps) {
    // Read through a ref so a parent passing a new callback does not restart the camera.
    const onScanSuccessRef = useRef(onScanSuccess);
    useEffect(() => {
        onScanSuccessRef.current = onScanSuccess;
    }, [onScanSuccess]);
    const tapToScanRef = useRef(tapToScan);
    useEffect(() => {
        tapToScanRef.current = tapToScan;
    }, [tapToScan]);
    const lastDetection = useRef<Detection | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [hint, setHint] = useState<string | null>(null);
    const [attempt, setAttempt] = useState(0);
    // What to open: the back camera by default, a listed camera by id, or the other facing when the browser lists none.
    const [choice, setChoice] = useState<{ deviceId?: string; facing: "environment" | "user" }>({ facing: "environment" });
    // Cameras the browser lists and the one actually running, known once the camera has started.
    const [cameras, setCameras] = useState<CameraInfo[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [activeLabel, setActiveLabel] = useState<string>("");
    // In tap mode the first code is read on its own; every later code needs a tap.
    const firstCodeTaken = useRef(false);

    useEffect(() => {
        const scanner = new Html5Qrcode(READER_ID, {
            formatsToSupport: [
                Html5QrcodeSupportedFormats.EAN_13,
                Html5QrcodeSupportedFormats.EAN_8,
                Html5QrcodeSupportedFormats.UPC_A,
                Html5QrcodeSupportedFormats.UPC_E,
                Html5QrcodeSupportedFormats.QR_CODE,
                Html5QrcodeSupportedFormats.CODE_128,
            ],
            verbose: false,
        });
        let closing = false;
        let lastCode = "";
        let lastAt = 0;

        // A wide box that fills most of the viewfinder, so the barcode is easy to line up on a phone.
        const barcodeBox = (viewfinderWidth: number, viewfinderHeight: number) => {
            const width = Math.min(Math.floor(viewfinderWidth * 0.9), 520);
            const height = Math.min(Math.floor(viewfinderHeight * 0.5), Math.floor(width * 0.6));
            return { width, height };
        };

        // Barcodes need a sharp picture: ask for a good size and, below, for continuous focus.
        const video: MediaTrackConstraints = {
            ...(choice.deviceId ? { deviceId: { exact: choice.deviceId } } : { facingMode: choice.facing }),
            width: { ideal: 1920 },
            height: { ideal: 1080 },
        };
        const starting = scanner.start(
            video,
            { fps: 10, qrbox: barcodeBox, videoConstraints: video },
            (decodedText) => {
                const now = Date.now();
                if (tapToScanRef.current && firstCodeTaken.current) {
                    // Only remember what is in view; the Scan button reports it.
                    lastDetection.current = { code: decodedText, at: now };
                    return;
                }
                firstCodeTaken.current = true;
                // The camera stays open: each new code is reported, and the parent decides whether to close.
                if (closing || (decodedText === lastCode && now - lastAt < REPEAT_WINDOW_MS)) return;
                lastCode = decodedText;
                lastAt = now;
                playScanBeep();
                onScanSuccessRef.current(decodedText);
            },
            () => {} // Scan misses happen on every frame without a code; ignore them.
        );
        starting
            .then(async () => {
                if (closing) return;
                // Keep the lens focusing on its own; not every camera supports it.
                try {
                    await scanner.applyVideoConstraints({ advanced: [{ focusMode: "continuous" } as MediaTrackConstraintSet] });
                } catch {
                    // The camera keeps its default focus.
                }
                const settings = scanner.getRunningTrackSettings();
                // Camera names are only listed once the browser has allowed the camera. Listing them
                // does not open a second stream, which some phones do not allow.
                const devices = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === "videoinput");
                if (closing) return;
                setCameras(devices.map((d, i) => ({ id: d.deviceId, label: d.label || `Camera ${i + 1}` })));
                setActiveId(settings.deviceId ?? null);
                setActiveLabel(devices.find((d) => d.deviceId === settings.deviceId)?.label ?? "");
            })
            .catch(() => {});
        starting.catch((err) => {
            if (!closing) setError(scanErrorMessage(err));
        });

        return () => {
            closing = true;
            // Stop the camera once it has started, even if the component closed while starting.
            starting.then(() => (scanner.isScanning ? scanner.stop() : undefined)).catch(() => {});
        };
    }, [attempt, choice]);

    // A tap is a user gesture, so the beep is allowed to play even where autoplay is blocked.
    const scanNow = () => {
        const code = pickDetectedCode(lastDetection.current, Date.now());
        if (!code) {
            setHint("No barcode in view. Line it up inside the frame and tap again.");
            onNothingInView?.();
            return;
        }
        setHint(null);
        lastDetection.current = null;
        playScanBeep();
        onScanSuccessRef.current(code);
    };

    const switchCamera = () => {
        lastDetection.current = null;
        setHint(null);
        const next = nextCamera(cameras, activeId);
        if (next) {
            setChoice({ deviceId: next.id, facing: "environment" });
        } else {
            // The browser lists fewer than two cameras, so flip between the back and front facing.
            setChoice((current) => ({ facing: current.facing === "environment" ? "user" : "environment" }));
        }
    };

    return (
        <div className="fixed inset-x-0 top-0 bottom-[var(--bottom-nav-h,0px)] md:bottom-0 z-[70] bg-background/80 backdrop-blur-sm flex flex-col items-stretch sm:items-center sm:justify-center sm:p-4">
            <div className="bg-card w-full h-full sm:h-auto sm:max-w-md sm:rounded-lg shadow-lg border-0 sm:border overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-4 border-b bg-muted/50">
                    <h3 className="font-semibold flex items-center gap-2">
                        <Camera className="w-5 h-5" />
                        Scan Product
                    </h3>
                    <div className="flex items-center gap-1">
                    <Button variant="outline" onClick={switchCamera} aria-label="Switch camera" className="h-10 rounded-full px-3 gap-1.5">
                        <SwitchCamera className="w-5 h-5" />
                        <span className="text-xs font-semibold">Switch</span>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close scanner" className="rounded-full h-10 w-10">
                        <X className="w-5 h-5" />
                    </Button>
                    </div>
                </div>

                <div className="p-4 flex flex-col flex-1 min-h-0 items-center">
                    <div
                        id={READER_ID}
                        onClick={tapToScan ? scanNow : undefined}
                        className="w-full flex-1 sm:flex-none bg-black text-white rounded-lg overflow-hidden min-h-[60vh] sm:min-h-[320px]"
                    ></div>
                    {error ? (
                        <div className="mt-4 flex flex-col items-center gap-3 text-center">
                            <p className="text-sm text-destructive">{error}</p>
                            <Button variant="outline" onClick={() => setAttempt((n) => n + 1)} className="h-11 px-5">
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Try again
                            </Button>
                        </div>
                    ) : tapToScan ? (
                        <div className="mt-4 w-full flex flex-col items-center gap-2">
                            <Button onClick={scanNow} className="w-full h-14 text-base font-bold rounded-xl">
                                <ScanLine className="w-5 h-5 mr-2" />
                                Scan
                            </Button>
                            <p className="text-xs text-muted-foreground text-center">
                                {hint ?? "The first barcode is read automatically. After that, line one up and tap Scan or the camera view."}
                            </p>
                            <p className="text-xs text-muted-foreground text-center">
                                Picture blurry? Tap Switch at the top to try another camera{activeLabel ? ` (now: ${activeLabel})` : ""}.
                            </p>
                        </div>
                    ) : (
                        <p className="text-xs text-muted-foreground mt-4 text-center">
                            Hold the barcode inside the frame. It is read automatically.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
