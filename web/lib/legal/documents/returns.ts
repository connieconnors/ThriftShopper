import type { LegalDocumentMeta } from "@/lib/legal/types";

export const returnsDocument: LegalDocumentMeta = {
  title: "Buyer Protection & Returns",
  effectiveDate: "June 1, 2026",
  lastUpdated: "June 1, 2026",
  intro: [
    "At ThriftShopper, we want buyers and sellers to have a positive marketplace experience built on trust, transparency, and good communication.",
    "Many items sold on ThriftShopper are secondhand, vintage, collectible, or one-of-a-kind. Because these items are often unique, our approach differs from traditional retail stores.",
  ],
  blocks: [
    { type: "h2", text: "1. General Return Policy", id: "general" },
    {
      type: "p",
      text: "Unless otherwise stated by a seller or required by applicable law, all sales are generally final. Buyers should carefully review photos, descriptions, measurements, and condition details before purchasing.",
    },
    {
      type: "p",
      text: "Normal signs of age, wear, patina, imperfections, or other characteristics commonly associated with vintage or secondhand items are not considered defects when accurately disclosed.",
    },
    { type: "h2", text: "2. When Buyers May Request Assistance", id: "assistance" },
    {
      type: "ul",
      items: [
        "Item not received — no successful delivery shown in tracking",
        "Wrong item received — materially different from what was purchased",
        "Item materially different than described — major undisclosed damage or misrepresentation",
        "Significant shipping damage due to inadequate packaging",
      ],
    },
    { type: "h2", text: "3. Issues Not Generally Eligible", id: "not-eligible" },
    {
      type: "ul",
      items: [
        "Buyer's remorse or changed mind",
        "Disclosed wear or condition shown in photos/description",
        "Minor variations such as slight color differences on screen",
        "Delivery delays outside seller control (weather, carrier, customs)",
      ],
    },
    { type: "h2", text: "4. Buyer Responsibilities", id: "buyers" },
    {
      type: "p",
      text: "Buyers should review listings carefully, ask questions before purchasing, provide accurate shipping information, and inspect items promptly upon delivery. Report issues within 7 days of delivery when possible.",
    },
    { type: "h2", text: "5. Seller Responsibilities", id: "sellers" },
    {
      type: "p",
      text: "Sellers are expected to describe items accurately, disclose known flaws, use photographs of the actual item, package appropriately, ship within stated handling times, and communicate professionally.",
    },
    { type: "h2", text: "6. Resolution Process", id: "resolution" },
    {
      type: "p",
      text: "Contact the seller first through the marketplace. If unresolved, ThriftShopper may review available information including listing content, photos, messages, and shipping records.",
    },
    { type: "h2", text: "7. Possible Outcomes", id: "outcomes" },
    {
      type: "ul",
      items: [
        "No action, return authorization, partial refund, or full refund where appropriate",
        "Seller education, warnings, or account restrictions",
        "Not every dispute results in a refund",
      ],
    },
    { type: "h2", text: "8. Authenticity and Collectibles", id: "authenticity" },
    {
      type: "p",
      text: "Unless expressly stated otherwise, ThriftShopper does not authenticate items, provide appraisals, guarantee provenance, or guarantee future value.",
    },
    { type: "h2", text: "9. Fraud and Chargebacks", id: "fraud" },
    {
      type: "p",
      text: "False claims, item-switching, chargeback abuse, or manipulated evidence may result in account suspension or removal. Contact the seller and ThriftShopper before initiating a chargeback when possible.",
    },
    { type: "h2", text: "10. Questions", id: "contact" },
    {
      type: "p",
      text: "Questions regarding returns, disputes, or buyer protection may be directed to support@thriftshopper.com.",
    },
  ],
};
