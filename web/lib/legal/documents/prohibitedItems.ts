import type { LegalDocumentMeta } from "@/lib/legal/types";

export const prohibitedItemsDocument: LegalDocumentMeta = {
  title: "Prohibited Items Policy",
  lastUpdated: "June 1, 2026",
  intro: [
    "To maintain a safe, lawful, and trustworthy marketplace, certain items may not be listed, sold, purchased, advertised, or promoted through ThriftShopper.",
    "This list is not exhaustive. ThriftShopper may remove any listing at its sole discretion. Listings that infringe copyrights, trademarks, publicity rights, or other intellectual-property rights are prohibited.",
  ],
  blocks: [
    { type: "h2", text: "Weapons", id: "weapons" },
    {
      type: "ul",
      items: [
        "Firearms, ammunition, and firearm components",
        "Silencers, explosives, fireworks, and destructive devices",
      ],
    },
    { type: "h2", text: "Illegal Goods", id: "illegal" },
    {
      type: "ul",
      items: [
        "Stolen property",
        "Illegal drugs, controlled substances, and drug paraphernalia",
        "Counterfeit documents and forged materials",
      ],
    },
    { type: "h2", text: "Regulated Products", id: "regulated" },
    {
      type: "ul",
      items: [
        "Prescription medications",
        "Alcohol, tobacco, vape, and nicotine products",
      ],
    },
    { type: "h2", text: "Dangerous Materials", id: "dangerous" },
    {
      type: "ul",
      items: [
        "Hazardous or toxic chemicals",
        "Radioactive materials",
        "Unsafe or recalled products",
      ],
    },
    { type: "h2", text: "Counterfeit Goods", id: "counterfeit" },
    {
      type: "ul",
      items: [
        "Counterfeit luxury items and replica merchandise",
        "Trademark-infringing goods and unauthorized reproductions",
      ],
    },
    { type: "h2", text: "Human Remains", id: "remains" },
    {
      type: "ul",
      items: ["Human remains, cremated remains, and body parts"],
    },
    { type: "h2", text: "Hate and Offensive Material", id: "hate" },
    {
      type: "ul",
      items: [
        "Hate-group merchandise and extremist propaganda",
        "Material promoting violence or discrimination",
        "Explicit sexual or sexually exploitative content",
      ],
    },
    { type: "h2", text: "Marketplace Fit", id: "marketplace-fit" },
    {
      type: "p",
      text: "Some items may be removed even if legal. ThriftShopper is a curated, discovery-focused marketplace. Items that conflict with the spirit or quality standards of the platform may be declined or removed.",
    },
    { type: "h2", text: "Questions", id: "contact" },
    {
      type: "p",
      text: "Unsure before listing? Email support@thriftshopper.com.",
    },
  ],
};
