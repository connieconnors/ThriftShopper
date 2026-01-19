"use client";

import Link from "next/link";
import { TSLogo } from "@/components/TSLogo";
import { ArrowLeft } from "lucide-react";

export default function WhatWeAcceptPage() {
  return (
    <main
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#f8f9fa" }}
    >
      {/* Header */}
      <header className="p-4 flex items-center justify-between" style={{ backgroundColor: "#191970" }}>
        <Link href="/browse" className="flex items-center gap-2">
          <TSLogo size={32} primaryColor="#ffffff" accentColor="#efbf04" />
          <span className="text-white font-semibold">ThriftShopper</span>
        </Link>
        <Link
          href="/browse"
          className="text-sm text-white/80 hover:text-white transition-colors flex items-center gap-1"
        >
          <ArrowLeft size={16} />
          Back
        </Link>
      </header>

      {/* Content */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold mb-2 font-editorial" style={{ color: "#191970" }}>
            What We Accept
          </h1>
          <p className="text-sm text-gray-500 mb-6">Curated categories and examples</p>

          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 font-editorial" style={{ color: "#191970" }}>
                What Tends to Work Well Here
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                ThriftShopper is not about categories - it is about character. Items that tend to do
                well often share a few qualities:
              </p>
              <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-3 ml-4">
                <li>
                  <span className="font-semibold">They feel singular.</span> Not necessarily expensive or
                  old - just not easily replaceable. Something you would notice on a shelf and pause at.
                </li>
                <li>
                  <span className="font-semibold">They have a point of view.</span> Design-forward, quirky,
                  beautifully made, or quietly useful in a way that feels intentional.
                </li>
                <li>
                  <span className="font-semibold">They show craftsmanship or care.</span> Well-made objects,
                  interesting materials, thoughtful details, or signs of having been chosen (not churned out).
                </li>
                <li>
                  <span className="font-semibold">They benefit from being seen, not searched.</span> Things
                  you did not know you were looking for until you saw them.
                </li>
                <li>
                  <span className="font-semibold">They carry a little story.</span> A mark of age, a specific
                  style, a place, a moment - even if that story is simple.
                </li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-6 mb-3">You will often see:</p>
              <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-1 ml-4 mb-4">
                <li>Jewelry and accessories</li>
                <li>Interesting shoes</li>
                <li>Small objects with presence</li>
                <li>Vintage or contemporary pieces that feel personal</li>
                <li>Unexpected finds that do not fit neatly into a box</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                Some items made overseas absolutely belong here - especially when they feel special,
                limited, or thoughtfully designed. What does not fit is mass-produced inventory intended
                for bulk resale.
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                If you are unsure, that is okay. ThriftShopper is still learning too. When in doubt, ask
                yourself: Would this feel at home in a small, well-loved shop - the kind you wander
                through and remember later?
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4" style={{ color: "#191970" }}>
                What We Do Not Accept
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                ThriftShopper is a curated marketplace. That means we are thoughtful about what belongs
                here - not because some items are not nice, but because we are building a place where
                discovery feels special.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                At the moment, we generally do not accept:
              </p>
              <div className="space-y-4">
                <div>
                  <p className="text-gray-700 font-semibold mb-1">Everyday clothing</p>
                  <p className="text-gray-700 leading-relaxed">
                    This is not a general apparel resale app. We make rare exceptions for truly one-of-a-kind
                    pieces with a story, but most standard clothing belongs elsewhere.
                  </p>
                </div>
                <div>
                  <p className="text-gray-700 font-semibold mb-1">Mass-produced items made for bulk resale</p>
                  <p className="text-gray-700 leading-relaxed">
                    Even if it is cute. Even if it is new. If it feels like it came from a container meant
                    for thousands, it is probably not the right fit here.
                  </p>
                </div>
                <div>
                  <p className="text-gray-700 font-semibold mb-1">Items with unclear origin or quality</p>
                  <p className="text-gray-700 leading-relaxed">
                    We favor craftsmanship, character, and clarity over mystery sourcing.
                  </p>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed mt-6 mb-2">What does work well:</p>
              <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-1 ml-4 mb-4">
                <li>Accessories</li>
                <li>Jewelry</li>
                <li>Unique or interesting shoes</li>
                <li>Objects with texture, age, or personality</li>
                <li>The occasional surprising find that feels genuinely singular - wherever it was made</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-4">
                Some things made overseas do feel special and one-of-a-kind. You will know the difference.
                So will we.
              </p>
              <p className="text-gray-700 leading-relaxed">
                If something is not accepted, it is about fit - not value.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4" style={{ color: "#191970" }}>
                Unsure If It Fits?
              </h2>
              <p className="text-gray-700 leading-relaxed mb-2">
                We are happy to help before you list.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Contact:{" "}
                <a href="mailto:support@thriftshopper.com" className="text-[#EFBF05] hover:underline font-semibold">
                  support@thriftshopper.com
                </a>
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                For a detailed list, see our{" "}
                <Link href="/prohibited-items" className="text-[#EFBF05] hover:underline font-semibold">
                  Prohibited and Restricted Items
                </Link>{" "}
                page.
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
