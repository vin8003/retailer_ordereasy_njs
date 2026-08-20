'use client';

import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { LocateFixed } from 'lucide-react';

const DEFAULT_CENTER = { lat: 27.2173, lng: 77.4892 }; // Bharatpur
const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';

type Props = {
    lat?: number | null;
    lng?: number | null;
    editable: boolean;
    onChange: (lat: number, lng: number) => void;
};

declare global {
    interface Window {
        L?: any;
    }
}

function saneLatLng(lat: unknown, lng: unknown): { lat: number; lng: number } | null {
    const la = typeof lat === 'number' ? lat : Number(lat);
    const ln = typeof lng === 'number' ? lng : Number(lng);
    if (!Number.isFinite(la) || !Number.isFinite(ln)) return null;
    if (la < -90 || la > 90 || ln < -180 || ln > 180) return null;
    return { lat: Number(la.toFixed(8)), lng: Number(ln.toFixed(8)) };
}

function loadLeaflet(): Promise<any> {
    if (typeof window === 'undefined') return Promise.resolve(null);
    if (window.L) return Promise.resolve(window.L);

    return new Promise((resolve, reject) => {
        if (!document.getElementById('leaflet-css')) {
            const link = document.createElement('link');
            link.id = 'leaflet-css';
            link.rel = 'stylesheet';
            link.href = LEAFLET_CSS;
            document.head.appendChild(link);
        }
        const existing = document.getElementById('leaflet-js') as HTMLScriptElement | null;
        if (existing) {
            existing.addEventListener('load', () => resolve(window.L), { once: true });
            existing.addEventListener('error', () => reject(new Error('leaflet load failed')), { once: true });
            return;
        }
        const script = document.createElement('script');
        script.id = 'leaflet-js';
        script.src = LEAFLET_JS;
        script.async = true;
        script.onload = () => resolve(window.L);
        script.onerror = () => reject(new Error('leaflet load failed'));
        document.body.appendChild(script);
    });
}

export default function StoreLocationMap({ lat, lng, editable, onChange }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const markerRef = useRef<any>(null);
    const editableRef = useRef(editable);
    const onChangeRef = useRef(onChange);
    editableRef.current = editable;
    onChangeRef.current = onChange;

    const pin = saneLatLng(lat, lng);
    const hasPin = !!pin;

    useEffect(() => {
        let cancelled = false;
        let ro: ResizeObserver | null = null;

        const emitFromClick = (map: any, e: any) => {
            if (!editableRef.current) return;
            let src = e?.latlng;
            if (!src && e?.originalEvent) {
                try {
                    src = map.mouseEventToLatLng(e.originalEvent);
                } catch {
                    src = null;
                }
            }
            const next = saneLatLng(src?.lat, src?.lng);
            if (!next) return;
            onChangeRef.current(next.lat, next.lng);
        };

        const startMap = (L: any) => {
            const el = containerRef.current;
            if (cancelled || !L || !el || mapRef.current) return;
            if (el.clientWidth < 8 || el.clientHeight < 8) return;

            if (L.Icon && L.Icon.Default) {
                delete L.Icon.Default.prototype._getIconUrl;
                L.Icon.Default.mergeOptions({
                    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
                    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
                });
            }

            const center = pin ? [pin.lat, pin.lng] : [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng];
            const map = L.map(el, { maxZoom: 18 }).setView(center, pin ? 15 : 12);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap',
                maxZoom: 19,
            }).addTo(map);

            map.on('click', (e: any) => emitFromClick(map, e));
            mapRef.current = map;
            if (pin) {
                markerRef.current = L.marker([pin.lat, pin.lng]).addTo(map);
            }
            map.whenReady(() => map.invalidateSize());
        };

        loadLeaflet().then((L) => {
            if (cancelled || !L || !containerRef.current) return;
            startMap(L);
            ro = new ResizeObserver(() => {
                if (!mapRef.current) startMap(L);
                else mapRef.current.invalidateSize();
            });
            ro.observe(containerRef.current);
        }).catch((err) => console.error(err));

        return () => {
            cancelled = true;
            ro?.disconnect();
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
                markerRef.current = null;
            }
        };
        // init once
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const L = window.L;
        const map = mapRef.current;
        if (!L || !map) return;
        if (!pin) {
            if (markerRef.current) {
                map.removeLayer(markerRef.current);
                markerRef.current = null;
            }
            return;
        }
        const pos: [number, number] = [pin.lat, pin.lng];
        if (markerRef.current) {
            markerRef.current.setLatLng(pos);
        } else {
            markerRef.current = L.marker(pos).addTo(map);
        }
        // Keep a working tile zoom. Do not force max-zoom (blank tiles).
        const current = map.getZoom();
        const zoom = Number.isFinite(current) ? Math.min(Math.max(current, 12), 16) : 13;
        map.setView(pos, zoom);
        map.invalidateSize();
    }, [lat, lng, pin]);

    const useCurrentLocation = (ev?: { preventDefault(): void; stopPropagation(): void }) => {
        ev?.preventDefault();
        ev?.stopPropagation();
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const next = saneLatLng(pos.coords.latitude, pos.coords.longitude);
                if (!next) return;
                onChange(next.lat, next.lng);
            },
            () => {
                console.warn('Geolocation denied');
            },
            { enableHighAccuracy: true, timeout: 12000 }
        );
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">Store location on map</p>
                {editable && (
                    <Button type="button" variant="outline" size="sm" onClick={useCurrentLocation}>
                        <LocateFixed className="h-4 w-4 mr-1" />
                        Use my location
                    </Button>
                )}
            </div>
            <div
                ref={containerRef}
                className="w-full h-[280px] rounded-md border overflow-hidden z-0 relative"
            />
            <p className="text-xs text-muted-foreground">
                {editable
                    ? (hasPin
                        ? `Pin set at ${pin!.lat.toFixed(5)}, ${pin!.lng.toFixed(5)}. Tap the map to move it.`
                        : 'Tap the map to drop your store pin.')
                    : (hasPin
                        ? `Pin at ${pin!.lat.toFixed(5)}, ${pin!.lng.toFixed(5)}.`
                        : 'No store pin yet. Edit profile to set it on the map.')}
            </p>
        </div>
    );
}
