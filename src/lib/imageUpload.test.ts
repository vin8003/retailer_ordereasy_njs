import { describe, expect, it } from "vitest";
import { fitWithin, jpegName, prepareImageForUpload, uploadErrorMessage } from "./imageUpload";

describe("fitWithin", () => {
    it("shrinks the long side and keeps the ratio", () => {
        expect(fitWithin(4000, 3000, 2000)).toEqual({ width: 2000, height: 1500 });
        expect(fitWithin(3000, 4000, 2000)).toEqual({ width: 1500, height: 2000 });
    });
    it("never scales up", () => {
        expect(fitWithin(800, 600, 2000)).toEqual({ width: 800, height: 600 });
    });
});

describe("jpegName", () => {
    it("swaps the extension", () => {
        expect(jpegName("IMG_1.HEIC")).toBe("IMG_1.jpg");
        expect(jpegName("noext")).toBe("noext.jpg");
    });
});

describe("uploadErrorMessage", () => {
    it("explains a 413", () => {
        expect(uploadErrorMessage({ response: { status: 413, data: "<html>" } })).toMatch(/too large/);
    });
    it("explains a request that got no response", () => {
        expect(uploadErrorMessage(new Error("Network Error"))).toMatch(/internet connection/);
    });
    it("uses the server's file error", () => {
        expect(uploadErrorMessage({ response: { status: 400, data: { file: ["Upload a JPG."] } } })).toBe("Upload a JPG.");
    });
});

describe("prepareImageForUpload", () => {
    it("passes a small image through untouched", async () => {
        const file = new File([new Uint8Array(1000)], "a.png", { type: "image/png" });
        expect(await prepareImageForUpload(file)).toBe(file);
    });
    it("passes a small PDF through and refuses a big one", async () => {
        const pdf = new File([new Uint8Array(1000)], "a.pdf", { type: "application/pdf" });
        expect(await prepareImageForUpload(pdf)).toBe(pdf);
        const big = new File([new Uint8Array(6 * 1024 * 1024)], "b.pdf", { type: "application/pdf" });
        await expect(prepareImageForUpload(big)).rejects.toThrow(/5 MB/);
    });
});
