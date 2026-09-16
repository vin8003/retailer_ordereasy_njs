import { afterEach, describe, expect, it, vi } from "vitest";

async function loadBaseUrl(): Promise<string | undefined> {
  vi.resetModules();
  const mod = await import("./api");
  return mod.default.defaults.baseURL;
}

describe("api BASE_URL", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("points at the production API in production builds", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_API_URL", "");

    expect(await loadBaseUrl()).toBe("https://api.ordereasy.win/api/");
  });

  it("ignores NEXT_PUBLIC_API_URL in production builds", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://127.0.0.1:8000/api/");

    expect(await loadBaseUrl()).toBe("https://api.ordereasy.win/api/");
  });

  it("uses NEXT_PUBLIC_API_URL outside production", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:9000/api/");

    expect(await loadBaseUrl()).toBe("http://localhost:9000/api/");
  });

  it("falls back to the local API when NEXT_PUBLIC_API_URL is unset outside production", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_API_URL", "");

    expect(await loadBaseUrl()).toBe("http://127.0.0.1:8000/api/");
  });
});
