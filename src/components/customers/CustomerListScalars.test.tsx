import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CustomerListScalars } from "./CustomerListScalars";

const formatInr = (value: number) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(value);

describe("CustomerListScalars", () => {
    it("shows muted email and credit text when BE sent the scalars", () => {
        const markup = renderToStaticMarkup(
            <CustomerListScalars
                customer={{
                    email: "shop@example.com",
                    credit_limit: 10000,
                    credit_due_days: 15,
                }}
            />
        );
        expect(markup).toContain("shop@example.com");
        expect(markup).toContain("Email shop@example.com");
        expect(markup).toContain(`Limit ${formatInr(10000)}`);
        expect(markup).toContain("15 days");
    });

    it("shows only the scalars BE actually sent", () => {
        const emailOnly = renderToStaticMarkup(
            <CustomerListScalars customer={{ email: "only@example.com" }} />
        );
        expect(emailOnly).toContain("only@example.com");
        expect(emailOnly).not.toContain("Limit");
        expect(emailOnly).not.toContain("days");

        const limitOnly = renderToStaticMarkup(
            <CustomerListScalars customer={{ credit_limit: 2500 }} />
        );
        expect(limitOnly).toContain(`Limit ${formatInr(2500)}`);
        expect(limitOnly).not.toContain("@");
        expect(limitOnly).not.toContain("days");

        const daysOnly = renderToStaticMarkup(
            <CustomerListScalars customer={{ credit_due_days: 7 }} />
        );
        expect(daysOnly).toContain("7 days");
        expect(daysOnly).not.toContain("Limit");
        expect(daysOnly).not.toContain("@");
    });

    it("shows credit_limit of 0 and credit_due_days of 0 when BE sent them", () => {
        const markup = renderToStaticMarkup(
            <CustomerListScalars customer={{ credit_limit: 0, credit_due_days: 0 }} />
        );
        expect(markup).toContain(`Limit ${formatInr(0)}`);
        expect(markup).toContain("0 days");
    });

    it("renders nothing when email/credit fields are omitted, null, or blank", () => {
        expect(renderToStaticMarkup(<CustomerListScalars customer={{}} />)).toBe("");
        expect(
            renderToStaticMarkup(
                <CustomerListScalars
                    customer={{ email: null, credit_limit: null, credit_due_days: null }}
                />
            )
        ).toBe("");
        expect(
            renderToStaticMarkup(
                <CustomerListScalars customer={{ email: "  ", credit_limit: "", credit_due_days: "   " }} />
            )
        ).toBe("");
    });

    it("does not invent email or credit from name, phone, or balance", () => {
        const markup = renderToStaticMarkup(
            <CustomerListScalars
                customer={{
                    customer_name: "Ravi",
                    phone_number: "9999999999",
                    current_balance: 2500,
                }}
            />
        );
        expect(markup).toBe("");
    });
});
