// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

// Auth API, map, phone verification and router are mocked: nothing here talks to a real host.
const updateProfile = vi.fn();
const fetchProfile = vi.fn();
const toastError = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));
vi.mock("sonner", () => ({ toast: { error: (m: string) => toastError(m), success: vi.fn() } }));
vi.mock("@/components/profile/StoreLocationMap", () => ({ default: () => null }));
vi.mock("@/components/auth/PhoneVerification", () => ({ default: () => null }));
vi.mock("@/services/sessionCache", () => ({ clearAllSessionCaches: vi.fn() }));
vi.mock("@/services/api", () => ({
    API_ORIGIN: "http://api.test.invalid",
    notifyVerificationChanged: vi.fn(),
    authService: {
        fetchProfile: () => fetchProfile(),
        fetchRetailerCategories: async () => ({ data: [] }),
        updateProfile: (fd: FormData) => updateProfile(fd),
    },
}));

import ProfilePage from "./page";

globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as never;

const base = { shop_name: "Shop", city: "Pune", delivery_radius: 5, minimum_order_amount: "0", offers_delivery: true, delivery_fee_mode: "flat", delivery_fee_tiers: [], delivery_fee_per_km: "0", serviceable_pincodes: [] };

async function openEditing(profile: Record<string, unknown> = {}) {
    fetchProfile.mockResolvedValue({ status: 200, data: { ...base, ...profile } });
    render(<ProfilePage />);
    fireEvent.click(await screen.findByTestId("profile-edit"));
}

const radiusInput = () => screen.getByText("Delivery Radius (km)").parentElement!.querySelector("input")!;
const save = () => fireEvent.click(screen.getByTestId("profile-save"));
const sent = () => updateProfile.mock.calls[0][0] as FormData;

beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
});
afterEach(cleanup);

describe("delivery settings (profile)", () => {
    it("distance mode with a 0 km tier is blocked before any API call", async () => {
        await openEditing({ delivery_fee_mode: "distance", delivery_fee_tiers: [{ up_to_km: 0, fee: 20 }] });
        save();
        await waitFor(() => expect(toastError).toHaveBeenCalledWith("Delivery Charges: Tier 1: enter a distance between 0 and 500 km."));
        expect(updateProfile).not.toHaveBeenCalled();
    });

    it("distance mode with a negative tier fee is blocked", async () => {
        await openEditing({ delivery_fee_mode: "distance", delivery_fee_tiers: [{ up_to_km: 3, fee: -1 }] });
        save();
        await waitFor(() => expect(toastError).toHaveBeenCalledWith("Delivery Charges: Tier 1: enter a fee of 0 or more."));
        expect(updateProfile).not.toHaveBeenCalled();
    });

    it("distance mode with no tiers and no per-km rate is blocked", async () => {
        await openEditing({ delivery_fee_mode: "distance" });
        save();
        await waitFor(() => expect(toastError).toHaveBeenCalledWith("Delivery Charges: Add at least one distance tier or a per-km rate."));
        expect(updateProfile).not.toHaveBeenCalled();
    });

    it("negative radius is dropped from the save, so the stored radius is kept", async () => {
        updateProfile.mockResolvedValue({ status: 200 });
        await openEditing();
        fireEvent.change(radiusInput(), { target: { value: "-3" } });
        save();
        await waitFor(() => expect(updateProfile).toHaveBeenCalled());
        expect(sent().has("delivery_radius")).toBe(false);
    });

    it("cleared radius is not sent as NaN", async () => {
        updateProfile.mockResolvedValue({ status: 200 });
        await openEditing();
        fireEvent.change(radiusInput(), { target: { value: "" } });
        save();
        await waitFor(() => expect(updateProfile).toHaveBeenCalled());
        expect(sent().has("delivery_radius")).toBe(false);
        expect([...sent().values()].map(String)).not.toContain("NaN");
    });

    it("server field error is shown with a readable label and editing stays on", async () => {
        updateProfile.mockRejectedValue({ response: { status: 400, data: { delivery_radius: ["Ensure this value is less than or equal to 50."] } } });
        await openEditing();
        save();
        await waitFor(() => expect(toastError).toHaveBeenCalledWith("Delivery Radius: Ensure this value is less than or equal to 50."));
        expect(screen.getByTestId("profile-save")).toBeTruthy();
    });
});
