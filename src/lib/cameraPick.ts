export type CameraInfo = { id: string; label: string };

const FRONT = /front|user|selfie/i;

/** Rear cameras first, so switching tries the other rear lenses before the selfie camera. */
export function orderCameras(cameras: CameraInfo[]): CameraInfo[] {
    return [...cameras.filter((c) => !FRONT.test(c.label)), ...cameras.filter((c) => FRONT.test(c.label))];
}

/** The camera after the one in use, or null when there is nothing to switch to. */
export function nextCamera(cameras: CameraInfo[], activeId: string | null): CameraInfo | null {
    if (cameras.length < 2) return null;
    const ordered = orderCameras(cameras);
    const index = ordered.findIndex((c) => c.id === activeId);
    return ordered[(index + 1) % ordered.length];
}
