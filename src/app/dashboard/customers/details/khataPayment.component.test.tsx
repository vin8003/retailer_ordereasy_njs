// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Customer API and router are mocked: nothing here talks to a real host.
const recordPayment = vi.fn();
const toastError = vi.fn();
const detail = { customer_id: 7, customer_name: "C1", phone_number: "9000000007", total_orders: 0, credit_limit: "1000", current_balance: "500", recent_orders: [], reward_history: [] };
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }), useSearchParams: () => new URLSearchParams("id=7") }));
vi.mock("sonner", () => ({ toast: { error: (m: string) => toastError(m), success: vi.fn() } }));
vi.mock("@/components/customers/CustomerMappingNotes", () => ({ CustomerMappingNotes: () => null }));
vi.mock("@/components/customers/KhataLedgerNotes", () => ({ KhataLedgerNotes: () => null }));
vi.mock("@/services/api", () => ({
    default: { get: vi.fn(async () => ({ data: [] })) },
    API_ORIGIN: "http://api.test.invalid",
    customerService: {
        getRetailerCustomerDetail: vi.fn(async () => ({ status: 200, data: detail })),
        fetchLedger: vi.fn(async () => ({ status: 200, data: { results: [] } })),
        recordPayment: (body: unknown) => recordPayment(body),
        updateCreditLimit: vi.fn(),
        toggleRetailerBlacklist: vi.fn(),
        rateCustomer: vi.fn(),
    },
}));

import CustomerDetailPage from "./page";

globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as never;

async function openDialog() {
    const user = userEvent.setup();
    render(<CustomerDetailPage />);
    await user.click(await screen.findByTestId("record-payment-open"));
    const amount = await screen.findByTestId("record-payment-amount");
    const submit = () => screen.getByTestId("record-payment-submit") as HTMLButtonElement;
    return { user, amount, submit };
}

beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    window.history.replaceState({}, "", "/dashboard/customers/details?id=7");
});
afterEach(cleanup);

describe("khata record-payment form", () => {
    it("submit stays disabled for empty, zero and negative amounts", async () => {
        const { user, amount, submit } = await openDialog();
        expect(submit().disabled).toBe(true);
        for (const v of ["0", "-50", "-0.01"]) {
            await user.clear(amount);
            await user.type(amount, v);
            expect(submit().disabled).toBe(true);
        }
        expect(recordPayment).not.toHaveBeenCalled();
    });

    it("non-numeric text cannot be typed into the amount (number input)", async () => {
        const { user, amount, submit } = await openDialog();
        await user.type(amount, "abc");
        expect((amount as HTMLInputElement).value).toBe("");
        expect(submit().disabled).toBe(true);
    });

    it("more than the balance is allowed client-side and sent as a number", async () => {
        recordPayment.mockResolvedValue({ data: {} });
        const { user, amount, submit } = await openDialog();
        await user.type(amount, "800");
        expect(submit().disabled).toBe(false);
        await user.click(submit());
        await waitFor(() => expect(recordPayment).toHaveBeenCalledWith({ customer_id: 7, amount: 800, payment_mode: "cash", notes: "" }));
    });

    it("server failure shows an error and keeps the dialog and amount for retry", async () => {
        recordPayment.mockRejectedValue({ response: { status: 500 } });
        const { user, amount, submit } = await openDialog();
        await user.type(amount, "100");
        await user.click(submit());
        await waitFor(() => expect(toastError).toHaveBeenCalledWith("Failed to record payment"));
        expect((screen.getByTestId("record-payment-amount") as HTMLInputElement).value).toBe("100");
        expect(submit().disabled).toBe(false);
    });
});
