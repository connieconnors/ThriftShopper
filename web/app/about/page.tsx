"use client";

import Link from "next/link";
import { TSLogo } from "@/components/TSLogo";
import { ArrowLeft, Mail, Phone } from "lucide-react";

export default function AboutPage() {
  return (
    <main className="min-h-screen flex flex-col" style={{ backgroundColor: '#f8f9fa', fontFamily: 'Merriweather, serif' }}>
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
            About ThriftShopper
          </h1>
          
          <div className="prose prose-lg max-w-none" style={{ fontFamily: 'Merriweather, serif' }}>
            <p className="text-gray-700 leading-relaxed mb-6">
              ThriftShopper is the first buyer discovery marketplace for secondhand treasures, allowing sellers to easily list treasures for buyers to discover, not search and scroll for.
            </p>

            <p className="text-gray-700 leading-relaxed mb-8">
              The company was founded in 2025 by Connie Connors, a serial entrepreneur and studied "thrifter" or as her friends say, a "thriftslayer," who wants to bring the magic of discovery to online shopping. You can find her on Saturday mornings where she volunteers at the local church thrift shop, or follow her car anywhere because it has autopilot braking for anything secondhand. She loves meeting shop managers and inspired buyers.
            </p>

            <div className="mb-8 p-6 rounded-lg" style={{ backgroundColor: '#FFF8E6', borderLeft: '4px solid #EFBF05' }}>
              <p className="text-gray-700 leading-relaxed mb-4">
                Connie's passion is hearing the stories that make every treasure magical. Her mascot is her Wizard of Oz rhinestone encrusted belt with Dorothy and team on the yellow brick road. She's always happy to hear about your latest find, and perhaps your new mascot.
              </p>
              <div className="mt-4 flex justify-center">
                <img
                  src="/images/dorothy-belt.jpg"
                  alt="Wizard of Oz rhinestone encrusted belt with Dorothy and team on the yellow brick road"
                  className="max-w-full h-auto rounded-lg shadow-md"
                  style={{ maxWidth: '500px' }}
                />
              </div>
            </div>

            {/* Contact Information */}
            <section className="mt-8 pt-6 border-t border-gray-200">
              <h2 className="text-xl font-semibold mb-4" style={{ color: '#191970' }}>
                Get in Touch
              </h2>
              <div className="space-y-3">
                <a
                  href="mailto:connie@thriftshopper.com"
                  className="flex items-center gap-3 text-gray-700 hover:text-[#EFBF05] transition-colors"
                >
                  <Mail className="h-5 w-5" style={{ color: '#EFBF05' }} />
                  <span>connie@thriftshopper.com</span>
                </a>
                <a
                  href="tel:+19177193539"
                  className="flex items-center gap-3 text-gray-700 hover:text-[#EFBF05] transition-colors"
                >
                  <Phone className="h-5 w-5" style={{ color: '#EFBF05' }} />
                  <span>+1-917-719-3539</span>
                </a>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

