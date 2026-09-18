import { describe, expect, it } from "vitest";
import { getOfdPodPhotoUrl } from "./ofdPodPhoto";

/** Dummy fixture only — never *.ordereasy.win */
const DUMMY_POD_PHOTO_URL = "https://cdn.example.test/pod/dummy-photo.jpg";

describe("getOfdPodPhotoUrl", () => {
    it("uses a dummy photo URL that is not an ordereasy.win host", () => {
        expect(DUMMY_POD_PHOTO_URL).not.toMatch(/ordereasy\.win/i);
        expect(DUMMY_POD_PHOTO_URL).toMatch(/^https:\/\/cdn\.example\.test\//);
    });

    it("returns the trimmed pod_photo_url when BE sent a non-empty string", () => {
        expect(getOfdPodPhotoUrl({ pod_photo_url: DUMMY_POD_PHOTO_URL })).toBe(
            DUMMY_POD_PHOTO_URL
        );
        expect(
            getOfdPodPhotoUrl({
                pod_photo_url: `  ${DUMMY_POD_PHOTO_URL}  `,
            })
        ).toBe(DUMMY_POD_PHOTO_URL);
    });

    it("returns null when pod_photo_url is omitted, null, or blank", () => {
        expect(getOfdPodPhotoUrl({})).toBeNull();
        expect(getOfdPodPhotoUrl({ pod_photo_url: undefined })).toBeNull();
        expect(getOfdPodPhotoUrl({ pod_photo_url: null })).toBeNull();
        expect(getOfdPodPhotoUrl({ pod_photo_url: "" })).toBeNull();
        expect(getOfdPodPhotoUrl({ pod_photo_url: "   " })).toBeNull();
    });

    it("does not invent pod_photo_url from other photo-like fields", () => {
        expect(
            getOfdPodPhotoUrl({
                proof_of_delivery_url: DUMMY_POD_PHOTO_URL,
                pod_image: DUMMY_POD_PHOTO_URL,
                pod_image_url: DUMMY_POD_PHOTO_URL,
                delivery_photo: DUMMY_POD_PHOTO_URL,
                delivery_photo_url: DUMMY_POD_PHOTO_URL,
                photo_url: DUMMY_POD_PHOTO_URL,
                image_url: DUMMY_POD_PHOTO_URL,
                signature_url: DUMMY_POD_PHOTO_URL,
                pod_photo: DUMMY_POD_PHOTO_URL,
                delivery_info: { pod_photo_url: DUMMY_POD_PHOTO_URL },
                proof_of_delivery: { url: DUMMY_POD_PHOTO_URL },
                status: "out_for_delivery",
            })
        ).toBeNull();
    });
});
