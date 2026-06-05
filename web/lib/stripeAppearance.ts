import type { Appearance } from "@stripe/stripe-js";

/** Stripe Elements run in iframes — CSS vars from the page do not apply; load Inter explicitly. */
export const STRIPE_CHECKOUT_FONTS = [
  {
    cssSrc:
      "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap",
  },
];

export const stripeCheckoutAppearance: Appearance = {
  theme: "stripe",
  variables: {
    colorPrimary: "#16193a",
    colorBackground: "#ffffff",
    colorText: "#16193a",
    colorTextSecondary: "#6b7280",
    colorDanger: "#dc2626",
    fontFamily:
      'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
    fontSizeBase: "16px",
    fontWeightNormal: "400",
    fontWeightMedium: "500",
    fontWeightBold: "600",
    borderRadius: "12px",
    spacingUnit: "4px",
    spacingGridRow: "18px",
    spacingTab: "10px",
  },
  rules: {
    ".Label": {
      fontWeight: "500",
      fontSize: "14px",
      marginBottom: "6px",
      color: "#374151",
    },
    ".Input": {
      border: "1px solid #d1d5db",
      boxShadow: "none",
      padding: "12px 14px",
      backgroundColor: "#ffffff",
    },
    ".Input:focus": {
      border: "1px solid #16193a",
      boxShadow: "0 0 0 1px #16193a",
    },
    ".Tab": {
      border: "1px solid #e5e7eb",
      borderRadius: "10px",
      backgroundColor: "#ffffff",
    },
    ".Tab:hover": {
      backgroundColor: "#f9fafb",
    },
    ".Tab--selected": {
      border: "1px solid #16193a",
      backgroundColor: "#16193a",
      color: "#ffffff",
    },
    ".Block": {
      backgroundColor: "#fafaf9",
      border: "1px solid #e5e7eb",
      borderRadius: "12px",
      padding: "14px",
      boxShadow: "none",
    },
  },
};
