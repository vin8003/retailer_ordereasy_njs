import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { OfdPodPhotoThumb } from "./OfdPodPhotoThumb";

/** Dummy fixture only — never *.ordereasy.win */
const DUMMY_POD_PHOTO_URL = "https://cdn.example.test/pod/dummy-photo.jpg";

describe("OfdPodPhotoThumb", () => {
    it("uses a dummy photo URL that is not an ordereasy.win host", () => {
        expect(DUMMY_POD_PHOTO_URL).not.toMatch(/ordereasy\.win/i);
    });

    it("shows a proof-of-delivery thumb when BE sent pod_photo_url", () => {
        const markup = renderToStaticMarkup(
            <OfdPodPhotoThumb order={{ pod_photo_url: DUMMY_POD_PHOTO_URL }} />
        );
        expect(markup).toContain(DUMMY_POD_PHOTO_URL);
        expect(markup).toContain("Proof of delivery");
        expect(markup).not.toMatch(/ordereasy\.win/i);
    });

    it("renders nothing when pod_photo_url is omitted, null, or blank", () => {
        expect(renderToStaticMarkup(<OfdPodPhotoThumb order={{}} />)).toBe("");
        expect(
            renderToStaticMarkup(<OfdPodPhotoThumb order={{ pod_photo_url: null }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(<OfdPodPhotoThumb order={{ pod_photo_url: "  " }} />)
        ).toBe("");
    });

    it("does not invent a thumb from other photo-like fields", () => {
        const markup = renderToStaticMarkup(
            <OfdPodPhotoThumb
                order={{
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
                }}
            />
        );
        expect(markup).toBe("");
        expect(markup).not.toContain(DUMMY_POD_PHOTO_URL);
        expect(markup).not.toContain("Proof of delivery");
    });
});
