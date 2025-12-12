"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "../context/AuthContext"
import { supabase } from "../../lib/supabaseClient"
import { TSLogo } from "@/components/TSLogo"
import { ArrowLeft, User, MapPin, CreditCard, Bell, Shield, Plus, Trash2, Edit, ExternalLink, LogOut, FileText, Scale } from "lucide-react"

export default function SettingsPage() {
  const router = useRouter()
  const { user, isLoading: authLoading, signOut } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [userType, setUserType] = useState<"buyer" | "seller">("buyer")
  const [addresses, setAddresses] = useState<any[]>([])
  const [selectedAddress, setSelectedAddress] = useState("")
  const [formData, setFormData] = useState({
    display_name: "",
    email: "",
    phone: "",
  })
  const [preferences, setPreferences] = useState({
    email_notifications: true,
    push_notifications: true,
    marketing_emails: false,
    sales_notifications: true,
    language: "en",
    currency: "usd",
  })

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
      // Load profile
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
          phone: profileData.phone_main || profileData.phone || "", // Support both phone_main (new) and phone (legacy)
        })
      } else {
        setFormData({
          display_name: "",
          email: user.email || "",
          phone: "",
        })
      }

      // TODO: Load addresses from a addresses table
      // For now, using mock data
      setAddresses([
        { id: 1, type: "Shipping", street: "123 Main St", city: "New York", state: "NY", zip: "10001", isDefault: true },
      ])
      setSelectedAddress("1")
    } catch (error) {
      console.error("Error loading settings:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!user) return

    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({
          user_id: user.id,
          display_name: formData.display_name,
          email: formData.email,
          phone_main: formData.phone || null, // Use phone_main (stores can have store phone and mobile)
        }, {
          onConflict: "user_id",
        })

      if (error) throw error
      alert("Profile updated successfully!")
    } catch (error) {
      console.error("Error saving profile:", error)
      alert("Failed to save profile")
    }
  }

  const handleLogout = async () => {
    await signOut()
    router.push("/browse")
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50" style={{ fontFamily: "Merriweather, serif" }}>
        <div className="animate-spin h-8 w-8 border-2 border-[#EFBF05] border-t-transparent rounded-full" />
      </div>
    )
  }

  const backUrl = userType === "seller" ? "/seller" : "/canvas"

  return (
    <div className="min-h-screen bg-gray-50 pb-16" style={{ fontFamily: "Merriweather, serif" }}>
      {/* Header */}
      <header className="bg-[#191970] px-4 py-2 flex items-center justify-between sticky top-0 z-10">
        <Link href={backUrl} className="flex items-center gap-3">
          <button className="text-white/80 hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" style={{ color: "#EFBF05" }} />
          </button>
          <TSLogo size={24} primaryColor="#ffffff" accentColor="#EFBF05" />
        </Link>
        <h1 className="text-base font-semibold text-white">Settings</h1>
        <div className="w-10"></div>
      </header>

      <div className="px-4 py-4 space-y-4 max-w-2xl mx-auto">
        {/* Profile Section */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-4 w-4" style={{ color: "#191970" }} />
            <h2 className="text-sm font-semibold" style={{ color: "#191970" }}>
              Profile Information
            </h2>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm"
              style={{ backgroundColor: "#EFBF05" }}
            >
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-bold text-white">
                  {formData.display_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "U"}
                </span>
              )}
            </div>
            <button className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              Change Photo
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
                className="w-full h-9 px-3 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#191970]/20"
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
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full h-9 px-3 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#191970]/20"
                placeholder="your@email.com"
              />
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
                className="w-full h-9 px-3 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#191970]/20"
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <button
              onClick={handleSaveProfile}
              className="w-full mt-2 py-2 text-xs font-medium rounded-lg transition-colors"
              style={{ backgroundColor: "#191970", color: "white" }}
            >
              Save Changes
            </button>
          </div>
        </div>

        {/* Addresses Section */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" style={{ color: "#191970" }} />
              <h2 className="text-sm font-semibold" style={{ color: "#191970" }}>
                Addresses
              </h2>
            </div>
            <button className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors flex items-center gap-1">
              <Plus className="h-3 w-3" />
              Add New
            </button>
          </div>

          {addresses.length > 0 ? (
            <div className="space-y-3">
              <div>
                <label htmlFor="addressSelect" className="text-xs text-gray-600 mb-1.5 block">
                  Select Address
                </label>
                <select
                  id="addressSelect"
                  value={selectedAddress}
                  onChange={(e) => setSelectedAddress(e.target.value)}
                  className="w-full h-9 px-3 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#191970]/20"
                >
                  {addresses.map((addr) => (
                    <option key={addr.id} value={addr.id.toString()}>
                      {addr.type} - {addr.street} {addr.isDefault && "(Default)"}
                    </option>
                  ))}
                </select>
              </div>

              {addresses
                .filter((addr) => addr.id.toString() === selectedAddress)
                .map((addr) => (
                  <div key={addr.id} className="space-y-3 border-t pt-3">
                    <div>
                      <label htmlFor="addressType" className="text-xs text-gray-600 mb-1.5 block">
                        Address Type
                      </label>
                      <input
                        id="addressType"
                        type="text"
                        defaultValue={addr.type}
                        className="w-full h-9 px-3 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#191970]/20"
                      />
                    </div>
                    <div>
                      <label htmlFor="street" className="text-xs text-gray-600 mb-1.5 block">
                        Street Address
                      </label>
                      <input
                        id="street"
                        type="text"
                        defaultValue={addr.street}
                        className="w-full h-9 px-3 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#191970]/20"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="city" className="text-xs text-gray-600 mb-1.5 block">
                          City
                        </label>
                        <input
                          id="city"
                          type="text"
                          defaultValue={addr.city}
                          className="w-full h-9 px-3 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#191970]/20"
                        />
                      </div>
                      <div>
                        <label htmlFor="state" className="text-xs text-gray-600 mb-1.5 block">
                          State
                        </label>
                        <input
                          id="state"
                          type="text"
                          defaultValue={addr.state}
                          className="w-full h-9 px-3 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#191970]/20"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="zip" className="text-xs text-gray-600 mb-1.5 block">
                        ZIP Code
                      </label>
                      <input
                        id="zip"
                        type="text"
                        defaultValue={addr.zip}
                        className="w-full h-9 px-3 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#191970]/20"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="flex-1 py-1.5 text-xs rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1">
                        <Edit className="h-3 w-3" />
                        Save Changes
                      </button>
                      <button className="px-3 py-1.5 text-xs rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors flex items-center gap-1">
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-xs text-gray-500 mb-3">No addresses saved yet</p>
              <button className="px-4 py-2 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors flex items-center gap-1 mx-auto">
                <Plus className="h-3 w-3" />
                Add Your First Address
              </button>
            </div>
          )}
        </div>

        {/* Payment Methods Section */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="h-4 w-4" style={{ color: "#191970" }} />
            <h2 className="text-sm font-semibold" style={{ color: "#191970" }}>
              Payment Methods
            </h2>
          </div>

          {userType === "buyer" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-14 bg-gradient-to-br from-blue-600 to-blue-800 rounded flex items-center justify-center text-white text-xs font-bold">
                    VISA
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-900">•••• •••• •••• 4242</p>
                    <p className="text-[10px] text-gray-500">Expires 12/25</p>
                  </div>
                </div>
                <button className="px-3 py-1 text-xs rounded-lg border border-gray-200 hover:bg-white transition-colors">
                  Edit
                </button>
              </div>
              <button className="w-full py-2 text-xs rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1">
                <Plus className="h-3 w-3" />
                Add Payment Method
              </button>
              <button className="w-full py-2 text-xs rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1 text-[#191970]">
                <ExternalLink className="h-3 w-3" />
                Manage via Stripe
              </button>
            </div>
          )}

          {userType === "seller" && (
            <div className="space-y-3">
              <div className="p-3 bg-[#EFBF05]/10 rounded-lg border border-[#EFBF05]/20">
                <p className="text-xs font-medium text-gray-900 mb-1.5">Stripe Account Connected</p>
                <p className="text-[10px] text-gray-600 mb-3">
                  Your payouts are processed through Stripe. Manage your payout settings and view transaction history.
                </p>
                <button className="w-full py-2 text-xs rounded-lg border border-[#EFBF05]/30 hover:bg-[#EFBF05]/20 transition-colors flex items-center justify-center gap-1" style={{ color: "#191970" }}>
                  <ExternalLink className="h-3 w-3" />
                  Open Stripe Dashboard
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Preferences Section */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="h-4 w-4" style={{ color: "#191970" }} />
            <h2 className="text-sm font-semibold" style={{ color: "#191970" }}>
              Preferences
            </h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-900">Email Notifications</p>
                <p className="text-[10px] text-gray-500">Receive updates about your orders and account</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.email_notifications}
                  onChange={(e) => setPreferences({ ...preferences, email_notifications: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#191970]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#191970]"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-900">Push Notifications</p>
                <p className="text-[10px] text-gray-500">Get notified about new messages and updates</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.push_notifications}
                  onChange={(e) => setPreferences({ ...preferences, push_notifications: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#191970]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#191970]"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-900">Marketing Emails</p>
                <p className="text-[10px] text-gray-500">Discover new treasures and special offers</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.marketing_emails}
                  onChange={(e) => setPreferences({ ...preferences, marketing_emails: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#191970]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#191970]"></div>
              </label>
            </div>
            {userType === "seller" && (
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-900">Sales Notifications</p>
                  <p className="text-[10px] text-gray-500">Get notified immediately when items sell</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.sales_notifications}
                    onChange={(e) => setPreferences({ ...preferences, sales_notifications: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#191970]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#191970]"></div>
                </label>
              </div>
            )}
            <div className="pt-3 border-t">
              <label htmlFor="language" className="text-xs text-gray-600 mb-2 block">
                Language
              </label>
              <select
                id="language"
                value={preferences.language}
                onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                className="w-full h-9 px-3 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#191970]/20"
              >
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
              </select>
            </div>
            <div>
              <label htmlFor="currency" className="text-xs text-gray-600 mb-2 block">
                Currency
              </label>
              <select
                id="currency"
                value={preferences.currency}
                onChange={(e) => setPreferences({ ...preferences, currency: e.target.value })}
                className="w-full h-9 px-3 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#191970]/20"
              >
                <option value="usd">USD ($)</option>
                <option value="eur">EUR (€)</option>
                <option value="gbp">GBP (£)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Security & Privacy Section */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-4 w-4" style={{ color: "#191970" }} />
            <h2 className="text-sm font-semibold" style={{ color: "#191970" }}>
              Security & Privacy
            </h2>
          </div>

          <div className="space-y-2">
            <button className="w-full justify-start py-2.5 text-xs rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-left px-3">
              Change Password
            </button>
            <button className="w-full justify-start py-2.5 text-xs rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-left px-3">
              Two-Factor Authentication
            </button>
            <button className="w-full justify-start py-2.5 text-xs rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-left px-3">
              Privacy Settings
            </button>
            <button className="w-full justify-start py-2.5 text-xs rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-left px-3">
              Download My Data
            </button>
          </div>
        </div>

        {/* Legal Section */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Scale className="h-4 w-4" style={{ color: "#191970" }} />
            <h2 className="text-sm font-semibold" style={{ color: "#191970" }}>
              Legal
            </h2>
          </div>
          <div className="space-y-3">
            <a
              href="https://thriftshopper.com/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between w-full py-2.5 text-xs rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors px-3 text-gray-700"
            >
              <span>Terms of Service</span>
              <ExternalLink className="h-3 w-3 text-gray-400" />
            </a>
            <a
              href="https://thriftshopper.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between w-full py-2.5 text-xs rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors px-3 text-gray-700"
            >
              <span>Privacy Policy</span>
              <ExternalLink className="h-3 w-3 text-gray-400" />
            </a>
            <a
              href="https://thriftshopper.com/allowed-items"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between w-full py-2.5 text-xs rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors px-3 text-gray-700"
            >
              <span>Allowed & Prohibited Items</span>
              <ExternalLink className="h-3 w-3 text-gray-400" />
            </a>
          </div>
        </div>

        {/* Account Actions */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="space-y-2">
            <button
              onClick={handleLogout}
              className="w-full py-2.5 text-xs rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Log Out
            </button>
            <button className="w-full py-2.5 text-xs rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors">
              Delete Account
            </button>
          </div>
        </div>

        <div className="text-center text-[10px] text-gray-500 py-4">
          ThriftShopper v1.0.0 • Terms of Service • Privacy Policy
        </div>
      </div>
    </div>
  )
}

