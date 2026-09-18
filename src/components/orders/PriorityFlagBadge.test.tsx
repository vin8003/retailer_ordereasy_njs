import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PriorityFlagBadge } from "./PriorityFlagBadge";

describe("PriorityFlagBadge", () => {
    it("shows Priority text when BE sent priority_flag true", () => {
        const markup = renderToStaticMarkup(
            <PriorityFlagBadge order={{ priority_flag: true }} />
        );
        expect(markup).toContain("Priority");
        expect(markup).toContain("Priority order");
    });

    it("renders nothing when priority_flag is false, absent, or null", () => {
        expect(renderToStaticMarkup(<PriorityFlagBadge order={{}} />)).toBe("");
        expect(
            renderToStaticMarkup(<PriorityFlagBadge order={{ priority_flag: false }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(<PriorityFlagBadge order={{ priority_flag: null }} />)
        ).toBe("");
    });
});
