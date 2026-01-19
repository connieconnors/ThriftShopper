"use client";

import Link from "next/link";
import { TSLogo } from "@/components/TSLogo";
import { ArrowLeft } from "lucide-react";

export default function ProhibitedItemsPage() {
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
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#191970' }}>
            ThriftShopper Prohibited & Restricted Items
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            Last Updated: December 25, 2025
          </p>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 leading-relaxed mb-6">
              ThriftShopper is a curated marketplace for secondhand, vintage, and collectible non-apparel goods. To maintain trust, safety, and quality, certain items are not permitted on our platform.
            </p>
            <p className="text-gray-700 leading-relaxed mb-8">
              This policy supplements our Seller Guidelines and Terms of Use.
            </p>

            <div className="border-t border-b border-gray-300 py-4 my-6">
              <div className="text-center text-gray-400 text-xs">════════════════════════════════════════════════════════════</div>
            </div>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4" style={{ color: '#191970' }}>
                PROHIBITED ITEMS (Never Allowed)
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                The following items may not be listed on ThriftShopper under any circumstances:
              </p>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-3" style={{ color: '#191970' }}>
                    EVERYDAY APPAREL & WEARABLES
                  </h3>
                  <p className="text-gray-700 font-semibold mb-2">Prohibited:</p>
                  <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-1 ml-4 mb-4">
                    <li>Regular clothing (shirts, pants, dresses, jackets, sweaters, etc.)</li>
                    <li>Standard shoes and everyday footwear</li>
                    <li>Athletic wear and activewear</li>
                    <li>Fast fashion or contemporary apparel</li>
                    <li>Used undergarments, socks, or intimate apparel</li>
                    <li>Costumes (unless truly vintage with collectible value)</li>
                  </ul>
                  <p className="text-gray-700 font-semibold mb-2">Exceptions - Allowed if Collectible/Decorative:</p>
                  <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-1 ml-4 mb-3">
                    <li>Vintage designer belts with unique buckles or craftsmanship</li>
                    <li>Statement hats (vintage, designer, or decorative - not everyday baseball caps)</li>
                    <li>Unique boots or shoes with artistic/collectible value (e.g., vintage cowboy boots, designer boots, architectural shoes)</li>
                    <li>Exceptional vintage outerwear, handbags, scarves with design merit</li>
                    <li>Accessories with design merit and/or used as decorative objects (handbags, belts, etc.)</li>
                    <li>Items with clear collectible, artistic, or display value beyond ordinary fashion</li>
                  </ul>
                  <p className="text-gray-700 leading-relaxed italic">
                    When in doubt: If it's interesting enough to display on a shelf or wall rather than just wear, it may qualify. Contact <a href="mailto:support@thriftshopper.com" className="text-[#EFBF05] hover:underline">support@thriftshopper.com</a> before listing.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3" style={{ color: '#191970' }}>
                    COUNTERFEIT & REPLICA GOODS
                  </h3>
                  <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-1 ml-4">
                    <li>Counterfeit designer items or knockoffs</li>
                    <li>Replica items falsely presented as authentic</li>
                    <li>Items infringing on trademarks, copyrights, or intellectual property</li>
                    <li>Bootleg recordings or unauthorized reproductions</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3" style={{ color: '#191970' }}>
                    ILLEGAL & DANGEROUS ITEMS
                  </h3>
                  <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-1 ml-4">
                    <li>Illegal drugs, narcotics, or drug paraphernalia</li>
                    <li>Prescription medications or medical devices requiring prescription</li>
                    <li>Firearms, ammunition, or weapon components</li>
                    <li>Explosives, fireworks, or hazardous materials</li>
                    <li>Lock-picking devices or burglar tools</li>
                    <li>Items designed to circumvent security or law enforcement</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3" style={{ color: '#191970' }}>
                    REGULATED SUBSTANCES
                  </h3>
                  <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-1 ml-4">
                    <li>Alcohol (except sealed collectible bottles with seller approval)</li>
                    <li>Tobacco products, e-cigarettes, or vaping products</li>
                    <li>CBD or THC products</li>
                    <li>Controlled substances of any kind</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3" style={{ color: '#191970' }}>
                    PERSONAL & PRIVATE INFORMATION
                  </h3>
                  <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-1 ml-4">
                    <li>Personal identification documents (driver's licenses, passports, etc.)</li>
                    <li>Government-issued IDs or badges</li>
                    <li>Credit cards, debit cards, or financial instruments</li>
                    <li>Social security cards or tax documents</li>
                    <li>Private personal information or data</li>
                    <li>Medical records or personal health information</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3" style={{ color: '#191970' }}>
                    HUMAN & ANIMAL MATERIALS
                  </h3>
                  <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-1 ml-4">
                    <li>Human body parts, remains, or relics (except human hair)</li>
                    <li>Human organs, tissues, or biological materials</li>
                    <li>Products made from endangered species</li>
                    <li>Ivory or products containing ivory</li>
                    <li>Live animals or insects (except for food use)</li>
                    <li>Pelts or furs from endangered or protected species</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3" style={{ color: '#191970' }}>
                    OFFENSIVE & HARMFUL CONTENT
                  </h3>
                  <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-1 ml-4">
                    <li>Items promoting hate, violence, or discrimination</li>
                    <li>Items glorifying tragedy, disaster, or human suffering</li>
                    <li>Nazi or hate group memorabilia</li>
                    <li>Items depicting or promoting illegal activity</li>
                    <li>Sexually explicit materials or pornography</li>
                    <li>Items exploiting or endangering minors</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3" style={{ color: '#191970' }}>
                    MASS-PRODUCED RETAIL INVENTORY
                  </h3>
                  <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-1 ml-4">
                    <li>New, unused retail merchandise</li>
                    <li>Drop-shipped items</li>
                    <li>Bulk new inventory from wholesalers</li>
                    <li>Mass-produced items without vintage or collectible value</li>
                    <li>Print-on-demand products</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3" style={{ color: '#191970' }}>
                    INTANGIBLE & UNVERIFIABLE ITEMS
                  </h3>
                  <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-1 ml-4">
                    <li>Services or labor</li>
                    <li>Digital downloads or electronically delivered goods</li>
                    <li>Spells, curses, or metaphysical services</li>
                    <li>"Haunted" or supernatural items making unverifiable claims</li>
                    <li>Chance-based listings or mystery boxes</li>
                    <li>Social media engagement (likes, followers, reviews)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3" style={{ color: '#191970' }}>
                    FOOD & CONSUMABLES
                  </h3>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3" style={{ color: '#191970' }}>
                    BEAUTY & PERSONAL CARE
                  </h3>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3" style={{ color: '#191970' }}>
                    MISCELLANEOUS PROHIBITED
                  </h3>
                  <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-1 ml-4">
                    <li>Recalled products or items violating safety standards</li>
                    <li>Stolen property or items of questionable origin</li>
                    <li>Event tickets or gift cards</li>
                    <li>Lottery tickets or gambling materials</li>
                    <li>Pesticides or restricted chemicals</li>
                    <li>Radioactive materials</li>
                    <li>Items requiring special licenses or permits the seller doesn't possess</li>
                  </ul>
                </div>
              </div>
            </section>

            <div className="border-t border-b border-gray-300 py-4 my-6">
              <div className="text-center text-gray-400 text-xs">════════════════════════════════════════════════════════════</div>
            </div>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4" style={{ color: '#191970' }}>
                RESTRICTED ITEMS (Allowed with Conditions)
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                The following items may be listed only if they meet specific requirements:
              </p>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-3" style={{ color: '#191970' }}>
                    VINTAGE "COLLECTIBLES"
                  </h3>
                  <p className="text-gray-700 font-semibold mb-2">Allowed only if:</p>
                  <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-1 ml-4 mb-4">
                    <li>Truly vintage, antique, or collectible</li>
                    <li>Not mass-produced contemporary items</li>
                    <li>Accurately described with age and provenance</li>
                    <li>Do not violate cultural heritage or artifact laws</li>
                  </ul>
                  <p className="text-gray-700 font-semibold mb-2">Prohibited:</p>
                  <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-1 ml-4">
                    <li>Stolen artifacts or illegally obtained cultural items</li>
                    <li>Items protected under antiquities laws</li>
                    <li>Grave-related items or human remains</li>
                    <li>Cave formations or protected geological specimens</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3" style={{ color: '#191970' }}>
                    ART & REPRODUCTIONS
                  </h3>
                  <p className="text-gray-700 font-semibold mb-2">Allowed only if:</p>
                  <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-1 ml-4 mb-4">
                    <li>Clearly identified as reproductions if not original</li>
                    <li>Do not violate copyright or trademark</li>
                    <li>Seller has rights to sell or reproduce</li>
                    <li>Authenticity is accurately represented</li>
                  </ul>
                  <p className="text-gray-700 font-semibold mb-2">Prohibited:</p>
                  <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-1 ml-4">
                    <li>Falsely attributed art</li>
                    <li>Unauthorized reproductions</li>
                    <li>Plagiarized or stolen artwork</li>
                    <li>Art misrepresented as original when it is a copy</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3" style={{ color: '#191970' }}>
                    BOOKS & MEDIA
                  </h3>
                  <p className="text-gray-700 font-semibold mb-2">Allowed:</p>
                  <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-1 ml-4 mb-4">
                    <li>Used books, vintage magazines, ephemera</li>
                    <li>Vinyl records, vintage CDs</li>
                    <li>Movie posters and entertainment memorabilia</li>
                  </ul>
                  <p className="text-gray-700 font-semibold mb-2">Prohibited:</p>
                  <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-1 ml-4">
                    <li>Bootleg recordings</li>
                    <li>Pirated or copied media</li>
                    <li>Items with broken copyright protections</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3" style={{ color: '#191970' }}>
                    COLLECTIBLE CURRENCY & STAMPS
                  </h3>
                  <p className="text-gray-700 font-semibold mb-2">Allowed only if:</p>
                  <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-1 ml-4 mb-4">
                    <li>Clearly collectible (not intended as legal tender)</li>
                    <li>Graded by approved services (if claiming graded status)</li>
                    <li>Accurately described</li>
                  </ul>
                  <p className="text-gray-700 font-semibold mb-2">Prohibited:</p>
                  <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-1 ml-4">
                    <li>Counterfeit currency</li>
                    <li>Altered or modified currency</li>
                    <li>Items misrepresented as more valuable than actual worth</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3" style={{ color: '#191970' }}>
                    ELECTRONICS & TECHNOLOGY
                  </h3>
                  <p className="text-gray-700 font-semibold mb-2">Allowed only if:</p>
                  <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-1 ml-4 mb-4">
                    <li>Functioning and accurately described</li>
                    <li>Do not violate FCC regulations</li>
                    <li>Not stolen or reported lost</li>
                    <li>Data wiped and reset to factory settings</li>
                  </ul>
                  <p className="text-gray-700 font-semibold mb-2">Prohibited:</p>
                  <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-1 ml-4">
                    <li>Surveillance or transmission devices (wiretaps, jammers, etc.)</li>
                    <li>Devices designed to intercept communications</li>
                    <li>Items with locked accounts or activation locks</li>
                    <li>Stolen devices or those with questionable ownership</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3" style={{ color: '#191970' }}>
                    FURNITURE & HOME GOODS
                  </h3>
                  <p className="text-gray-700 font-semibold mb-2">Allowed:</p>
                  <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-1 ml-4 mb-4">
                    <li>Used furniture, home decor, vintage housewares</li>
                  </ul>
                  <p className="text-gray-700 font-semibold mb-2">Restricted:</p>
                  <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-1 ml-4">
                    <li>Must meet current safety standards</li>
                    <li>No recalled items</li>
                    <li>Items with lead paint must be disclosed</li>
                    <li>Upholstered items must be clean and free of infestation</li>
                  </ul>
                </div>
              </div>
            </section>

            <div className="border-t border-b border-gray-300 py-4 my-6">
              <div className="text-center text-gray-400 text-xs">════════════════════════════════════════════════════════════</div>
            </div>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4" style={{ color: '#191970' }}>
                SELLER RESPONSIBILITIES
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                As a ThriftShopper seller, you are responsible for:
              </p>
              <ol className="list-decimal list-inside text-gray-700 leading-relaxed space-y-2 ml-4">
                <li>Knowing and following this policy</li>
                <li>Ensuring items comply with federal, state, and local laws</li>
                <li>Accurately describing item condition and any restrictions</li>
                <li>Disclosing any known defects, damage, or safety concerns</li>
                <li>Providing proof of authenticity when relevant</li>
                <li>Obtaining necessary licenses or permissions for regulated items</li>
              </ol>
            </section>

            <div className="border-t border-b border-gray-300 py-4 my-6">
              <div className="text-center text-gray-400 text-xs">════════════════════════════════════════════════════════════</div>
            </div>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4" style={{ color: '#191970' }}>
                ENFORCEMENT
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Violating this policy may result in:
              </p>
              <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-1 ml-4 mb-4">
                <li>Listing removal without notice</li>
                <li>Seller account warning</li>
                <li>Temporary suspension</li>
                <li>Permanent account termination</li>
                <li>Legal action if items are illegal</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-2">
                ThriftShopper reserves the right to:
              </p>
              <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-1 ml-4">
                <li>Remove listings that violate this policy</li>
                <li>Request additional documentation or verification</li>
                <li>Report illegal activity to appropriate authorities</li>
                <li>Update this policy as needed</li>
              </ul>
            </section>

            <div className="border-t border-b border-gray-300 py-4 my-6">
              <div className="text-center text-gray-400 text-xs">════════════════════════════════════════════════════════════</div>
            </div>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4" style={{ color: '#191970' }}>
                REPORTING VIOLATIONS
              </h2>
              <p className="text-gray-700 leading-relaxed">
                If you see a listing that violates this policy:
              </p>
              <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-1 ml-4">
                <li>Use the "Report" button on the listing</li>
                <li>Email <a href="mailto:support@thriftshopper.com" className="text-[#EFBF05] hover:underline">support@thriftshopper.com</a> with listing details</li>
              </ul>
            </section>

            <div className="border-t border-b border-gray-300 py-4 my-6">
              <div className="text-center text-gray-400 text-xs">════════════════════════════════════════════════════════════</div>
            </div>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4" style={{ color: '#191970' }}>
                QUESTIONS?
              </h2>
              <p className="text-gray-700 leading-relaxed mb-2">
                Not sure if your item is allowed? Contact us before listing:
              </p>
              <p className="text-gray-700 leading-relaxed">
                Email <a href="mailto:support@thriftshopper.com" className="text-[#EFBF05] hover:underline font-semibold">support@thriftshopper.com</a>
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                We're happy to help clarify.
              </p>
            </section>

            <div className="border-t border-b border-gray-300 py-4 my-6">
              <div className="text-center text-gray-400 text-xs">════════════════════════════════════════════════════════════</div>
            </div>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3" style={{ color: '#191970' }}>
                Legal Disclaimer
              </h2>
              <p className="text-gray-700 leading-relaxed text-sm italic">
                This policy does not create any contractual rights or obligations beyond those in our Terms of Use. ThriftShopper reserves the right to refuse service to anyone for any reason consistent with applicable law. Sellers are solely responsible for ensuring their listings comply with all applicable laws and regulations.
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

