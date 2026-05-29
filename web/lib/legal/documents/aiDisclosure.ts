import type { LegalDocumentMeta } from "@/lib/legal/types";

export const aiDisclosureDocument: LegalDocumentMeta = {
  title: "AI Disclosure",
  effectiveDate: "June 1, 2026",
  lastUpdated: "June 1, 2026",
  intro: [
    "ThriftShopper uses automated systems and artificial-intelligence technologies to operate and improve the marketplace. This page explains how AI is used and what it does not do.",
  ],
  blocks: [
    { type: "h2", text: "How We Use AI", id: "how-we-use-ai" },
    {
      type: "ul",
      items: [
        "Search, discovery, and personalized recommendations",
        "Listing suggestions including titles, descriptions, categories, and attributes",
        "Pricing guidance based on available signals — sellers always set the final price",
        "Fraud detection, safety reviews, and content moderation",
      ],
    },
    { type: "h2", text: "Seller Responsibilities", id: "seller-responsibilities" },
    {
      type: "p",
      text: "AI suggestions are optional. Sellers can edit, ignore, or replace any AI-generated content. Sellers remain responsible for reviewing listings for accuracy before publishing.",
    },
    {
      type: "p",
      text: "When a photo is uploaded, your image appears immediately while additional listing information may continue processing in the background.",
    },
    { type: "h2", text: "What AI Is Not", id: "limitations" },
    {
      type: "ul",
      items: [
        "Professional appraisals, authentication services, or guarantees of value",
        "Legal, tax, or compliance advice",
        "A substitute for seller judgment about condition, pricing, or eligibility",
      ],
    },
    {
      type: "p",
      text: "Automated outputs may occasionally contain errors and should not be relied upon as definitive.",
    },
    { type: "h2", text: "Training and Data Use", id: "training" },
    {
      type: "p",
      text: "Photos and listing information submitted to ThriftShopper are used to provide marketplace services and item analysis for your listings and the platform. They are not used by ThriftShopper to train public AI models.",
    },
    { type: "h2", text: "Related Policies", id: "related" },
    {
      type: "p",
      text: "For additional detail, see Section 13 of our Terms of Use and Section 6 of our Privacy Policy.",
    },
    { type: "h2", text: "Questions", id: "contact" },
    {
      type: "p",
      text: "Questions about AI on ThriftShopper may be directed to support@thriftshopper.com.",
    },
  ],
};
