import type { LegalDocumentMeta } from "@/lib/legal/types";

export const privacyDocument: LegalDocumentMeta = {
  title: "Privacy Policy",
  effectiveDate: "June 1, 2026",
  lastUpdated: "June 1, 2026",
  intro: [
    'ThriftShopper Inc. ("ThriftShopper," "we," "us," or "our") operates an online marketplace connecting buyers and sellers of secondhand, vintage, collectible, and unique items.',
    "We collect information necessary to operate and improve ThriftShopper, facilitate transactions, and maintain marketplace safety. We do not sell your personal information.",
  ],
  blocks: [
    { type: "h2", text: "1. Information We Collect", id: "information-collected" },
    {
      type: "p",
      text: "We may collect account information (name, email, profile details), seller information (listings, photos, shipping and payout-related data via payment processors), buyer information (purchase history, shipping, favorites), and communications you send through the platform.",
    },
    { type: "h2", text: "2. Payment Information", id: "payments" },
    {
      type: "p",
      text: "Payments are processed by third-party providers such as Stripe. ThriftShopper does not store full credit-card numbers or complete banking information.",
    },
    { type: "h2", text: "3. Information Collected Automatically", id: "automatic" },
    {
      type: "ul",
      items: [
        "Device and browser information",
        "Pages viewed, search activity, and referral sources",
        "Marketplace activity such as favorites and listings viewed",
      ],
    },
    { type: "h2", text: "4. Cookies and Similar Technologies", id: "cookies" },
    {
      type: "p",
      text: "We use cookies and similar technologies to keep users logged in, remember preferences, improve performance, analyze usage, and maintain security. You may control cookies through browser settings, though some functionality may be affected.",
    },
    { type: "h2", text: "5. How We Use Information", id: "use" },
    {
      type: "ul",
      items: [
        "Operate the marketplace and process transactions",
        "Improve search, recommendations, and platform performance",
        "Send transactional emails and permitted marketing communications",
        "Detect fraud, prevent abuse, and enforce policies",
      ],
    },
    { type: "h2", text: "6. Artificial Intelligence and Automated Systems", id: "ai" },
    {
      type: "p",
      text: "We may use automated systems and AI tools to improve discovery, categorize listings, detect fraud, and identify policy violations. AI-generated outputs may occasionally contain errors and are not appraisals, legal advice, or guarantees of value. See our AI Disclosure.",
    },
    { type: "h2", text: "7. How We Share Information", id: "sharing" },
    {
      type: "p",
      text: "We do not sell personal information. We may share information with service providers (hosting, analytics, payments, email, security), with buyers and sellers as needed to fulfill transactions, and when required by law.",
    },
    { type: "h2", text: "8. Data Retention and Security", id: "retention" },
    {
      type: "p",
      text: "We retain information as long as reasonably necessary to operate the marketplace, fulfill transactions, comply with law, and resolve disputes. We use reasonable safeguards including encryption in transit and access controls. No system is completely secure.",
    },
    { type: "h2", text: "9. Children's Privacy", id: "children" },
    {
      type: "p",
      text: "ThriftShopper is intended for individuals age 18 and older. We do not knowingly collect personal information from children under 16.",
    },
    { type: "h2", text: "10. Your Privacy Rights", id: "rights" },
    {
      type: "p",
      text: "Depending on your location, you may have rights to access, correct, delete, or restrict processing of your personal information. Requests may be submitted to support@thriftshopper.com.",
    },
    { type: "h2", text: "11. California Privacy Rights", id: "california" },
    {
      type: "p",
      text: "California residents may have additional rights under the CCPA/CPRA. ThriftShopper does not sell personal information as defined by California law.",
    },
    { type: "h2", text: "12. International Users", id: "international" },
    {
      type: "p",
      text: "Information may be stored or processed in the United States and other jurisdictions where service providers operate.",
    },
    { type: "h2", text: "13. Contact Us", id: "contact" },
    {
      type: "p",
      text: "Questions about this Privacy Policy may be directed to ThriftShopper Inc. at support@thriftshopper.com.",
    },
  ],
  canonicalUrl: "https://thriftshopper.com/privacy",
};
