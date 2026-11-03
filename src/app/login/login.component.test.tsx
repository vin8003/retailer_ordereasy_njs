// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// The API layer and router are mocked: nothing here talks to a real host.
const push = vi.fn();
const login = vi.fn();
const setAuthToken = vi.fn();
const toastError = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace: vi.fn() }) }));
vi.mock("next/image", () => ({ default: () => null }));
vi.mock("sonner", () => ({ toast: { error: (...a: unknown[]) => toastError(...a), success: vi.fn() } }));
vi.mock("@/services/api", () => ({ authService: { login: (v: unknown) => login(v) }, setAuthToken: (...a: unknown[]) => setAuthToken(...a) }));

import LoginPage from "./page";

async function fill(username: string, password: string) {
    const user = userEvent.setup();
    render(<LoginPage />);
    if (username) await user.type(await screen.findByTestId("login-username"), username);
    if (password) await user.type(screen.getByTestId("login-password"), password);
    await user.click(screen.getByTestId("login-submit"));
}

beforeEach(() => { localStorage.clear(); vi.clearAllMocks(); vi.spyOn(console, "error").mockImplementation(() => {}); });
afterEach(cleanup);

describe("retailer login form", () => {
    it("empty submit shows both required messages and never calls the API", async () => {
        await fill("", "");
        expect(await screen.findByText("Username is required")).toBeTruthy();
        expect(screen.getByText("Password is required")).toBeTruthy();
        expect(login).not.toHaveBeenCalled();
    });

    it("missing password alone is blocked", async () => {
        await fill("shop1", "");
        expect(await screen.findByText("Password is required")).toBeTruthy();
        expect(screen.queryByText("Username is required")).toBeNull();
        expect(login).not.toHaveBeenCalled();
    });

    it("wrong password shows the server detail, stores no token and stays put", async () => {
        login.mockRejectedValue({ response: { status: 401, data: { detail: "Invalid credentials" } } });
        await fill("shop1", "wrong");
        await waitFor(() => expect(toastError).toHaveBeenCalledWith("Invalid credentials", { testId: "login-error" }));
        expect(setAuthToken).not.toHaveBeenCalled();
        expect(push).not.toHaveBeenCalled();
        expect(localStorage.getItem("user_profile")).toBeNull();
    });

    it("network error without a body falls back to the generic message", async () => {
        login.mockRejectedValue(new Error("Network Error"));
        await fill("shop1", "pw");
        await waitFor(() => expect(toastError).toHaveBeenCalledWith("Invalid username or password", { testId: "login-error" }));
        expect(push).not.toHaveBeenCalled();
    });

    it("submit is re-enabled after a failure so the user can retry", async () => {
        login.mockRejectedValue(new Error("x"));
        await fill("shop1", "pw");
        await waitFor(() => expect(toastError).toHaveBeenCalled());
        expect((screen.getByTestId("login-submit") as HTMLButtonElement).disabled).toBe(false);
    });
});
