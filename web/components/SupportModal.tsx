"use client";

import React, { useState } from "react";
import TSModal from "./TSModal";
import { TSLogo } from "./TSLogo";
import { HelpCircle, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";

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
          <TSLogo size={20} primaryColor="#ffffff" accentColor="#EFBF05" />
          <span>Support</span>
        </div>
      }
    >
      <div className="space-y-2">
        {/* Beta Notes */}
        <div className="rounded-lg bg-white/5 border border-transparent hover:border-[#191970]/50 overflow-hidden">
          <button 
            className="w-full p-3 rounded-lg hover:bg-[#191970]/30 transition-colors text-left flex items-center justify-between"
            onClick={() => toggleTopic("beta-notes")}
          >
            <div className="flex items-center gap-2 flex-1">
              <HelpCircle className="h-4 w-4" style={{ color: "#EFBF05" }} />
              <div>
                <p className="text-sm text-white">Beta Notes</p>
                <p className="text-xs text-white/60">You're a beta tester</p>
              </div>
            </div>
            {expandedTopic === "beta-notes" ? (
              <ChevronUp className="h-4 w-4 text-white/60" />
            ) : (
              <ChevronDown className="h-4 w-4 text-white/60" />
            )}
          </button>
          {expandedTopic === "beta-notes" && (
            <div className="px-3 pb-3 pt-0 border-t border-white/10">
              <div className="pt-3 space-y-3 text-xs" style={{ fontFamily: "'Source Sans 3', 'Source Sans Pro', sans-serif" }}>
                <p className="text-white/90 leading-relaxed">
                  Tell us what's working, what's broken, what's missing. Use the feedback button or email us <a href="mailto:beta@thriftshopper.com" className="underline hover:text-[#EFBF05]">beta@thriftshopper.com</a>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Quick Tips */}
        <div className="rounded-lg bg-white/5 border border-transparent hover:border-[#191970]/50 overflow-hidden">
          <button 
            className="w-full p-3 rounded-lg hover:bg-[#191970]/30 transition-colors text-left flex items-center justify-between"
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
              <div className="pt-3 space-y-3 text-xs" style={{ fontFamily: "'Source Sans 3', 'Source Sans Pro', sans-serif" }}>
                <div>
                  <p className="font-semibold mb-1" style={{ color: '#EFBF05' }}>BUYERS</p>
                  <p className="text-white/90 leading-relaxed">
                    Browse curated finds • Swipe TikTok-style • Use the mood wheel and search on 29 attributes or use the voice input, "Whimsical gift that has a vintage edge" - Buy securely with Stripe - Track orders in your Canvas • Most sales are final
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-1" style={{ color: '#EFBF05' }}>SELLERS</p>
                  <p className="text-white/90 leading-relaxed">
                    Upload photos or take photos - Just like in a store, give a glimpse of the item - Perfection isn't the key and Remove Background helps - List items with AI tools and review to add or change brand, style and pricing - Add more keywords • Get paid via Stripe Connect • Read Seller Guidelines first - Turn on notifications in Settings
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-1" style={{ color: '#EFBF05' }}>STORIES MATTER</p>
                  <p className="text-white/90 leading-relaxed">
                    Take time to tell a story about what you're selling or buying
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-1" style={{ color: '#EFBF05' }}>YOUR CANVAS = Your hub</p>
                  <p className="text-white/90 leading-relaxed">
                    Your hub for favorites, orders, messages, and listings
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-1" style={{ color: '#EFBF05' }}>NEED HELP?</p>
                  <p className="text-white/90 leading-relaxed">
                    <a href="mailto:support@thriftshopper.com" className="underline hover:text-[#EFBF05]">support@thriftshopper.com</a> • <a href="/support" className="underline hover:text-[#EFBF05]">thriftshopper.com/support</a>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Shipping & Returns */}
        <div className="rounded-lg bg-white/5 border border-transparent hover:border-[#191970]/50 overflow-hidden">
          <button 
            className="w-full p-3 rounded-lg hover:bg-[#191970]/30 transition-colors text-left flex items-center justify-between"
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
                  <div className="pt-3 space-y-4 text-xs" style={{ fontFamily: "'Source Sans 3', 'Source Sans Pro', sans-serif" }}>
                    <div>
                      <h4 className="text-sm font-semibold mb-2" style={{ fontFamily: 'var(--font-playfair), serif', color: '#191970' }}>
                        How Shipping Works
                      </h4>
                      <ul className="list-disc list-inside text-white/90 leading-relaxed space-y-1 ml-2">
                        <li>Sellers set their own shipping timelines</li>
                        <li>You'll receive tracking info when your item ships</li>
                        <li>Most items ship within 3-5 business days</li>
                        <li>Shipping costs are shown at checkout</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold mb-2" style={{ fontFamily: 'var(--font-playfair), serif', color: '#191970' }}>
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
                      <h4 className="text-sm font-semibold mb-2" style={{ fontFamily: 'var(--font-playfair), serif', color: '#191970' }}>
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
                      <h4 className="text-sm font-semibold mb-2" style={{ fontFamily: 'var(--font-playfair), serif', color: '#191970' }}>
                        Full Policy Details
                      </h4>
                      <p className="text-white/90 leading-relaxed">
                        Read our complete <a href="/returns" className="underline hover:text-[#EFBF05]">Returns and Exchanges Policy</a>.
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold mb-2" style={{ fontFamily: 'var(--font-playfair), serif', color: '#191970' }}>
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
        <div className="rounded-lg bg-white/5 border border-transparent hover:border-[#191970]/50 overflow-hidden">
          <button 
            className="w-full p-3 rounded-lg hover:bg-[#191970]/30 transition-colors text-left flex items-center justify-between"
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
                  <div className="pt-3 space-y-4 text-xs" style={{ fontFamily: "'Source Sans 3', 'Source Sans Pro', sans-serif" }}>
                    <div>
                      <h4 className="text-sm font-semibold mb-2" style={{ fontFamily: 'var(--font-playfair), serif', color: '#191970' }}>
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
                      <h4 className="text-sm font-semibold mb-2" style={{ fontFamily: 'var(--font-playfair), serif', color: '#191970' }}>
                        Account Settings
                      </h4>
                      <ul className="list-disc list-inside text-white/90 leading-relaxed space-y-1 ml-2">
                        <li>Update your email and password in Settings</li>
                        <li>Manage notification preferences</li>
                        <li>Update shipping addresses</li>
                        <li>Connect your Stripe account (sellers)</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold mb-2" style={{ fontFamily: 'var(--font-playfair), serif', color: '#191970' }}>
                        Beta Access
                      </h4>
                      <p className="text-white/90 leading-relaxed">
                        During beta, you have early access to ThriftShopper. We'd love your feedback as we refine the platform.
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold mb-2" style={{ fontFamily: 'var(--font-playfair), serif', color: '#191970' }}>
                        Privacy & Security
                      </h4>
                      <p className="text-white/90 leading-relaxed">
                        Your data is protected. Review our <a href="/privacy" className="underline hover:text-[#EFBF05]">Privacy Policy</a> and <a href="/terms" className="underline hover:text-[#EFBF05]">Terms of Service</a>.
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold mb-2" style={{ fontFamily: 'var(--font-playfair), serif', color: '#191970' }}>
                        Need Help?
                      </h4>
                      <p className="text-white/90 leading-relaxed">
                        Email <a href="mailto:support@thriftshopper.com" className="underline hover:text-[#EFBF05]">support@thriftshopper.com</a>
                      </p>
                    </div>
                  </div>
                </div>
              )}
        </div>


        {/* Legal Links */}
        <div className="pt-3 border-t border-white/10">
          <div className="space-y-1.5">
            <a
              href="https://thriftshopper.com/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between text-xs text-white/60 hover:text-white transition-colors"
            >
              <span>Terms of Service</span>
              <ExternalLink className="h-3 w-3" />
            </a>
            <a
              href="https://thriftshopper.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between text-xs text-white/60 hover:text-white transition-colors"
            >
              <span>Privacy Policy</span>
              <ExternalLink className="h-3 w-3" />
            </a>
            <a
              href="/about"
              className="flex items-center justify-between text-xs text-white/60 hover:text-white transition-colors"
            >
              <span>About ThriftShopper</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </TSModal>
  );
}

