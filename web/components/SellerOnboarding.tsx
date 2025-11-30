'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { MapPin, Mail, Phone, Package, Store } from 'lucide-react';
import { TSLogo } from './TSLogo';

interface SellerOnboardingProps {
  onComplete: (data: SellerProfile) => void;
}

export interface SellerProfile {
  storeName: string;
  description: string;
  city: string;
  state: string;
  zipCode: string;
  email: string;
  phone: string;
  shippingSpeed: string;
}

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

const SHIPPING_OPTIONS = [
  'Ships within 1-2 days',
  'Ships within 3-5 days',
  'Ships within 5-7 days',
  'Local pickup only',
  'Local pickup + Shipping available'
];

export function SellerOnboarding({ onComplete }: SellerOnboardingProps) {
  const [formData, setFormData] = useState<SellerProfile>({
    storeName: '',
    description: '',
    city: '',
    state: '',
    zipCode: '',
    email: '',
    phone: '',
    shippingSpeed: SHIPPING_OPTIONS[0],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete(formData);
  };

  const updateField = (field: keyof SellerProfile, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen py-12 px-6 overflow-y-auto" style={{ backgroundColor: '#f5f5f5' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        <div className="text-center mb-8">
          <div className="inline-flex w-20 h-20 rounded-full items-center justify-center mb-4" style={{ backgroundColor: '#191970' }}>
            <TSLogo size={48} primaryColor="#ffffff" accentColor="#efbf04" />
          </div>
          <h1 className="mb-2" style={{ color: '#000080', fontFamily: 'Merriweather, serif' }}>
            Set Up Your Shop
          </h1>
          <p className="text-gray-600">
            Let's get you started selling on ThriftShopper
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          <div>
            <label className="block mb-2" style={{ color: '#191970' }}>
              Store Name
            </label>
            <div className="relative">
              <Store size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={formData.storeName}
                onChange={(e) => updateField('storeName', e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-gray-200 focus:border-[#191970] outline-none transition-colors"
                placeholder="Your Store or Your Name"
                required
              />
            </div>
          </div>

          <div>
            <label className="block mb-2" style={{ color: '#191970' }}>
              Seller Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-[#191970] outline-none transition-colors min-h-[100px] resize-none"
              placeholder="Tell buyers about you and what makes your shop special..."
            />
          </div>

          <div>
            <label className="block mb-2" style={{ color: '#191970' }}>
              Location
            </label>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="relative">
                <MapPin size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => updateField('city', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-gray-200 focus:border-[#191970] outline-none transition-colors"
                  placeholder="City"
                  required
                />
              </div>
              <select
                value={formData.state}
                onChange={(e) => updateField('state', e.target.value)}
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-[#191970] outline-none transition-colors"
                required
              >
                <option value="">State</option>
                {US_STATES.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
            <input
              type="text"
              value={formData.zipCode}
              onChange={(e) => updateField('zipCode', e.target.value)}
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-[#191970] outline-none transition-colors"
              placeholder="ZIP Code"
              pattern="[0-9]{5}"
              required
            />
          </div>

          <div>
            <label className="block mb-2" style={{ color: '#191970' }}>
              Contact Information
            </label>
            <div className="space-y-3">
              <div className="relative">
                <Mail size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-gray-200 focus:border-[#191970] outline-none transition-colors"
                  placeholder="Email"
                  required
                />
              </div>
              <div className="relative">
                <Phone size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-gray-200 focus:border-[#191970] outline-none transition-colors"
                  placeholder="Phone (optional)"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block mb-2" style={{ color: '#191970' }}>
              Shipping Details
            </label>
            <div className="relative">
              <Package size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                value={formData.shippingSpeed}
                onChange={(e) => updateField('shippingSpeed', e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-gray-200 focus:border-[#191970] outline-none transition-colors appearance-none"
                required
              >
                {SHIPPING_OPTIONS.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>

          <motion.button
            type="submit"
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 rounded-lg text-white font-medium shadow-lg mt-8"
            style={{ backgroundColor: '#191970' }}
          >
            Begin Selling
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}

