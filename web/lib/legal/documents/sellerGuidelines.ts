import type { LegalDocumentMeta } from "@/lib/legal/types";

export const sellerGuidelinesDocument: LegalDocumentMeta = {
  title: "Seller Guidelines",
  lastUpdated: "June 1, 2026",
  intro: [
    "Welcome to selling on ThriftShopper — a curated marketplace built around discovery for secondhand, vintage, collectible, and one-of-a-kind items.",
    "This page explains what belongs on ThriftShopper, what doesn't, and how to create a successful experience for buyers. It supplements our Terms of Use and may be updated periodically.",
    "For friendly best practices, see the Seller Success Guide in Help Center (coming soon). This is the legal and enforcement policy for sellers.",
  ],
  blocks: [
    { type: "h2", text: "1. Our Marketplace Philosophy", id: "philosophy" },
    {
      type: "ul",
      items: [
        "Discovery over search",
        "Character over mass production",
        "Story over inventory volume",
        "Quality over quantity",
      ],
    },
    { type: "h2", text: "2. What Belongs on ThriftShopper", id: "what-belongs" },
    {
      type: "ul",
      items: [
        "Vintage and secondhand home décor, art, and decorative objects",
        "Books, ephemera, collectibles, and kitchen/tabletop items",
        "Estate-sale finds and curious, nostalgic, or conversation-worthy objects",
      ],
    },
    {
      type: "p",
      text: "See What We Accept for our curated, positive framing of marketplace fit.",
    },
    { type: "h2", text: "3. Prohibited Items", id: "prohibited" },
    {
      type: "p",
      text: "Weapons, illegal goods, unsafe items, counterfeits, offensive material, drop-shipped merchandise, and mass-produced new inventory are not permitted. See the Prohibited Items Policy for the full list.",
    },
    { type: "h2", text: "4. Listing Standards", id: "listing-standards" },
    {
      type: "p",
      text: "Sellers must provide accurate descriptions of condition, age, origin, measurements, damage, and authenticity. If unsure, say so. Use photos of the actual item — not stock photography.",
    },
    {
      type: "p",
      text: "ThriftShopper may suggest titles, descriptions, categories, or pricing using automated tools. You may edit or ignore any suggestion. You remain responsible for every listing you publish.",
    },
    { type: "link", href: "/ai-disclosure", label: "AI Disclosure" },
    { type: "h2", text: "5. Storytelling Encouraged", id: "storytelling" },
    {
      type: "p",
      text: "Share how you found an item, why it stood out, and what kind of home it might suit. Stories help buyers connect with objects.",
    },
    { type: "h2", text: "6. Pricing", id: "pricing" },
    {
      type: "p",
      text: "Sellers determine their own pricing. ThriftShopper may provide suggestions but sellers remain responsible for final pricing decisions.",
    },
    { type: "h2", text: "7. Shipping Responsibilities", id: "shipping" },
    {
      type: "p",
      text: "Sellers are responsible for prompt shipment, accurate shipping information, secure packaging, and reasonable care for fragile items. Repeated failures may result in restrictions.",
    },
    { type: "h2", text: "8. Communication Standards", id: "communication" },
    {
      type: "p",
      text: "Communicate respectfully. No harassment, spam, off-platform payment solicitation, or attempts to avoid marketplace fees.",
    },
    { type: "h2", text: "9. Reviews", id: "reviews" },
    {
      type: "p",
      text: "Reviews should reflect genuine experiences. Manipulating reviews or creating fake transactions may result in suspension.",
    },
    { type: "h2", text: "10. Enforcement", id: "enforcement" },
    {
      type: "p",
      text: "ThriftShopper may remove listings, restrict accounts, suspend selling privileges, or terminate accounts for violations of this policy, our Terms, applicable laws, or the spirit of the marketplace.",
    },
    { type: "h2", text: "11. Questions", id: "contact" },
    {
      type: "p",
      text: "Questions before listing? Email support@thriftshopper.com.",
    },
  ],
};
