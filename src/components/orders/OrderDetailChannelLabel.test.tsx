import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { OrderDetailChannelLabel } from "./OrderDetailChannelLabel";

describe("OrderDetailChannelLabel", () => {
    it("shows muted channel text when BE sent channel", () => {
        const markup = renderToStaticMarkup(
            <OrderDetailChannelLabel order={{ channel: "app" }} />
        );
        expect(markup).toContain("Channel app");
        expect(markup).toContain("app");
    });

    it("renders nothing when channel is omitted, null, or blank", () => {
        expect(renderToStaticMarkup(<OrderDetailChannelLabel order={{}} />)).toBe("");
        expect(
            renderToStaticMarkup(<OrderDetailChannelLabel order={{ channel: null }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(<OrderDetailChannelLabel order={{ channel: "" }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(<OrderDetailChannelLabel order={{ channel: "   " }} />)
        ).toBe("");
    });

    it("does not invent channel from source, notes, or phone", () => {
        const markup = renderToStaticMarkup(
            <OrderDetailChannelLabel
                order={{
                    source: "pos",
                    notes: "Leave at gate",
                    customer_phone: "9999999999",
                    phone: "8888888888",
                    order_number: "OE-1001",
                }}
            />
        );
        expect(markup).toBe("");
    });
});
