"use client";

import React, { useState } from "react";
import TSModal from "./TSModal";
import { TSAppIcon } from "./TSAppIcon";
import { HelpCircle, ChevronDown, ChevronUp } from "lucide-react";

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SupportModal({ isOpen, onClose }: SupportModalProps) {
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);

  const toggleTopic = (topic: string) => {
    setExpandedTopic(expandedTopic === topic ? null : topic);
  };

  return (
    <TSModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <TSAppIcon size={22} className="rounded-md" />
          <span>Support</span>
        </div>
      }
    >
      <div className="space-y-2">
        {/* Quick Tips */}
        <div className="rounded-lg bg-white/5 border border-transparent hover:border-[#16193a]/50 overflow-hidden">
          <button 
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
                  <p className="font-semibold mb-1" style={{ color: '#EFBF05' }}>BUYERS</p>
                  <p className="text-white/90 leading-relaxed">
                    Browse curated finds • Swipe discovery-style
                  </p>
                  <p className="text-white/90 leading-relaxed">
                    Use the Mood Wheel, search across attributes, or try voice search
                  </p>
                  <p className="text-white/90 leading-relaxed">
                    Most sales are final
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-1" style={{ color: '#EFBF05' }}>SELLERS</p>
                  <p className="text-white/90 leading-relaxed">
                    Upload or take photos — think storefront glimpses, not perfection
                  </p>
                  <p className="text-white/90 leading-relaxed">
                    Background removal helps, but honesty matters more
                  </p>
                  <p className="text-white/90 leading-relaxed">
                    Use AI tools to draft listings — edit anything, your voice wins
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-1" style={{ color: '#EFBF05' }}>STORIES MATTER</p>
                  <p className="text-white/90 leading-relaxed">
                    Secondhand works best when there's a story behind it — whether you're buying or selling.
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-1" style={{ color: '#EFBF05' }}>YOUR CANVAS</p>
                  <p className="text-white/90 leading-relaxed">
                    Your hub for favorites, orders, messages, and listings.
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-1" style={{ color: '#EFBF05' }}>NEED HELP?</p>
                  <p className="text-white/90 leading-relaxed">
                    <a href="mailto:support@thriftshopper.com" className="underline hover:text-[#EFBF05]">support@thriftshopper.com</a>
                  </p>
                  <p className="text-white/90 leading-relaxed">
                    <a
                      href="https://thriftshopper.com/support"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-[#EFBF05]"
                    >
                      thriftshopper.com/support
                    </a>
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-1" style={{ color: '#EFBF05' }}>WE&apos;D LOVE YOUR FEEDBACK</p>
                  <p className="text-white/90 leading-relaxed">
                    ThriftShopper is always improving. If you have suggestions, questions, or run into an issue, we&apos;d love to hear from you.
                  </p>
                  <p className="text-white/90 leading-relaxed">
                    <a href="mailto:support@thriftshopper.com" className="underline hover:text-[#EFBF05]">support@thriftshopper.com</a>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Seller Guidelines */}
        <div className="rounded-lg bg-white/5 border border-transparent hover:border-[#16193a]/50 overflow-hidden">
          <button 
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
              <div className="pt-3 space-y-4 text-xs">
                <div>
                  <p className="font-semibold mb-1" style={{ color: '#EFBF05' }}>START WITH ONE GREAT ITEM</p>
                  <p className="text-white/90 leading-relaxed">
                    The best first listings have a story — something well-made, interesting, collectible, or simply loved. One thoughtful listing usually performs better than ten rushed ones.
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-1" style={{ color: '#EFBF05' }}>TAKE HONEST PHOTOS</p>
                  <p className="text-white/90 leading-relaxed">
                    Secondhand isn't perfect — and that's okay. Good light, a clear view, and showing real wear builds trust. Small scuffs or patina don't hurt your listing; they help buyers understand what they're getting.
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-1" style={{ color: '#EFBF05' }}>YOU'LL SEE YOUR PHOTO RIGHT AWAY</p>
                  <p className="text-white/90 leading-relaxed">
                    Your photo appears immediately. Behind the scenes, ThriftShopper analyzes the image to suggest a title, description, and price. Details may fill in gradually — that's normal.
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-1" style={{ color: '#EFBF05' }}>AI SUGGESTIONS ARE OPTIONAL</p>
                  <p className="text-white/90 leading-relaxed mb-2">
                    Think of AI as a helpful second opinion, not a decision-maker.
                  </p>
                  <p className="text-white/90 leading-relaxed mb-2">
                    You're always in control:
                  </p>
                  <ul className="list-disc list-inside text-white/90 leading-relaxed space-y-1 ml-2">
                    <li>Edit anything</li>
                    <li>Ignore suggestions</li>
                    <li>Your typing takes priority</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold mb-1" style={{ color: '#EFBF05' }}>PRICING IS ABOUT FIT, NOT SPEED</p>
                  <p className="text-white/90 leading-relaxed">
                    Suggested prices reflect buyer interest, condition cues, and recent sales — not just what others are asking. A good match leads to fewer questions and smoother sales.
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-1" style={{ color: '#EFBF05' }}>DISCOVERY WORKS DIFFERENTLY HERE</p>
                  <p className="text-white/90 leading-relaxed">
                    Your item may appear in partial views or grouped with others as buyers explore. This helps the right people find it — even if they weren't searching for it yet.
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-1" style={{ color: '#EFBF05' }}>START SMALL</p>
                  <p className="text-white/90 leading-relaxed">
                    We intentionally slow mass uploads. Fewer, more thoughtful listings tend to perform better over time. You can always add more later.
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-1" style={{ color: '#EFBF05' }}>COMMON SELLER QUESTIONS</p>
                </div>
                <div>
                  <p className="font-semibold mb-1" style={{ color: '#EFBF05' }}>WHY DOES IT SOMETIMES TAKE LONGER TO UPLOAD A LISTING?</p>
                  <p className="text-white/90 leading-relaxed">
                    ThriftShopper doesn't just upload a photo — it analyzes it. We look at condition cues, pricing signals, and buyer demand so your item reaches the right buyer, not just the fastest one.
                  </p>
                  <p className="text-white/90 leading-relaxed mt-2">
                    Your photo appears immediately; details continue filling in as analysis completes.
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-1" style={{ color: '#EFBF05' }}>WHY DOES THE APP FEEL DIFFERENT FROM OTHER RESALE APPS?</p>
                  <p className="text-white/90 leading-relaxed">
                    Most resale apps optimize for speed and volume. ThriftShopper optimizes for fit — better matches, fewer mismatches, and a calmer discovery experience that feels like real shopping.
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-1" style={{ color: '#EFBF05' }}>WHY ARE SOME FIELDS AUTO-FILLED WHILE I'M EDITING?</p>
                  <p className="text-white/90 leading-relaxed">
                    Our AI suggests titles, descriptions, and pricing as it learns more about your item. You're always in control — your typing takes priority.
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-1" style={{ color: '#EFBF05' }}>WHY DOES PRICING SOMETIMES CHANGE OR GET SUGGESTED DIFFERENTLY THAN I EXPECTED?</p>
                  <p className="text-white/90 leading-relaxed mb-2">
                    Suggestions reflect:
                  </p>
                  <ul className="list-disc list-inside text-white/90 leading-relaxed space-y-1 ml-2 mb-2">
                    <li>Current buyer demand</li>
                    <li>Photo-based condition cues</li>
                    <li>Similar items buyers engage with</li>
                    <li>Recent sales (not just listings)</li>
                  </ul>
                  <p className="text-white/90 leading-relaxed">
                    They're guidance, not requirements.
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-1" style={{ color: '#EFBF05' }}>WHY DO PHOTOS MATTER SO MUCH?</p>
                  <p className="text-white/90 leading-relaxed">
                    Clear photos help buyers understand wear, age, and character. Imperfections often add honesty and trust — not risk.
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-1" style={{ color: '#EFBF05' }}>WHY DON'T YOU ACCEPT EVERY ITEM?</p>
                  <p className="text-white/90 leading-relaxed">
                    ThriftShopper is curated by design. We focus on items with story, craftsmanship, collectibility, or strong buyer interest. This keeps discovery meaningful and helps sellers get better engagement.
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-1" style={{ color: '#EFBF05' }}>WHY DOES DISCOVERY LOOK DIFFERENT FROM TRADITIONAL GRIDS?</p>
                  <p className="text-white/90 leading-relaxed">
                    We design discovery to feel like wandering, not scrolling a warehouse. Partial views and unexpected groupings mirror how people shop in real life — noticing, pausing, and coming back.
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-1" style={{ color: '#EFBF05' }}>WHY CAN'T I INSTANTLY UPLOAD LOTS OF ITEMS?</p>
                  <p className="text-white/90 leading-relaxed">
                    We slow mass uploads on purpose. Fewer, more thoughtful listings perform better and lead to happier matches for buyers and sellers alike.
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-1" style={{ color: '#EFBF05' }}>WHY IS MESSAGING GUIDED OR LIMITED?</p>
                  <p className="text-white/90 leading-relaxed">
                    Guided messaging reduces confusion and friction. Most questions are predictable, which keeps conversations respectful, efficient, and human — and we step in when needed.
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-1" style={{ color: '#EFBF05' }}>WHY DOES THRIFTSHOPPER SOMETIMES ASK ME TO WAIT?</p>
                  <p className="text-white/90 leading-relaxed">
                    Pauses usually mean something important is happening: verification, matching, pricing checks, or payment processing. We'd rather get it right than rush it.
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-1" style={{ color: '#EFBF05' }}>NEED HELP?</p>
                  <p className="text-white/90 leading-relaxed mb-2">
                    We're real people behind this.
                  </p>
                  <p className="text-white/90 leading-relaxed mb-2">
                    Email us anytime: <a href="mailto:support@thriftshopper.com" className="underline hover:text-[#EFBF05]">support@thriftshopper.com</a>
                  </p>
                  <p className="text-white/90 leading-relaxed italic">
                    Built for discovery — not speed alone.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Shipping & Returns */}
        <div className="rounded-lg bg-white/5 border border-transparent hover:border-[#16193a]/50 overflow-hidden">
          <button 
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
                      <h4 className="text-sm font-semibold mb-2" style={{ color: '#EFBF05' }}>
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
                      <h4 className="text-sm font-semibold mb-2" style={{ color: '#EFBF05' }}>
                        Return Policy
                      </h4>
                      <p className="text-white/90 leading-relaxed mb-2">
                        ThriftShopper is a marketplace connecting individual sellers with buyers. Return policies work differently than traditional retail:
                      </p>
                      <ul className="list-disc list-inside text-white/90 leading-relaxed space-y-1 ml-2">
                        <li>Most items are final sale unless the seller states otherwise</li>
                        <li>Each seller may set their own return terms</li>
                        <li>If something goes wrong, contact the seller first through messaging</li>
                        <li>For unresolved issues, contact <a href="mailto:support@thriftshopper.com" className="underline hover:text-[#EFBF05]">support@thriftshopper.com</a></li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold mb-2" style={{ color: '#EFBF05' }}>
                        When Returns May Apply
                      </h4>
                      <p className="text-white/90 leading-relaxed mb-2">
                        Issues like significantly misdescribed items, wrong items shipped, or undisclosed damage may qualify for return or refund.
                      </p>
                      <p className="text-white/90 leading-relaxed italic">
                        Normal wear consistent with photos and descriptions is not considered a defect.
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold mb-2" style={{ color: '#EFBF05' }}>
                        Full Policy Details
                      </h4>
                      <p className="text-white/90 leading-relaxed">
                        Read our complete{" "}
                        <a href="/returns?from=help" className="underline hover:text-[#EFBF05]">
                          Buyer Protection & Returns Policy
                        </a>.
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold mb-2" style={{ color: '#EFBF05' }}>
                        Questions?
                      </h4>
                      <p className="text-white/90 leading-relaxed">
                        Email <a href="mailto:support@thriftshopper.com" className="underline hover:text-[#EFBF05]">support@thriftshopper.com</a>
                      </p>
                    </div>
                  </div>
                </div>
              )}
        </div>

        {/* Account & Settings */}
        <div className="rounded-lg bg-white/5 border border-transparent hover:border-[#16193a]/50 overflow-hidden">
          <button 
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
                      <h4 className="text-sm font-semibold mb-2" style={{ color: '#EFBF05' }}>
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
                      <h4 className="text-sm font-semibold mb-2" style={{ color: '#EFBF05' }}>
                        Account Settings
                      </h4>
                      <p className="text-white/90 leading-relaxed mb-2">
                        Update your profile, change your password, and find legal policies in{" "}
                        <a href="/settings" className="underline hover:text-[#EFBF05]">
                          Settings
                        </a>
                        .
                      </p>
                      <p className="text-white/90 leading-relaxed">
                        Sellers: store details and shipping defaults live in{" "}
                        <a href="/seller/settings" className="underline hover:text-[#EFBF05]">
                          Seller settings
                        </a>
                        . Connect Stripe from your seller dashboard when you&apos;re ready to publish.
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold mb-2" style={{ color: '#EFBF05' }}>
                        We&apos;d Love Your Feedback
                      </h4>
                      <p className="text-white/90 leading-relaxed">
                        ThriftShopper is always improving. If you have suggestions, questions, or run into an issue, we&apos;d love to hear from you.
                      </p>
                      <p className="text-white/90 leading-relaxed mt-2">
                        <a href="mailto:support@thriftshopper.com" className="underline hover:text-[#EFBF05]">
                          support@thriftshopper.com
                        </a>
                      </p>
                    </div>
                  </div>
                </div>
              )}
        </div>


        <div className="pt-3 border-t border-white/10">
          <p className="text-xs text-white/60 leading-relaxed">
            Terms, privacy, and marketplace policies are in{" "}
            <a href="/settings" className="underline hover:text-[#EFBF05] text-white/80">
              Settings
            </a>
            .
          </p>
        </div>
      </div>
    </TSModal>
  );
}

