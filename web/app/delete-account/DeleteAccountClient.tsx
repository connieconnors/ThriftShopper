"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Mail, Trash2 } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { TSLogo } from "@/components/TSLogo";
import TSModal from "@/components/TSModal";

const DELETED_DATA = [
  "Your profile, display name, and account email",
  "Favorites and saved preferences",
  "Messages sent through ThriftShopper",
  "Listings without completed order history (listings tied to past orders may be hidden rather than deleted)",
] as const;

export default function DeleteAccountClient() {
  const router = useRouter();
  const { user, isLoading: authLoading, signOut } = useAuth();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDeleteAccount = async () => {
    if (!user || isDeleting) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setDeleteError("Your session expired. Please sign in again and retry.");
        return;
      }

      const response = await fetch("/api/account/delete", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setDeleteError(
          typeof payload.error === "string"
            ? payload.error
            : "We couldn't delete your account. Please try again."
        );
        return;
      }

      setDeleteModalOpen(false);
      await signOut();
      router.push("/browse");
    } catch (error) {
      console.error("Error deleting account:", error);
      setDeleteError("Something went wrong. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col" style={{ backgroundColor: "#f8f9fa" }}>
      <header
        className="px-4 py-3 flex items-center justify-center border-b border-white/10"
        style={{ backgroundColor: "#16193a" }}
      >
        <Link href="/browse" className="flex items-center gap-2" aria-label="ThriftShopper home">
          <TSLogo size={28} primaryColor="#ffffff" accentColor="#efbf04" />
          <span className="text-white font-semibold text-sm">ThriftShopper</span>
        </Link>
      </header>

      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
          <h1 className="text-2xl font-bold mb-4 font-editorial" style={{ color: "#16193a" }}>
            Delete Your Account
          </h1>

          <p className="text-gray-700 leading-relaxed mb-6">
            You can permanently delete your ThriftShopper account and associated personal data at any
            time. This page explains what is removed and how to complete deletion.
          </p>

          <section className="mb-8">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-2">
              How to delete your account
            </h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 text-sm pl-1">
              <li>Sign in to your ThriftShopper account.</li>
              <li>
                Open this page at{" "}
                <span className="font-medium">app.thriftshopper.com/delete-account</span>, or go to{" "}
                <Link href="/settings" className="text-[#16193a] underline hover:opacity-80">
                  Account Settings
                </Link>{" "}
                and choose Delete Account.
              </li>
              <li>Confirm permanent deletion when prompted.</li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-2">
              What we delete
            </h2>
            <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm pl-1">
              {DELETED_DATA.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="text-sm text-gray-500 mt-3">
              Some records may be retained where required for legal, tax, fraud-prevention, or
              dispute-resolution purposes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-2">
              Need help?
            </h2>
            <p className="text-gray-700 text-sm mb-2">
              If you cannot sign in or need assistance, email us and we will process your deletion
              request.
            </p>
            <a
              href="mailto:support@thriftshopper.com?subject=Account%20deletion%20request"
              className="inline-flex items-center gap-2 text-gray-800 hover:text-[#16193a] transition-colors font-medium text-sm"
            >
              <Mail className="h-4 w-4 shrink-0" style={{ color: "#EFBF05" }} />
              support@thriftshopper.com
            </a>
          </section>

          <section className="pt-6 border-t border-gray-200">
            {authLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : user ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-700">
                  Signed in as <span className="font-medium">{user.email}</span>
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setDeleteError(null);
                    setDeleteModalOpen(true);
                  }}
                  className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 text-sm font-semibold rounded-lg transition-colors"
                  style={{ backgroundColor: "#dc2626", color: "#ffffff" }}
                >
                  <Trash2 className="h-4 w-4" />
                  Permanently delete my account
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-700">
                  Sign in to delete your account from this page.
                </p>
                <Link
                  href="/login?redirect=/delete-account"
                  className="inline-flex items-center justify-center w-full py-3 px-4 text-sm font-semibold rounded-lg transition-colors"
                  style={{ backgroundColor: "#16193a", color: "#ffffff" }}
                >
                  Sign in to delete account
                </Link>
              </div>
            )}
          </section>

          <section className="pt-8 mt-8 border-t border-gray-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:gap-6 gap-2 text-sm">
              <Link
                href="/privacy"
                className="text-[#16193a] underline hover:opacity-80 transition-opacity"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-[#16193a] underline hover:opacity-80 transition-opacity"
              >
                Terms of Use
              </Link>
              <Link
                href="/support"
                className="text-[#16193a] underline hover:opacity-80 transition-opacity"
              >
                Support
              </Link>
            </div>
          </section>
        </div>
      </div>

      <TSModal
        isOpen={deleteModalOpen}
        onClose={() => {
          if (isDeleting) return;
          setDeleteModalOpen(false);
          setDeleteError(null);
        }}
        disableBackdropClose={isDeleting}
        title="Delete account?"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700 leading-relaxed">
            This permanently deletes your account and associated data. This action cannot be undone.
          </p>
          {deleteError && (
            <p className="text-sm text-red-600" role="alert">
              {deleteError}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                if (isDeleting) return;
                setDeleteModalOpen(false);
                setDeleteError(null);
              }}
              disabled={isDeleting}
              className="px-4 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="px-4 py-2 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              style={{ backgroundColor: "#dc2626", color: "#ffffff" }}
            >
              {isDeleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {isDeleting ? "Deleting…" : "Delete account"}
            </button>
          </div>
        </div>
      </TSModal>
    </main>
  );
}
