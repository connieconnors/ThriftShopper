import type { Metadata } from "next";
import Link from "next/link";
import { Mail } from "lucide-react";
import { TSLogo } from "@/components/TSLogo";

export const metadata: Metadata = {
  title: "Support | ThriftShopper",
  description:
    "Contact ThriftShopper support for help with orders, listings, payments, returns, and account questions.",
};

const IN_APP_TOPICS = [
  "Quick Tips",
  "Seller Guidelines",
  "Shipping & Returns",
  "Account & Settings",
] as const;

export default function SupportPage() {
  return (
    <main className="min-h-screen flex flex-col" style={{ backgroundColor: "#f8f9fa" }}>
      <header
        className="px-4 py-3 flex items-center justify-center border-b border-white/10"
        style={{ backgroundColor: "#16193a" }}
      >
        <Link href="/browse" className="flex items-center gap-2" aria-label="ThriftShopper home">
          <TSLogo size={28} primaryColor="#ffffff" accentColor="#efbf04" />
          <span className="text-white font-semibold text-sm">ThriftShopper</span>
        </Link>
      </header>

      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
          <h1
            className="text-2xl font-bold mb-4 font-editorial"
            style={{ color: "#16193a" }}
          >
            ThriftShopper Support
          </h1>

          <p className="text-gray-700 leading-relaxed mb-6">
            Need help with an order, listing, payment, return, account issue, or marketplace
            question?
          </p>

          <section className="mb-8">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-2">
              Email
            </h2>
            <a
              href="mailto:support@thriftshopper.com"
              className="inline-flex items-center gap-2 text-gray-800 hover:text-[#16193a] transition-colors font-medium"
            >
              <Mail className="h-5 w-5 shrink-0" style={{ color: "#EFBF05" }} />
              support@thriftshopper.com
            </a>
            <p className="text-sm text-gray-500 mt-3">
              We typically respond within 1–2 business days.
            </p>
          </section>

          <section className="mb-8">
            <p className="text-gray-700 leading-relaxed mb-3">
              For common questions, please use the in-app Help Center, which includes:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm pl-1">
              {IN_APP_TOPICS.map((topic) => (
                <li key={topic}>{topic}</li>
              ))}
            </ul>
          </section>

          <section className="pt-6 border-t border-gray-200 space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-1">
              Legal
            </h2>
            <div className="flex flex-col sm:flex-row sm:gap-6 gap-2 text-sm">
              <Link
                href="/privacy"
                className="text-[#16193a] underline hover:opacity-80 transition-opacity"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-[#16193a] underline hover:opacity-80 transition-opacity"
              >
                Terms of Use
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
