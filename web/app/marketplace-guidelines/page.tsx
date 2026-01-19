"use client";

import Link from "next/link";
import { TSLogo } from "@/components/TSLogo";
import { ArrowLeft } from "lucide-react";

export default function MarketplaceGuidelinesPage() {
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
            ThriftShopper Seller Guidelines
          </h1>
          <p className="text-sm text-gray-500 mb-6">Last Updated: December 15, 2025</p>

          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 leading-relaxed mb-6">
              Welcome to selling on ThriftShopper.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              ThriftShopper is a curated marketplace designed for discovery - a place for one-of-a-kind,
              secondhand, vintage, and collectible items with character, story, and soul. These Seller
              Guidelines explain what we look for, what we do not allow, and how to be a great member of
              the ThriftShopper seller community.
            </p>
            <p className="text-gray-700 leading-relaxed mb-8">
              These Guidelines supplement our Terms of Use and are part of your agreement with
              ThriftShopper.
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 font-editorial" style={{ color: "#191970" }}>
                1. Our Marketplace Philosophy
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                ThriftShopper is not a general resale platform. We curate for:
              </p>
              <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-1 ml-4">
                <li>Discovery over volume</li>
                <li>Interesting objects over mass inventory</li>
                <li>Story, provenance, and personality</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                Think: &quot;the item someone did not know they were looking for - until they saw it.&quot;
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 font-editorial" style={{ color: "#191970" }}>
                2. What Sells Well on ThriftShopper
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">We encourage listings that are:</p>
              <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-1 ml-4 mb-6">
                <li>Secondhand, vintage, or collectible</li>
                <li>Unique, curious, or hard-to-find</li>
                <li>Decorative, functional, or conversation-worthy</li>
                <li>Clearly photographed and thoughtfully described</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-4">Popular categories include (but are not limited to):</p>
              <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-1 ml-4 mb-6">
                <li>Home decor and design objects</li>
                <li>Art, prints, and wall objects</li>
                <li>Vintage books and paper goods</li>
                <li>Tabletop, kitchen, and entertaining items</li>
                <li>Accessories and objects of interest</li>
                <li>Collectibles, memorabilia, and ephemera</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                If you would be excited to stumble upon it in a great thrift store, estate sale, or flea
                market - it probably belongs here.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4" style={{ color: "#191970" }}>
                3. Items We Do Not Allow
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                To keep the marketplace focused and high-quality, certain items are not permitted.
              </p>
              <p className="text-gray-700 font-semibold mb-2">Not Allowed on ThriftShopper:</p>
              <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-1 ml-4 mb-4">
                <li>Clothing and apparel, including shoes and wearable fashion (unless explicitly approved in writing)</li>
                <li>New, mass-produced retail inventory</li>
                <li>Drop-shipped or print-on-demand items</li>
                <li>Counterfeit, replica, or knockoff goods</li>
                <li>Items prohibited by law</li>
                <li>Hazardous, recalled, or unsafe items</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                If you are unsure whether something fits, feel free to ask before listing.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4" style={{ color: "#191970" }}>
                4. Listing Standards
              </h2>
              <h3 className="text-xl font-semibold mb-3" style={{ color: "#191970" }}>
                4.1 Accuracy and Honesty
              </h3>
              <p className="text-gray-700 leading-relaxed mb-3">Sellers must:</p>
              <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-1 ml-4 mb-6">
                <li>Accurately describe condition, age (if known), and flaws</li>
                <li>Use real photos of the actual item being sold</li>
                <li>Avoid misleading titles or descriptions</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-6">
                Transparency builds trust - and trust builds sales.
              </p>

              <h3 className="text-xl font-semibold mb-3" style={{ color: "#191970" }}>
                4.2 Photos
              </h3>
              <p className="text-gray-700 leading-relaxed mb-3">Listings should include:</p>
              <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-1 ml-4 mb-6">
                <li>Clear, well-lit images</li>
                <li>Multiple angles where helpful</li>
                <li>Close-ups of wear, marks, or imperfections</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-6">
                Great photos do not need to be fancy - just honest.
              </p>

              <h3 className="text-xl font-semibold mb-3" style={{ color: "#191970" }}>
                4.3 Storytelling (Encouraged)
              </h3>
              <p className="text-gray-700 leading-relaxed mb-3">We love listings that include:</p>
              <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-1 ml-4">
                <li>How you found the item</li>
                <li>What makes it special</li>
                <li>Where it might live next</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                Stories help buyers connect - and often lead to faster sales.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4" style={{ color: "#191970" }}>
                5. Pricing and Fees
              </h2>
              <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-1 ml-4">
                <li>Sellers set their own prices unless participating in Concierge Selling</li>
                <li>Any applicable seller fees or promotions will be clearly disclosed</li>
                <li>Prices should reflect condition, rarity, and market reality</li>
                <li>If pricing assistance is available, we will let you know</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4" style={{ color: "#191970" }}>
                6. Shipping Expectations
              </h2>
              <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-1 ml-4">
                <li>Shipping items promptly and securely</li>
                <li>Using appropriate packaging for fragile or vintage items</li>
                <li>Providing accurate shipping details</li>
                <li>Clear communication around shipping timelines helps avoid disputes</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4" style={{ color: "#191970" }}>
                7. Returns and Issues
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">Unless otherwise stated:</p>
              <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-1 ml-4 mb-4">
                <li>Sales are generally final</li>
                <li>Returns are handled seller-by-seller</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-2">If an issue arises:</p>
              <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-1 ml-4">
                <li>Communicate respectfully with the buyer</li>
                <li>Attempt resolution in good faith</li>
                <li>ThriftShopper may assist but does not guarantee refunds</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4" style={{ color: "#191970" }}>
                8. Reviews, Messaging, and Conduct
              </h2>
              <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-1 ml-4">
                <li>Communicate respectfully and professionally</li>
                <li>Respond to buyer questions in a timely manner</li>
                <li>Avoid spam, pressure tactics, or off-platform payment requests</li>
                <li>Reviews should reflect real experiences</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                Manipulating reviews or messaging buyers improperly may result in account action.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4" style={{ color: "#191970" }}>
                9. Curation, Removal, and Enforcement
              </h2>
              <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-1 ml-4">
                <li>Decline or remove listings that do not align with marketplace standards</li>
                <li>Suspend or remove sellers who repeatedly violate guidelines</li>
                <li>Update these Guidelines as the marketplace evolves</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                Curation helps protect buyers, sellers, and the overall quality of the platform.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4" style={{ color: "#191970" }}>
                10. Concierge Selling (Optional)
              </h2>
              <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-1 ml-4">
                <li>Some sellers may be invited to participate in Concierge Selling</li>
                <li>Participation is optional and subject to additional terms</li>
                <li>Not all items are eligible</li>
                <li>Fee splits and responsibilities will be clearly disclosed</li>
              </ul>
            </section>

            <section className="mb-2">
              <h2 className="text-2xl font-bold mb-4" style={{ color: "#191970" }}>
                11. Questions or Not Sure?
              </h2>
              <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-1 ml-4">
                <li>Ask before listing</li>
                <li>Reach out with photos or details</li>
                <li>We are happy to guide you</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                Contact:{" "}
                <a href="mailto:support@thriftshopper.com" className="text-[#EFBF05] hover:underline font-semibold">
                  support@thriftshopper.com
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
