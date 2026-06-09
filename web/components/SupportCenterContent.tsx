"use client";

import React, { useState } from "react";
import Link from "next/link";
import { HelpCircle, ChevronDown, ChevronUp } from "lucide-react";

interface SupportCenterContentProps {
  /** Auto-expand a topic on load (e.g. when returning from a policy page). */
  initialExpandedTopic?: string | null;
}

export function SupportCenterContent({
  initialExpandedTopic = null,
}: SupportCenterContentProps) {
  const [expandedTopic, setExpandedTopic] = useState<string | null>(initialExpandedTopic);

  const toggleTopic = (topic: string) => {
    setExpandedTopic(expandedTopic === topic ? null : topic);
  };

  return (
    <div className="space-y-2">
      {/* Quick Tips */}
      <div className="rounded-lg bg-white/5 border border-transparent hover:border-[#16193a]/50 overflow-hidden">
        <button
          type="button"
          className="w-full p-3 rounded-lg hover:bg-[#16193a]/30 transition-colors text-left flex items-center justify-between"
          onClick={() => toggleTopic("quick-tips")}
        >
          <div className="flex items-center gap-2 flex-1">
            <HelpCircle className="h-4 w-4" style={{ color: "#EFBF05" }} />
            <div>
              <p className="text-sm text-white">Quick Tips</p>
              <p className="text-xs text-white/60">Get started fast</p>
            </div>
          </div>
          {expandedTopic === "quick-tips" ? (
            <ChevronUp className="h-4 w-4 text-white/60" />
          ) : (
            <ChevronDown className="h-4 w-4 text-white/60" />
          )}
        </button>
        {expandedTopic === "quick-tips" && (
          <div className="px-3 pb-3 pt-0 border-t border-white/10">
            <div className="pt-3 space-y-3 text-xs">
              <div>
                <p className="font-semibold mb-1" style={{ color: "#EFBF05" }}>
                  BUYERS
                </p>
                <p className="text-white/90 leading-relaxed">Browse curated finds • Swipe discovery-style</p>
                <p className="text-white/90 leading-relaxed">
                  Use the Mood Wheel, search across attributes, or try voice search
                </p>
                <p className="text-white/90 leading-relaxed">Most sales are final</p>
              </div>
              <div>
                <p className="font-semibold mb-1" style={{ color: "#EFBF05" }}>
                  SELLERS
                </p>
                <p className="text-white/90 leading-relaxed">
                  Upload or take photos — think storefront glimpses, not perfection
                </p>
                <p className="text-white/90 leading-relaxed">Background removal helps, but honesty matters more</p>
                <p className="text-white/90 leading-relaxed">
                  Use AI tools to draft listings — edit anything, your voice wins
                </p>
              </div>
              <div>
                <p className="font-semibold mb-1" style={{ color: "#EFBF05" }}>
                  STORIES MATTER
                </p>
                <p className="text-white/90 leading-relaxed">
                  Secondhand works best when there&apos;s a story behind it — whether you&apos;re buying or selling.
                </p>
              </div>
              <div>
                <p className="font-semibold mb-1" style={{ color: "#EFBF05" }}>
                  YOUR CANVAS
                </p>
                <p className="text-white/90 leading-relaxed">
                  Your hub for favorites, orders, messages, and listings.
                </p>
              </div>
              <div>
                <p className="font-semibold mb-1" style={{ color: "#EFBF05" }}>
                  NEED HELP?
                </p>
                <p className="text-white/90 leading-relaxed">
                  <a href="mailto:support@thriftshopper.com" className="underline hover:text-[#EFBF05]">
                    support@thriftshopper.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Seller Guidelines — abbreviated on help page; full content in modal version kept via same component */}
      <div className="rounded-lg bg-white/5 border border-transparent hover:border-[#16193a]/50 overflow-hidden">
        <button
          type="button"
          className="w-full p-3 rounded-lg hover:bg-[#16193a]/30 transition-colors text-left flex items-center justify-between"
          onClick={() => toggleTopic("selling")}
        >
          <div className="flex items-center gap-2 flex-1">
            <HelpCircle className="h-4 w-4" style={{ color: "#EFBF05" }} />
            <div>
              <p className="text-sm text-white">Seller Guidelines</p>
              <p className="text-xs text-white/60">Seller support & common questions</p>
            </div>
          </div>
          {expandedTopic === "selling" ? (
            <ChevronUp className="h-4 w-4 text-white/60" />
          ) : (
            <ChevronDown className="h-4 w-4 text-white/60" />
          )}
        </button>
        {expandedTopic === "selling" && (
          <div className="px-3 pb-3 pt-0 border-t border-white/10">
            <div className="pt-3 space-y-3 text-xs text-white/90 leading-relaxed">
              <p>
                Start with one great item, take honest photos, and treat AI suggestions as optional. You&apos;re always
                in control of title, description, and price.
              </p>
              <p>
                Read the full{" "}
                <Link href="/seller-guidelines?from=help" className="underline hover:text-[#EFBF05]">
                  Seller Guidelines
                </Link>{" "}
                for listing rules and best practices.
              </p>
              <p>
                Questions?{" "}
                <a href="mailto:support@thriftshopper.com" className="underline hover:text-[#EFBF05]">
                  support@thriftshopper.com
                </a>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Shipping & Returns */}
      <div className="rounded-lg bg-white/5 border border-transparent hover:border-[#16193a]/50 overflow-hidden">
        <button
          type="button"
          className="w-full p-3 rounded-lg hover:bg-[#16193a]/30 transition-colors text-left flex items-center justify-between"
          onClick={() => toggleTopic("shipping-returns")}
        >
          <div className="flex items-center gap-2 flex-1">
            <HelpCircle className="h-4 w-4" style={{ color: "#EFBF05" }} />
            <div>
              <p className="text-sm text-white">Shipping & Returns</p>
              <p className="text-xs text-white/60">Policies and information</p>
            </div>
          </div>
          {expandedTopic === "shipping-returns" ? (
            <ChevronUp className="h-4 w-4 text-white/60" />
          ) : (
            <ChevronDown className="h-4 w-4 text-white/60" />
          )}
        </button>
        {expandedTopic === "shipping-returns" && (
          <div className="px-3 pb-3 pt-0 border-t border-white/10">
            <div className="pt-3 space-y-4 text-xs">
              <div>
                <h4 className="text-sm font-semibold mb-2" style={{ color: "#EFBF05" }}>
                  How Shipping & Pickup Work
                </h4>
                <ul className="list-disc list-inside text-white/90 leading-relaxed space-y-1 ml-2">
                  <li>Each listing includes the seller&apos;s available fulfillment options</li>
                  <li>Some items can be shipped directly</li>
                  <li>Some items are pickup only</li>
                  <li>
                    Some sellers may ask buyers to contact them to arrange pickup, shipping, or delivery
                  </li>
                  <li>Any applicable shipping costs will be shown on the listing</li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-2" style={{ color: "#EFBF05" }}>
                  Return Policy
                </h4>
                <p className="text-white/90 leading-relaxed mb-2">
                  ThriftShopper is a marketplace connecting individual sellers with buyers. Return policies work
                  differently than traditional retail:
                </p>
                <ul className="list-disc list-inside text-white/90 leading-relaxed space-y-1 ml-2">
                  <li>Most items are final sale unless the seller states otherwise</li>
                  <li>Each seller may set their own return terms</li>
                  <li>If something goes wrong, contact the seller first through messaging</li>
                  <li>
                    For unresolved issues, contact{" "}
                    <a href="mailto:support@thriftshopper.com" className="underline hover:text-[#EFBF05]">
                      support@thriftshopper.com
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-2" style={{ color: "#EFBF05" }}>
                  Full Policy Details
                </h4>
                <p className="text-white/90 leading-relaxed">
                  Read our complete{" "}
                  <Link href="/returns?from=help" className="underline hover:text-[#EFBF05]">
                    Buyer Protection & Returns Policy
                  </Link>
                  .
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Account & Settings */}
      <div className="rounded-lg bg-white/5 border border-transparent hover:border-[#16193a]/50 overflow-hidden">
        <button
          type="button"
          className="w-full p-3 rounded-lg hover:bg-[#16193a]/30 transition-colors text-left flex items-center justify-between"
          onClick={() => toggleTopic("account-settings")}
        >
          <div className="flex items-center gap-2 flex-1">
            <HelpCircle className="h-4 w-4" style={{ color: "#EFBF05" }} />
            <div>
              <p className="text-sm text-white">Account & Settings</p>
              <p className="text-xs text-white/60">Manage your account</p>
            </div>
          </div>
          {expandedTopic === "account-settings" ? (
            <ChevronUp className="h-4 w-4 text-white/60" />
          ) : (
            <ChevronDown className="h-4 w-4 text-white/60" />
          )}
        </button>
        {expandedTopic === "account-settings" && (
          <div className="px-3 pb-3 pt-0 border-t border-white/10">
            <div className="pt-3 space-y-4 text-xs">
              <div>
                <h4 className="text-sm font-semibold mb-2" style={{ color: "#EFBF05" }}>
                  Your Canvas
                </h4>
                <p className="text-white/90 leading-relaxed mb-2">
                  Your Canvas is your personal ThriftShopper dashboard where you can:
                </p>
                <ul className="list-disc list-inside text-white/90 leading-relaxed space-y-1 ml-2">
                  <li>View saved favorites</li>
                  <li>Track purchases</li>
                  <li>Manage your listings (sellers)</li>
                  <li>View orders and messages</li>
                  <li>Update your profile</li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-2" style={{ color: "#EFBF05" }}>
                  Account Settings
                </h4>
                <p className="text-white/90 leading-relaxed mb-2">
                  Update your profile, change your password, and find legal policies in{" "}
                  <Link href="/settings" className="underline hover:text-[#EFBF05]">
                    Settings
                  </Link>
                  .
                </p>
                <p className="text-white/90 leading-relaxed">
                  Sellers: store details and shipping defaults live in{" "}
                  <Link href="/seller/settings" className="underline hover:text-[#EFBF05]">
                    Seller settings
                  </Link>
                  .
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-white/10">
        <p className="text-xs text-white/60 leading-relaxed">
          Terms, privacy, and marketplace policies are in{" "}
          <Link href="/settings" className="underline hover:text-[#EFBF05] text-white/80">
            Settings
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
