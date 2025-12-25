"use client";

import React from "react";
import TSModal from "./TSModal";
import { TSLogo } from "./TSLogo";
import { HelpCircle, Mail, MessageSquare, ExternalLink } from "lucide-react";

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SupportModal({ isOpen, onClose }: SupportModalProps) {
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
      <div className="space-y-4">
        {/* Help Topics */}
        <div>
          <h3 className="text-xs font-semibold text-white/90 mb-2">Help Topics</h3>
          <div className="space-y-2">
            <button 
              className="w-full p-3 rounded-lg bg-white/5 hover:bg-[#191970]/30 transition-colors text-left border border-transparent hover:border-[#191970]/50"
              onClick={() => {
                // TODO: Wire up help topic navigation
                console.log("How to Buy clicked");
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <HelpCircle className="h-4 w-4" style={{ color: "#EFBF05" }} />
                <p className="text-sm text-white">How to Buy</p>
              </div>
              <p className="text-xs text-white/60">Learn about purchasing items</p>
            </button>
            <button 
              className="w-full p-3 rounded-lg bg-white/5 hover:bg-[#191970]/30 transition-colors text-left border border-transparent hover:border-[#191970]/50"
              onClick={() => {
                // TODO: Wire up help topic navigation
                console.log("How to Sell clicked");
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <HelpCircle className="h-4 w-4" style={{ color: "#EFBF05" }} />
                <p className="text-sm text-white">How to Sell</p>
              </div>
              <p className="text-xs text-white/60">Start selling on ThriftShopper</p>
            </button>
            <button 
              className="w-full p-3 rounded-lg bg-white/5 hover:bg-[#191970]/30 transition-colors text-left border border-transparent hover:border-[#191970]/50"
              onClick={() => {
                // TODO: Wire up help topic navigation
                console.log("Shipping & Returns clicked");
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <HelpCircle className="h-4 w-4" style={{ color: "#EFBF05" }} />
                <p className="text-sm text-white">Shipping & Returns</p>
              </div>
              <p className="text-xs text-white/60">Policies and information</p>
            </button>
            <button 
              className="w-full p-3 rounded-lg bg-white/5 hover:bg-[#191970]/30 transition-colors text-left border border-transparent hover:border-[#191970]/50"
              onClick={() => {
                // TODO: Wire up help topic navigation
                console.log("Account & Settings clicked");
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <HelpCircle className="h-4 w-4" style={{ color: "#EFBF05" }} />
                <p className="text-sm text-white">Account & Settings</p>
              </div>
              <p className="text-xs text-white/60">Manage your account</p>
            </button>
          </div>
        </div>

        {/* Contact Options */}
        <div className="pt-3 border-t border-white/10">
          <h3 className="text-xs font-semibold text-white/90 mb-2">Contact Us</h3>
          <div className="space-y-2">
            <a
              href="mailto:support@thriftshopper.com"
              className="flex items-center gap-2 p-3 rounded-lg bg-white/5 hover:bg-[#191970]/30 transition-colors border border-transparent hover:border-[#191970]/50"
            >
              <Mail className="h-4 w-4" style={{ color: "#EFBF05" }} />
              <span className="text-sm text-white">Email Support</span>
            </a>
            <button 
              className="w-full flex items-center gap-2 p-3 rounded-lg bg-white/5 hover:bg-[#191970]/30 transition-colors text-left border border-transparent hover:border-[#191970]/50"
              disabled
            >
              <MessageSquare className="h-4 w-4" style={{ color: "#EFBF05" }} />
              <span className="text-sm text-white">Live Chat</span>
              <span className="ml-auto text-[10px] text-white/50">Coming soon</span>
            </button>
          </div>
        </div>

        {/* Legal Links */}
        <div className="pt-3 border-t border-white/10">
          <div className="space-y-1.5">
            <a
              href="/terms"
              className="flex items-center justify-between text-xs text-white/60 hover:text-white transition-colors"
            >
              <span>Terms of Service</span>
              <ExternalLink className="h-3 w-3" />
            </a>
            <a
              href="/privacy"
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

