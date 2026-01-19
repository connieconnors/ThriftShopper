"use client";

import Link from "next/link";
import { TSLogo } from "@/components/TSLogo";
import { ArrowLeft } from "lucide-react";

export default function ReturnsPage() {
  return (
    <main className="min-h-screen flex flex-col" style={{ backgroundColor: '#f8f9fa' }}>
      {/* Header */}
      <header className="p-4 flex items-center justify-between" style={{ backgroundColor: '#191970' }}>
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
          <h1 className="text-3xl font-bold mb-6" style={{ color: '#191970' }}>
            Returns and Exchanges
          </h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-sm text-gray-500 mb-6">
              Last Updated: December 15, 2024
            </p>
            
            <p className="text-gray-700 leading-relaxed mb-6">
              Because ThriftShopper is a marketplace for secondhand, vintage, and one-of-a-kind items, return policies work a little differently than at traditional retail stores.
            </p>
            <p className="text-gray-700 leading-relaxed mb-8">
              This page explains how returns, exchanges, and issues are handled on ThriftShopper.
            </p>

            {/* The Short Version */}
            <section className="mb-8 p-4 rounded-lg" style={{ backgroundColor: '#FFF8E6', borderLeft: '4px solid #EFBF05' }}>
              <h2 className="text-xl font-semibold mb-4" style={{ color: '#191970' }}>
                The Short Version
              </h2>
              <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2">
                <li>Most items on ThriftShopper are final sale</li>
                <li>Return policies are set seller-by-seller</li>
                <li>ThriftShopper does not automatically issue refunds</li>
                <li>If something goes wrong, we encourage respectful communication and good-faith resolution</li>
              </ul>
            </section>

            {/* 1. Understanding Marketplace Purchases */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4" style={{ color: '#191970' }}>
                1. Understanding Marketplace Purchases
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                When you purchase an item on ThriftShopper:
              </p>
              <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2 mb-4 ml-4">
                <li>You are buying directly from an individual seller</li>
                <li>Items are often unique, vintage, or pre-owned</li>
                <li>Minor signs of age or wear are part of their character</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-2 font-semibold">
                We encourage buyers to:
              </p>
              <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2 ml-4">
                <li>Read listings carefully</li>
                <li>Review photos and descriptions</li>
                <li>Ask questions before purchasing if anything is unclear</li>
              </ul>
            </section>

            {/* 2. Seller Return Policies */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4" style={{ color: '#191970' }}>
                2. Seller Return Policies
              </h2>
              <h3 className="text-lg font-semibold mb-3" style={{ color: '#191970' }}>
                2.1 Final Sale by Default
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Unless a seller clearly states otherwise in their listing:
              </p>
              <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2 mb-4 ml-4">
                <li>All sales are final</li>
                <li>Returns and exchanges are not guaranteed</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-2">
                Some sellers may choose to offer:
              </p>
              <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2 ml-4">
                <li>Limited returns</li>
                <li>Exchanges</li>
                <li>Store credit</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                Any such terms must be clearly stated in the listing.
              </p>
            </section>

            {/* 3. When a Return or Refund May Be Considered */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4" style={{ color: '#191970' }}>
                3. When a Return or Refund May Be Considered
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                A return, refund, or adjustment may be appropriate if:
              </p>
              <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2 ml-4">
                <li>The item arrives significantly not as described</li>
                <li>The wrong item was shipped</li>
                <li>The item was damaged in transit and was not disclosed</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4 italic">
                Normal wear consistent with the description, photos, or age of an item is not considered a defect.
              </p>
            </section>

            {/* 4. What to Do If There's an Issue */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4" style={{ color: '#191970' }}>
                4. What to Do If There's an Issue
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you experience a problem with an order:
              </p>
              
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-3" style={{ color: '#191970' }}>
                  Step 1: Contact the Seller
                </h3>
                <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2 ml-4">
                  <li>Use ThriftShopper messaging</li>
                  <li>Be specific and polite</li>
                  <li>Include photos if relevant</li>
                  <li>Allow reasonable time for response</li>
                </ul>
                <p className="text-gray-700 leading-relaxed mt-3">
                  Most issues can be resolved directly and amicably.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3" style={{ color: '#191970' }}>
                  Step 2: Contact ThriftShopper (If Needed)
                </h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  If you're unable to resolve the issue with the seller:
                </p>
                <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2 ml-4 mb-3">
                  <li>Contact ThriftShopper support</li>
                  <li>Provide order details, messages, and photos</li>
                  <li>📩 Email: <a href="mailto:support@thriftshopper.com" className="text-[#EFBF05] hover:underline">support@thriftshopper.com</a></li>
                </ul>
                <p className="text-gray-700 leading-relaxed">
                  We may review the situation and, at our discretion:
                </p>
                <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2 ml-4">
                  <li>Facilitate communication</li>
                  <li>Recommend a resolution</li>
                  <li>Take action if a seller has violated platform policies</li>
                </ul>
              </div>
            </section>

            {/* 5. Shipping Damage */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4" style={{ color: '#191970' }}>
                5. Shipping Damage
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If an item arrives damaged:
              </p>
              <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2 ml-4 mb-4">
                <li>Contact the seller as soon as possible</li>
                <li>Retain all packaging materials</li>
                <li>Take clear photos of the damage and packaging</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                Responsibility may depend on:
              </p>
              <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2 ml-4">
                <li>How the item was packaged</li>
                <li>Carrier handling</li>
                <li>The seller's stated policies</li>
              </ul>
            </section>

            {/* 6. Exchanges */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4" style={{ color: '#191970' }}>
                6. Exchanges
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Because most items are one-of-a-kind:
              </p>
              <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2 ml-4">
                <li>Exchanges are uncommon</li>
                <li>Availability of replacement items is not guaranteed</li>
                <li>Any exchange options must be arranged directly with the seller</li>
              </ul>
            </section>

            {/* 7. Non-Returnable Situations */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4" style={{ color: '#191970' }}>
                7. Non-Returnable Situations
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Returns or refunds are generally not available for:
              </p>
              <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2 ml-4">
                <li>Buyer's remorse</li>
                <li>Fit, size, or aesthetic preferences</li>
                <li>Items accurately described and photographed</li>
                <li>Delays caused by carriers beyond the seller's control</li>
              </ul>
            </section>

            {/* 8. ThriftShopper's Role */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4" style={{ color: '#191970' }}>
                8. ThriftShopper's Role
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                ThriftShopper:
              </p>
              <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2 ml-4 mb-4">
                <li>Is not the seller of record</li>
                <li>Does not take possession of items</li>
                <li>Does not guarantee refunds or exchanges</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-3">
                However, we care deeply about trust and fairness and reserve the right to:
              </p>
              <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2 ml-4">
                <li>Investigate reported issues</li>
                <li>Suspend or remove sellers who repeatedly violate policies</li>
                <li>Take action in cases of fraud or abuse</li>
              </ul>
            </section>

            {/* 9. Concierge Selling Orders */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4" style={{ color: '#191970' }}>
                9. Concierge Selling Orders
              </h2>
              <p className="text-gray-700 leading-relaxed">
                For items sold through Concierge Selling:
              </p>
              <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2 ml-4">
                <li>Any return or refund terms will be disclosed at the time of purchase</li>
                <li>These terms may differ from standard seller policies</li>
              </ul>
            </section>

            {/* 10. Questions Before You Buy? */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4" style={{ color: '#191970' }}>
                10. Questions Before You Buy?
              </h2>
              <p className="text-gray-700 leading-relaxed mb-3 font-semibold">
                We strongly encourage buyers to:
              </p>
              <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2 ml-4">
                <li>Message sellers with questions before purchasing</li>
                <li>Confirm dimensions, condition, and details</li>
                <li>Review seller policies carefully</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4 italic">
                A little clarity upfront helps everyone.
              </p>
            </section>

            {/* 11. Contact Us */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4" style={{ color: '#191970' }}>
                11. Contact Us
              </h2>
              <p className="text-gray-700 leading-relaxed">
                If you have questions about returns or exchanges:
              </p>
              <p className="text-gray-700 leading-relaxed mt-2">
                📩 Email: <a href="mailto:support@thriftshopper.com" className="text-[#EFBF05] hover:underline font-semibold">support@thriftshopper.com</a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

