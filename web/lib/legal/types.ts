export type LegalBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string; id?: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "link"; href: string; label: string };

export interface LegalDocumentMeta {
  title: string;
  lastUpdated: string;
  effectiveDate?: string;
  intro?: string[];
  blocks: LegalBlock[];
  canonicalUrl?: string;
}
