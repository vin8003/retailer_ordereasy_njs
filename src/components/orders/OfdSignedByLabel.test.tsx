import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { OfdSignedByLabel } from "./OfdSignedByLabel";

describe("OfdSignedByLabel", () => {
    it("shows muted signed-by text on OFD close display when BE sent signed_by", () => {
        const ofd = renderToStaticMarkup(
            <OfdSignedByLabel
                order={{
                    status: "out_for_delivery",
                    delivery_mode: "delivery",
                    signed_by: "Asha",
                }}
            />
        );
        expect(ofd).toContain("Signed by Asha");
        expect(ofd).toContain("Asha");

        const closed = renderToStaticMarkup(
            <OfdSignedByLabel
                order={{ status: "delivered", delivery_mode: "delivery", signed_by: "Ravi" }}
            />
        );
        expect(closed).toContain("Signed by Ravi");
    });

    it("renders nothing on OFD close display when signed_by is omitted, null, or blank", () => {
        expect(
            renderToStaticMarkup(
                <OfdSignedByLabel order={{ status: "out_for_delivery", delivery_mode: "delivery" }} />
            )
        ).toBe("");
        expect(
            renderToStaticMarkup(
                <OfdSignedByLabel
                    order={{
                        status: "delivered",
                        delivery_mode: "delivery",
                        signed_by: null,
                    }}
                />
            )
        ).toBe("");
        expect(
            renderToStaticMarkup(
                <OfdSignedByLabel
                    order={{
                        status: "out_for_delivery",
                        delivery_mode: "delivery",
                        signed_by: "   ",
                    }}
                />
            )
        ).toBe("");
    });

    it("does not show signed_by on pickup or non-close statuses even if present", () => {
        expect(
            renderToStaticMarkup(
                <OfdSignedByLabel
                    order={{ status: "out_for_delivery", delivery_mode: "pickup", signed_by: "Asha" }}
                />
            )
        ).toBe("");
        expect(
            renderToStaticMarkup(
                <OfdSignedByLabel
                    order={{ status: "packed", delivery_mode: "delivery", signed_by: "Asha" }}
                />
            )
        ).toBe("");
        expect(
            renderToStaticMarkup(
                <OfdSignedByLabel
                    order={{ status: "pending", delivery_mode: "delivery", signed_by: "Asha" }}
                />
            )
        ).toBe("");
        expect(
            renderToStaticMarkup(
                <OfdSignedByLabel
                    order={{ status: "cancelled", delivery_mode: "delivery", signed_by: "Asha" }}
                />
            )
        ).toBe("");
    });

    it("does not invent signed_by from signer, POD, nested delivery_info, or names", () => {
        const markup = renderToStaticMarkup(
            <OfdSignedByLabel
                order={{
                    status: "delivered",
                    delivery_mode: "delivery",
                    signed_by_name: "Asha",
                    signer: "Ravi",
                    signature: "sig.png",
                    received_by: "Meera",
                    receiver_name: "Meera",
                    pod_signed_by: "Asha",
                    delivery_info: { signed_by: "Nested" },
                    customer_name: "Customer",
                    driver_name: "Driver",
                    delivery_person_name: "Courier",
                }}
            />
        );
        expect(markup).toBe("");
    });
});
