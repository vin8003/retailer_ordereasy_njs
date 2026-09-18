import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ReportsLowStockCountLabel } from "./ReportsLowStockCountLabel";

describe("ReportsLowStockCountLabel", () => {
    it("shows the compact count when BE sent low_stock_count", () => {
        const markup = renderToStaticMarkup(
            <ReportsLowStockCountLabel summary={{ low_stock_count: 4 }} />
        );
        expect(markup).toContain("4 low-stock");
        expect(markup).toContain('data-testid="reports-low-stock-count"');
    });

    it("renders nothing when the field is omitted, null, or blank", () => {
        expect(renderToStaticMarkup(<ReportsLowStockCountLabel summary={{}} />)).toBe("");
        expect(
            renderToStaticMarkup(
                <ReportsLowStockCountLabel summary={{ low_stock_count: null }} />
            )
        ).toBe("");
        expect(
            renderToStaticMarkup(
                <ReportsLowStockCountLabel summary={{ low_stock_count: "   " }} />
            )
        ).toBe("");
    });

    it("shows 0 when BE sent zero", () => {
        const markup = renderToStaticMarkup(
            <ReportsLowStockCountLabel summary={{ low_stock_count: 0 }} />
        );
        expect(markup).toContain("0 low-stock");
    });

    it("does not invent a label from order_count or total_sales", () => {
        const markup = renderToStaticMarkup(
            <ReportsLowStockCountLabel
                summary={{ order_count: 12, total_sales: 5400, low_stock_count: null }}
            />
        );
        expect(markup).toBe("");
    });
});
