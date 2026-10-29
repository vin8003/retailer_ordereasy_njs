import type { AxiosResponse } from "axios";

/**
 * In-memory caches that live until the page is reloaded. The app is a static export, so moving
 * between screens keeps this module alive and a browser refresh starts it empty again: data loaded
 * here is fetched once per page load instead of on every screen that mounts.
 */
export type SessionCache<T> = {
    /** The cached value, or the loader's result (one request shared by concurrent callers). */
    load: (loader: () => Promise<T>) => Promise<T>;
    /** Always runs the loader and caches its result. */
    refresh: (loader: () => Promise<T>) => Promise<T>;
    peek: () => T | undefined;
    set: (value: T) => void;
    clear: () => void;
};

const allCaches: SessionCache<unknown>[] = [];

export function createSessionCache<T>(): SessionCache<T> {
    let value: T | undefined;
    let hasValue = false;
    let inFlight: Promise<T> | null = null;
    // Bumped by clear/set so a request started before them cannot overwrite what they did.
    let generation = 0;

    const refresh = (loader: () => Promise<T>) => {
        const started = ++generation;
        const request = loader().then(
            (result) => {
                if (started === generation) {
                    value = result;
                    hasValue = true;
                    inFlight = null;
                }
                return result;
            },
            (error) => {
                if (started === generation) inFlight = null;
                throw error;
            },
        );
        inFlight = request;
        return request;
    };

    const cache: SessionCache<T> = {
        load: (loader) => {
            if (hasValue) return Promise.resolve(value as T);
            return inFlight ?? refresh(loader);
        },
        refresh,
        peek: () => (hasValue ? value : undefined),
        set: (next) => {
            generation++;
            value = next;
            hasValue = true;
            inFlight = null;
        },
        clear: () => {
            generation++;
            value = undefined;
            hasValue = false;
            inFlight = null;
        },
    };
    allCaches.push(cache as SessionCache<unknown>);
    return cache;
}

/** For login and logout without a page reload, so another account never sees this one's data. */
export function clearAllSessionCaches() {
    allCaches.forEach((cache) => cache.clear());
}

/** Responses of GET retailer/profile/ and GET auth/profile/. */
export const profileCache = createSessionCache<AxiosResponse>();
export const authProfileCache = createSessionCache<AxiosResponse>();

const MUTATING_METHODS = new Set(["post", "put", "patch", "delete"]);

/**
 * Drops cached data that a successful write may have changed, so the next screen to need it
 * fetches it again: everything on login or signup, the profiles for retailer/ and auth/ writes.
 */
export function invalidateAfterMutation(method: string | undefined, url: string | undefined) {
    if (!method || !url || !MUTATING_METHODS.has(method.toLowerCase())) return;
    const path = url.replace(/^https?:\/\/[^/]+/, "").replace(/^\/?(api\/)?/, "");

    if (/^auth\/retailer\/(login|signup)\//.test(path)) {
        clearAllSessionCaches();
        return;
    }
    if (/^retailer\//.test(path) || (/^auth\//.test(path) && !/^auth\/device\//.test(path))) {
        profileCache.clear();
        authProfileCache.clear();
    }
}
