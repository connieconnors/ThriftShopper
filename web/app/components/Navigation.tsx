"use client";

import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

export default function Navigation() {
  const { user, signOut, isLoading } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setIsMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-lg border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/browse" className="text-xl font-bold tracking-tight text-white">
          RetroThrifter
        </Link>

        {/* Nav Links */}
        <div className="flex items-center gap-4">
          <Link
            href="/browse"
            className="text-sm text-white/70 hover:text-white transition-colors hidden sm:block"
          >
            Browse
          </Link>

          {!isLoading && (
            <>
              {user ? (
                <>
                  <Link
                    href="/favorites"
                    className="text-sm text-white/70 hover:text-white transition-colors flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span className="hidden sm:inline">Favorites</span>
                  </Link>

                  {/* User Menu */}
                  <div className="relative">
                    <button
                      onClick={() => setIsMenuOpen(!isMenuOpen)}
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-sm font-bold"
                    >
                      {user.email?.charAt(0).toUpperCase()}
                    </button>

                    {isMenuOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setIsMenuOpen(false)}
                        />
                        <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
                          <div className="px-4 py-3 border-b border-white/10">
                            <p className="text-xs text-white/50">Signed in as</p>
                            <p className="text-sm text-white truncate">{user.email}</p>
                          </div>
                          <div className="py-1">
                            <Link
                              href="/canvas"
                              onClick={() => setIsMenuOpen(false)}
                              className="block px-4 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white transition-colors"
                            >
                              My Account
                            </Link>
                            <Link
                              href="/favorites"
                              onClick={() => setIsMenuOpen(false)}
                              className="block px-4 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white transition-colors"
                            >
                              My Favorites
                            </Link>
                            <button
                              onClick={handleSignOut}
                              className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/5 transition-colors"
                            >
                              Sign Out
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-sm text-white/70 hover:text-white transition-colors"
                  >
                    Log In
                  </Link>
                  <Link
                    href="/signup"
                    className="px-4 py-2 bg-white text-black text-sm font-semibold rounded-full hover:bg-white/90 transition-colors"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

