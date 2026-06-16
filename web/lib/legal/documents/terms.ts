import type { LegalDocumentMeta } from "@/lib/legal/types";

export const termsDocument: LegalDocumentMeta = {
  title: "Terms of Use",
  effectiveDate: "June 1, 2026",
  lastUpdated: "June 12, 2026",
  intro: [
    "Welcome to ThriftShopper. These Terms of Use govern your access to and use of the ThriftShopper website, marketplace, mobile experiences, applications, content, communications, and related services operated by ThriftShopper Inc.",
    "By creating an account, browsing listings, buying, selling, or otherwise using the Services, you agree to these Terms and our Privacy Policy. If you do not agree, do not use the Services.",
  ],
  blocks: [
    { type: "h2", text: "1. Eligibility", id: "eligibility" },
    {
      type: "p",
      text: "You must be at least 18 years old to use ThriftShopper. By using the Services, you represent that you have legal capacity to enter binding agreements, that information you provide is accurate, and that your use complies with applicable laws.",
    },
    { type: "h2", text: "2. ThriftShopper's Role", id: "marketplace-role" },
    {
      type: "p",
      text: "ThriftShopper is a marketplace platform. We provide tools that allow buyers and sellers to discover, list, purchase, and communicate regarding items. Unless expressly stated otherwise, ThriftShopper is not the seller of listed items, does not take title to inventory, and does not guarantee authenticity, condition, provenance, legality, value, or ownership of items.",
    },
    { type: "h2", text: "3. Accounts", id: "accounts" },
    {
      type: "p",
      text: "You are responsible for maintaining account security, protecting login credentials, and activities under your account. You may not share accounts, impersonate others, create fraudulent accounts, or create multiple accounts to evade enforcement.",
    },
    { type: "h2", text: "4. Seller Responsibilities", id: "seller-responsibilities" },
    {
      type: "ul",
      items: [
        "You legally own the item or have authority to sell it",
        "The item is not stolen and may legally be sold",
        "The listing accurately describes the item",
        "The item does not violate intellectual-property rights",
        "The item complies with our Prohibited Items Policy",
      ],
    },
    { type: "h2", text: "5. Buyer Responsibilities", id: "buyer-responsibilities" },
    {
      type: "p",
      text: "Buyers agree to provide accurate shipping information, communicate respectfully, complete purchases in good faith, and review listings carefully. Many items are secondhand, vintage, or unique and may show wear or age consistent with prior use.",
    },
    { type: "h2", text: "6. Listings", id: "listings" },
    {
      type: "p",
      text: "Listings must be accurate and truthful. ThriftShopper may remove, edit, decline, suspend, or restrict any listing for policy violations, legal or safety concerns, fraud prevention, quality standards, or curation decisions. Not every lawful item belongs on ThriftShopper.",
    },
    { type: "h2", text: "7. Payments and Fees", id: "payments" },
    {
      type: "p",
      text: "Payments are processed by third-party providers such as Stripe. ThriftShopper does not store complete payment-card information. Applicable fees will be disclosed before they are charged.",
    },
    { type: "h2", text: "8. Shipping", id: "shipping" },
    {
      type: "p",
      text: "Sellers are responsible for shipping purchased items accurately and within reasonable timeframes. Shipping carriers operate independently of ThriftShopper.",
    },
    { type: "h2", text: "9. Returns and Disputes", id: "returns" },
    {
      type: "p",
      text: "Returns are governed by the Buyer Protection & Returns Policy. Unless otherwise stated or required by law, sales are generally final. ThriftShopper may review disputes and take marketplace actions where permitted.",
    },
    { type: "h2", text: "10. Reviews and Community Content", id: "community-content" },
    {
      type: "p",
      text: "You retain ownership of content you create. By submitting content, you grant ThriftShopper a worldwide, non-exclusive, royalty-free license to host, store, display, reproduce, promote, and distribute such content in connection with operating and marketing the Services.",
    },
    {
      type: "p",
      text: "Reports of policy violations, fraud, or intellectual-property concerns may be submitted to support@thriftshopper.com.",
    },
    {
      type: "h2",
      text: "11. Intellectual Property",
      id: "intellectual-property",
    },
    {
      type: "p",
      text: "Except for user-generated content, all rights in ThriftShopper logos, designs, branding, software, marketplace features, and editorial content are owned by ThriftShopper or its licensors. No rights are granted except as expressly provided in these Terms.",
    },
    { type: "h2", text: "12. Prohibited Conduct", id: "prohibited-conduct" },
    {
      type: "ul",
      items: [
        "Violating laws or marketplace policies",
        "Fraud, misrepresentation, or harassment",
        "Circumventing fees or scraping data without permission",
        "Uploading malware or attempting unauthorized system access",
      ],
    },
    {
      type: "h2",
      text: "13. Automated Systems and AI",
      id: "automated-systems-and-ai",
    },
    {
      type: "p",
      text: "ThriftShopper may use automated systems, machine-learning technologies, recommendation engines, fraud-detection tools, and artificial-intelligence technologies to improve marketplace operations.",
    },
    {
      type: "p",
      text: "AI Disclosure. ThriftShopper uses AI-assisted tools to support item discovery, search relevance, listing categorization, and fraud prevention. AI-generated suggestions, descriptions, or recommendations are provided for informational purposes only and do not constitute appraisals, guarantees of authenticity, legal advice, or representations of value. ThriftShopper is not liable for errors in AI-generated outputs. Users remain responsible for their own listing accuracy and purchase decisions.",
    },
    { type: "h2", text: "14. Disclaimer of Warranties", id: "disclaimer" },
    {
      type: "p",
      text: 'THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE." TO THE MAXIMUM EXTENT PERMITTED BY LAW, THRIFTSHOPPER DISCLAIMS ALL WARRANTIES INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.',
    },
    { type: "h2", text: "15. Limitation of Liability", id: "liability" },
    {
      type: "p",
      text: "TO THE MAXIMUM EXTENT PERMITTED BY LAW, THRIFTSHOPPER'S TOTAL LIABILITY SHALL NOT EXCEED THE GREATER OF $100 OR THE AMOUNT PAID BY YOU TO THRIFTSHOPPER DURING THE PRECEDING TWELVE MONTHS.",
    },
    { type: "h2", text: "16. Governing Law & Disputes", id: "disputes" },
    {
      type: "p",
      text: "These Terms are governed by the laws of the State of New York. Before filing a claim, users agree to attempt good-faith resolution by contacting support@thriftshopper.com. Disputes shall be resolved through binding arbitration on an individual basis where permitted by law.",
    },
    { type: "h2", text: "17. Contact", id: "contact" },
    {
      type: "p",
      text: "Questions regarding these Terms may be directed to ThriftShopper Inc. at support@thriftshopper.com.",
    },
  ],
  canonicalUrl: "https://thriftshopper.com/terms",
};
