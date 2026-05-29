"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { LegalBlock } from "@/lib/legal/types";
import { legalHref, parseLegalFrom } from "@/lib/legalNavigation";

function linkifyEmail(text: string) {
  if (!text.includes("support@thriftshopper.com")) return text;
  const parts = text.split("support@thriftshopper.com");
  return (
    <>
      {parts[0]}
      <a
        href="mailto:support@thriftshopper.com"
        className="underline hover:opacity-80"
        style={{ color: "#16193a" }}
      >
        support@thriftshopper.com
      </a>
      {parts[1]}
    </>
  );
}

export function LegalDocumentContent({ blocks }: { blocks: LegalBlock[] }) {
  const searchParams = useSearchParams();
  const from = parseLegalFrom(searchParams.get("from"));

  return (
    <div className="space-y-5 text-sm text-gray-700 leading-relaxed font-system">
      {blocks.map((block, index) => {
        if (block.type === "h2") {
          return (
            <h2
              key={index}
              id={block.id}
              className="text-base font-semibold pt-2 scroll-mt-24"
              style={{ color: "#16193a" }}
            >
              {block.text}
            </h2>
          );
        }
        if (block.type === "h3") {
          return (
            <h3
              key={index}
              className="text-sm font-semibold"
              style={{ color: "#16193a" }}
            >
              {block.text}
            </h3>
          );
        }
        if (block.type === "ul") {
          return (
            <ul
              key={index}
              className="list-disc list-outside ml-5 space-y-1.5"
            >
              {block.items.map((item) => (
                <li key={item}>{linkifyEmail(item)}</li>
              ))}
            </ul>
          );
        }
        if (block.type === "link") {
          return (
            <p key={index}>
              <Link
                href={legalHref(block.href, from)}
                className="text-sm font-medium underline hover:opacity-80"
                style={{ color: "#16193a" }}
              >
                {block.label}
              </Link>
            </p>
          );
        }
        return (
          <p key={index} className="leading-relaxed">
            {linkifyEmail(block.text)}
          </p>
        );
      })}
    </div>
  );
}
