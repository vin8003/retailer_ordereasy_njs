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

    const hasPin = typeof lat === 'number' && typeof lng === 'number' && !Number.isNaN(lat) && !Number.isNaN(lng);

    useEffect(() => {
        let cancelled = false;
        loadLeaflet().then((L) => {
            if (cancelled || !L || !containerRef.current || mapRef.current) return;

            if (L.Icon && L.Icon.Default) {
                delete L.Icon.Default.prototype._getIconUrl;
                L.Icon.Default.mergeOptions({
                    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
                    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
                });
            }
            const center = hasPin ? [lat as number, lng as number] : [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng];
            const map = L.map(containerRef.current).setView(center, hasPin ? 16 : 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap',
                maxZoom: 19,
            }).addTo(map);

            map.on('click', (e: any) => {
                if (!editableRef.current) return;
                const nextLat = Number(e.latlng.lat.toFixed(8));
                const nextLng = Number(e.latlng.lng.toFixed(8));
                onChangeRef.current(nextLat, nextLng);
            });

            mapRef.current = map;
            if (hasPin) {
                markerRef.current = L.marker([lat, lng]).addTo(map);
            }
            setTimeout(() => map.invalidateSize(), 200);
        }).catch((err) => console.error(err));

        return () => {
            cancelled = true;
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
        if (!hasPin) {
            if (markerRef.current) {
                map.removeLayer(markerRef.current);
                markerRef.current = null;
            }
            return;
        }
        const pos: [number, number] = [lat as number, lng as number];
        if (markerRef.current) {
            markerRef.current.setLatLng(pos);
        } else {
            markerRef.current = L.marker(pos).addTo(map);
        }
        map.setView(pos, Math.max(map.getZoom(), 16));
    }, [lat, lng, hasPin]);

    const useCurrentLocation = () => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                onChange(
                    Number(pos.coords.latitude.toFixed(8)),
                    Number(pos.coords.longitude.toFixed(8)),
                );
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
                className="w-full h-[280px] rounded-md border overflow-hidden z-0"
            />
            <p className="text-xs text-muted-foreground">
                {editable
                    ? (hasPin
                        ? `Pin set at ${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}. Tap the map to move it.`
                        : 'Tap the map to drop your store pin.')
                    : (hasPin
                        ? `Pin at ${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}.`
                        : 'No store pin yet. Edit profile to set it on the map.')}
            </p>
        </div>
    );
}
