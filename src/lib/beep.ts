let audioContext: AudioContext | null = null;

/** A short checkout-counter beep. Does nothing where the browser has no Web Audio or blocks it. */
export function playScanBeep() {
    try {
        if (typeof window === "undefined") return;
        const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctor) return;
        audioContext ??= new Ctor();
        const ctx = audioContext;
        if (ctx.state === "suspended") void ctx.resume();
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        oscillator.type = "square";
        oscillator.frequency.value = 1800;
        const now = ctx.currentTime;
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.25, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
        oscillator.connect(gain).connect(ctx.destination);
        oscillator.start(now);
        oscillator.stop(now + 0.13);
    } catch {
        // A missing beep must never stop a sale.
    }
}
