// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";

// API, router, toast and camera scanner are mocked: nothing here talks to a real host.
const push = vi.fn();
const addProduct = vi.fn();
const toastError = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh: vi.fn(), replace: vi.fn() }) }));
vi.mock("sonner", () => ({ toast: { error: (m: string) => toastError(m), success: vi.fn(), info: vi.fn() } }));
vi.mock("@/components/products/BarcodeScanner", () => ({ BarcodeScanner: () => null }));
vi.mock("@/services/api", () => ({
    productService: {
        fetchCategories: async () => ({ data: [] }),
        fetchAllCategories: async () => ({ data: [] }),
        fetchProductGroups: async () => ({ data: [] }),
        searchProducts: async () => ({ data: [] }),
        addProduct: (fd: FormData) => addProduct(fd),
        updateProduct: vi.fn(),
    },
}));

import { ProductForm } from "./ProductForm";

globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as never;

function setup(fields: { name?: string; price?: string; quantity?: string }) {
    const { container } = render(<ProductForm />);
    for (const [id, value] of Object.entries(fields)) {
        fireEvent.change(container.querySelector(`#${id}`)!, { target: { value } });
    }
    // Submit the form directly so the component's own guard runs (not the browser's required check).
    fireEvent.submit(container.querySelector("form")!);
}

const sent = () => Object.fromEntries((addProduct.mock.calls[0][0] as FormData).entries());

beforeEach(() => { vi.clearAllMocks(); vi.spyOn(console, "error").mockImplementation(() => {}); });
afterEach(cleanup);

describe("product form", () => {
    it("empty name and price: required-fields error, no API call", async () => {
        setup({});
        await waitFor(() => expect(toastError).toHaveBeenCalledWith("Please fill in required fields (Name, Price)"));
        expect(addProduct).not.toHaveBeenCalled();
    });

    it("name without price is blocked the same way", async () => {
        setup({ name: "Atta 5kg" });
        await waitFor(() => expect(toastError).toHaveBeenCalledWith("Please fill in required fields (Name, Price)"));
        expect(addProduct).not.toHaveBeenCalled();
    });

    it("price without name is blocked", async () => {
        setup({ price: "50" });
        await waitFor(() => expect(toastError).toHaveBeenCalledWith("Please fill in required fields (Name, Price)"));
        expect(addProduct).not.toHaveBeenCalled();
    });

    it("negative price is not blocked client-side; the server's field error is shown and we stay on the form", async () => {
        addProduct.mockRejectedValue({ response: { data: { price: ["Ensure this value is greater than or equal to 0."] } } });
        setup({ name: "Atta 5kg", price: "-5" });
        await waitFor(() => expect(toastError).toHaveBeenCalledWith("price: Ensure this value is greater than or equal to 0."));
        expect(sent().price).toBe("-5");
        expect(push).not.toHaveBeenCalled();
    });

    // TODO: the form sends negative opening stock and the API accepts it (RCP create_product bug, see PR #227).
    it("negative stock is sent as-is (no client check) - current behaviour", async () => {
        addProduct.mockResolvedValue({ data: { id: 1 } });
        setup({ name: "Atta 5kg", price: "50", quantity: "-3" });
        await waitFor(() => expect(addProduct).toHaveBeenCalled());
        expect(sent().quantity).toBe("-3");
    });

    it("server error string is shown verbatim and the page does not navigate", async () => {
        addProduct.mockRejectedValue({ response: { data: { error: "Product with this barcode already exists" } } });
        setup({ name: "Atta 5kg", price: "50" });
        await waitFor(() => expect(toastError).toHaveBeenCalledWith("Product with this barcode already exists"));
        expect(push).not.toHaveBeenCalled();
    });

    it("network failure without a body falls back to a generic message", async () => {
        addProduct.mockRejectedValue(new Error("Network Error"));
        setup({ name: "Atta 5kg", price: "50" });
        await waitFor(() => expect(toastError).toHaveBeenCalledWith("Failed to save product"));
    });
});
