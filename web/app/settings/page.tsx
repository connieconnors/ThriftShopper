"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "../context/AuthContext"
import { supabase } from "../../lib/supabaseClient"
import { TSLogo } from "@/components/TSLogo"
import TSModal from "@/components/TSModal"
import SupportModal from "@/components/SupportModal"
import { SETTINGS_LEGAL_LINKS, legalHref } from "@/lib/legalNavigation"
import { ArrowLeft, User, ExternalLink, LogOut, Scale, Loader2, HelpCircle, Store } from "lucide-react"

export default function SettingsPage() {
  const router = useRouter()
  const { user, isLoading: authLoading, signOut } = useAuth()
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [userType, setUserType] = useState<"buyer" | "seller">("buyer")
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    display_name: "",
    email: "",
    phone: "",
    seller_description: "",
    seller_story: "",
  })
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [supportOpen, setSupportOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/settings")
      return
    }
    if (user) {
      loadData()
    }
  }, [user, authLoading, router])

  const loadData = async () => {
    if (!user) return

    try {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle()

      if (profileData) {
        setProfile(profileData)
        setUserType(profileData.is_seller ? "seller" : "buyer")
        setFormData({
          display_name: profileData.display_name || "",
          email: profileData.email || user.email || "",
          phone: profileData.phone_main || profileData.phone || "",
          seller_description: profileData.seller_description || "",
          seller_story: profileData.seller_story || "",
        })
      } else {
        setFormData({
          display_name: "",
          email: user.email || "",
          phone: "",
          seller_description: "",
          seller_story: "",
        })
      }
    } catch (error) {
      console.error("Error loading settings:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be less than 5MB")
      return
    }

    setAvatarFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile || !user) return null

    setIsUploadingAvatar(true)
    try {
      const fileExt = avatarFile.name.split(".").pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, avatarFile, {
          cacheControl: "3600",
          upsert: false,
        })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath)

      return publicUrl
    } catch (err) {
      console.error("Error uploading avatar:", err)
      alert("Failed to upload profile photo")
      return null
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!user) return

    setIsSaving(true)
    try {
      let avatarUrl: string | null = null
      if (avatarFile) {
        avatarUrl = await uploadAvatar()
        if (!avatarUrl) {
          setIsSaving(false)
          return
        }
      }

      const updateData: Record<string, string | null> = {
        user_id: user.id,
        display_name: formData.display_name,
        phone_main: formData.phone || null,
        seller_description: formData.seller_description || null,
        seller_story: formData.seller_story || null,
      }

      if (avatarUrl) {
        updateData.avatar_url = avatarUrl
      }

      const { error } = await supabase
        .from("profiles")
        .upsert(updateData, {
          onConflict: "user_id",
        })

      if (error) throw error

      if (avatarUrl) {
        setProfile((prev: any) => (prev ? { ...prev, avatar_url: avatarUrl } : prev))
        setAvatarFile(null)
        setAvatarPreview(null)
      }

      alert("Profile updated successfully!")
    } catch (error) {
      console.error("Error saving profile:", error)
      alert("Failed to save profile")
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogout = async () => {
    await signOut()
    router.push("/browse")
  }

  const handleDeleteAccount = async () => {
    if (!user || isDeleting) return

    setIsDeleting(true)
    setDeleteError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        setDeleteError("Your session expired. Please sign in again and retry.")
        return
      }

      const response = await fetch("/api/account/delete", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        setDeleteError(
          typeof payload.error === "string"
            ? payload.error
            : "We couldn't delete your account. Please try again."
        )
        return
      }

      setDeleteModalOpen(false)
      await signOut()
      router.push("/browse")
    } catch (error) {
      console.error("Error deleting account:", error)
      setDeleteError("Something went wrong. Please try again.")
    } finally {
      setIsDeleting(false)
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-8 w-8 border-2 border-[#EFBF05] border-t-transparent rounded-full" />
      </div>
    )
  }

  const backUrl = userType === "seller" ? "/seller" : "/canvas"
  const dashboardLabel =
    userType === "seller" ? "Return to Seller Dashboard" : "Return to Your Dashboard"
  const avatarSrc = avatarPreview || profile?.avatar_url

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-[#16193a] px-4 py-2 flex items-center justify-between sticky top-0 z-10">
        <Link href={backUrl} className="flex items-center gap-3">
          <span className="text-white/80 hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" style={{ color: "#EFBF05" }} />
          </span>
          <TSLogo size={24} primaryColor="#ffffff" accentColor="#EFBF05" />
        </Link>
        <h1 className="text-base font-semibold text-white">Settings</h1>
        <div className="w-10"></div>
      </header>

      <div className="px-4 py-4 space-y-4 max-w-2xl mx-auto">
        {/* Profile Section */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-4 w-4" style={{ color: "#16193a" }} />
            <h2 className="text-sm font-semibold" style={{ color: "#16193a" }}>
              Profile Information
            </h2>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm"
              style={{ backgroundColor: "#EFBF05" }}
            >
              {avatarSrc ? (
                <img src={avatarSrc} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-bold text-white">
                  {formData.display_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "U"}
                </span>
              )}
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={isUploadingAvatar || isSaving}
              className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {isUploadingAvatar ? "Uploading…" : "Change Photo"}
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label htmlFor="fullName" className="text-xs text-gray-600 mb-1.5 block">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                className="w-full h-9 px-3 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#16193a]/20"
                placeholder="Your name"
              />
            </div>
            <div>
              <label htmlFor="email" className="text-xs text-gray-600 mb-1.5 block">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                readOnly
                className="w-full h-9 px-3 text-sm rounded-lg border border-gray-200 bg-gray-100 text-gray-600 cursor-not-allowed"
              />
              <p className="text-[10px] text-gray-500 mt-1">
                Login email is managed through account security below.
              </p>
            </div>
            <div>
              <label htmlFor="phone" className="text-xs text-gray-600 mb-1.5 block">
                Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full h-9 px-3 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#16193a]/20"
                placeholder="+1 (555) 123-4567"
              />
            </div>
            {userType === "seller" && (
              <>
                <div>
                  <label htmlFor="description" className="text-xs text-gray-600 mb-1.5 block">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={formData.seller_description}
                    onChange={(e) => setFormData({ ...formData, seller_description: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#16193a]/20 min-h-[80px] resize-none"
                    placeholder="Tell buyers about you and what makes your shop special..."
                  />
                </div>
                <div>
                  <label htmlFor="story" className="text-xs text-gray-600 mb-1.5 block">
                    Your Story <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    id="story"
                    value={formData.seller_story}
                    onChange={(e) => {
                      const value = e.target.value
                      if (value.length <= 500) {
                        setFormData({ ...formData, seller_story: value })
                      }
                    }}
                    maxLength={500}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#16193a]/20 min-h-[80px] resize-none"
                    placeholder="Tell buyers about your shop, what you sell, or what makes your items special..."
                  />
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-[10px] text-gray-500">
                      Tell buyers about your shop, what you sell, or what makes your items special (optional)
                    </p>
                    <p className={`text-[10px] ${(formData.seller_story?.length || 0) >= 500 ? "text-red-500" : "text-gray-400"}`}>
                      {formData.seller_story?.length || 0}/500
                    </p>
                  </div>
                </div>
              </>
            )}
            <button
              type="button"
              onClick={handleSaveProfile}
              disabled={isSaving || isUploadingAvatar}
              className="w-full mt-2 py-2 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ backgroundColor: "#16193a", color: "white" }}
            >
              {(isSaving || isUploadingAvatar) && <Loader2 className="h-3 w-3 animate-spin" />}
              Save Changes
            </button>
          </div>
        </div>

        {/* Security */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <h2 className="text-sm font-semibold mb-3" style={{ color: "#16193a" }}>
            Security
          </h2>
          <Link
            href="/forgot-password"
            className="flex items-center justify-between w-full py-2.5 text-xs rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors px-3 text-gray-700"
          >
            <span>Change Password</span>
            <ExternalLink className="h-3 w-3 text-gray-400" />
          </Link>
        </div>

        {userType === "seller" && (
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Store className="h-4 w-4" style={{ color: "#16193a" }} />
              <h2 className="text-sm font-semibold" style={{ color: "#16193a" }}>
                Seller
              </h2>
            </div>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              Store details, location, and default shipping for your listings.
            </p>
            <Link
              href="/seller/settings"
              className="flex items-center justify-between w-full py-2.5 text-xs rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors px-3 text-gray-700"
            >
              <span>Store & Shipping Settings</span>
              <ExternalLink className="h-3 w-3 text-gray-400" />
            </Link>
          </div>
        )}

        {/* Legal Section */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Scale className="h-4 w-4" style={{ color: "#16193a" }} />
            <h2 className="text-sm font-semibold" style={{ color: "#16193a" }}>
              Legal
            </h2>
          </div>
          <p className="text-xs text-gray-500 mb-4 leading-relaxed">
            Policies that help keep ThriftShopper safe, fair, and trustworthy.
          </p>
          <div className="space-y-3">
            {SETTINGS_LEGAL_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={legalHref(href, "settings")}
                className="flex items-center justify-between w-full py-2.5 text-xs rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors px-3 text-gray-700"
              >
                <span>{label}</span>
                <ExternalLink className="h-3 w-3 text-gray-400" />
              </Link>
            ))}
          </div>
        </div>

        {/* Help */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <button
            type="button"
            onClick={() => setSupportOpen(true)}
            className="flex items-center justify-between w-full py-2.5 text-xs rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors px-3 text-gray-700"
          >
            <span className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4" style={{ color: "#16193a" }} />
              Need help? Open Support
            </span>
            <ExternalLink className="h-3 w-3 text-gray-400" />
          </button>
        </div>

        {/* Account Actions */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm space-y-2">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full py-2.5 text-xs rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Log Out
          </button>
          <button
            type="button"
            onClick={() => {
              setDeleteError(null)
              setDeleteModalOpen(true)
            }}
            className="w-full py-2.5 text-xs rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
          >
            Delete Account
          </button>
        </div>

        <div className="text-center text-[10px] text-gray-500 py-4">
          ThriftShopper v1.0.0
        </div>
      </div>

      <nav
        className="fixed bottom-0 left-0 right-0 border-t border-white/10 px-4 py-3 z-30"
        style={{ backgroundColor: "#16193a" }}
        aria-label="Settings navigation"
      >
        <div className="max-w-2xl mx-auto">
          <Link
            href={backUrl}
            className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-medium text-white/90 hover:text-white transition-colors rounded-lg hover:bg-white/5"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" style={{ color: "#EFBF05" }} />
            {dashboardLabel}
          </Link>
        </div>
      </nav>

      <TSModal
        isOpen={deleteModalOpen}
        onClose={() => {
          if (isDeleting) return
          setDeleteModalOpen(false)
          setDeleteError(null)
        }}
        disableBackdropClose={isDeleting}
        title="Delete account?"
      >
        <div className="space-y-4">
          <p className="text-sm text-white/90 leading-relaxed">
            This permanently deletes your ThriftShopper account, profile, saved favorites, listings, and messages.
            It cannot be undone.
          </p>
          {userType === "seller" && (
            <p className="text-xs text-white/70 leading-relaxed">
              If you have open orders to ship, you&apos;ll need to fulfill them before deleting your account.
            </p>
          )}
          {deleteError && (
            <p className="text-xs text-red-300 leading-relaxed">{deleteError}</p>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                if (isDeleting) return
                setDeleteModalOpen(false)
                setDeleteError(null)
              }}
              disabled={isDeleting}
              className="px-4 py-2 text-sm font-medium text-white/80 hover:text-white transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="px-4 py-2 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              style={{
                backgroundColor: "#dc2626",
                color: "#ffffff",
              }}
            >
              {isDeleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {isDeleting ? "Deleting…" : "Delete account"}
            </button>
          </div>
        </div>
      </TSModal>

      <SupportModal isOpen={supportOpen} onClose={() => setSupportOpen(false)} />
    </div>
  )
}
