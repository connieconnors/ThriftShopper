'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock } from 'lucide-react';
import { TSLogo } from './TSLogo';

interface SellerLoginProps {
  onLogin: (email: string) => void;
}

export function SellerLogin({ onLogin }: SellerLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      onLogin(email);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 overflow-y-auto" style={{ backgroundColor: '#f5f5f5' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-8 rounded-2xl bg-white shadow-xl"
      >
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ backgroundColor: '#191970' }}>
            <TSLogo size={48} primaryColor="#ffffff" accentColor="#efbf04" />
          </div>
        </div>

        <h1 className="text-center mb-2" style={{ color: '#000080' }}>
          Seller Portal
        </h1>
        <p className="text-center mb-8 text-gray-600">
          Start your selling journey
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-2 text-sm" style={{ color: '#191970' }}>
              Email
            </label>
            <div className="relative">
              <Mail size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-gray-200 focus:border-[#191970] outline-none transition-colors"
                placeholder="your@email.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block mb-2 text-sm" style={{ color: '#191970' }}>
              Password
            </label>
            <div className="relative">
              <Lock size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-gray-200 focus:border-[#191970] outline-none transition-colors"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <motion.button
            type="submit"
            whileTap={{ scale: 0.98 }}
            className="w-full py-3 rounded-lg text-white font-medium shadow-lg mt-6"
            style={{ backgroundColor: '#191970' }}
          >
            Sign In
          </motion.button>
        </form>

        <p className="text-center mt-6 text-sm text-gray-500">
          New seller?{' '}
          <button
            onClick={() => onLogin('demo@seller.com')}
            className="font-medium"
            style={{ color: '#cfb53b' }}
          >
            Create account
          </button>
        </p>
      </motion.div>
    </div>
  );
}

