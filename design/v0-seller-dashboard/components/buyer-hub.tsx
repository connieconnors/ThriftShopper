"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  MessageSquare,
  HeadphonesIcon,
  Mic,
  Award,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  ImagePlus,
  Settings,
} from "lucide-react"

export default function BuyerHub() {
  const [vibes, setVibes] = useState(["vintage", "rustic", "quirky"])
  const [showFavorites, setShowFavorites] = useState(false)
  const [showPurchases, setShowPurchases] = useState(false)
  const [showBadges, setShowBadges] = useState(false)

  const purchases = [
    { id: 1, title: "Iron Fence Finials", image: "/images/img-7658.jpeg" },
    { id: 2, title: "Vintage Mirror", image: "/vintage-brass-candlesticks.jpg" },
    { id: 3, title: "Brass Candlesticks", image: "/vintage-brass-candlesticks.jpg" },
  ]

  const savedItems = [
    { id: 1, title: "Brass Candlesticks", image: "/vintage-brass-candlesticks.jpg" },
    { id: 2, title: "Wooden Box", image: "/antique-wooden-box.jpg" },
    { id: 3, title: "Crystal Vase", image: "/vintage-brass-candlesticks.jpg" },
  ]

  return (
    <div className="min-h-screen bg-white pb-16">
      {/* Header */}
      <header className="bg-primary px-4 py-2 flex items-center justify-between">
        <div className="flex flex-col items-center gap-0">
          <div className="flex items-center -tracking-wider">
            <span className="text-[21px] font-semibold text-white font-[family-name:var(--font-merriweather)]">T</span>
            <span className="text-[21px] font-semibold text-white font-[family-name:var(--font-merriweather)] -ml-1">
              S
            </span>
          </div>
          <svg className="h-2.5 w-3 -mt-1" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" className="text-secondary" />
          </svg>
        </div>
        <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 text-[10px] gap-1 h-8 px-2.5">
          <ArrowLeft className="h-3.5 w-3.5 text-secondary" />
          Back to Discovery
        </Button>
      </header>

      {/* Profile Section */}
      <div className="bg-white px-4 py-2.5">
        <div className="flex items-center gap-2.5 mb-2">
          <Avatar className="h-10 w-10">
            <AvatarImage src="/diverse-user-avatars.png" alt="Profile" />
            <AvatarFallback className="bg-muted text-muted-foreground text-xs">ME</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="text-base font-semibold text-foreground font-[family-name:var(--font-merriweather)]">
              My Canvas
            </h1>
            <p className="text-xs text-muted-foreground">Treasure hunter since 2024</p>
          </div>
        </div>

        {/* Voice Input */}
        <div className="relative mb-1.5">
          <input
            type="text"
            placeholder="Tell us what you're hunting for..."
            className="w-full bg-muted/50 rounded-full px-3.5 py-2.5 pr-12 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 border border-border/50"
          />
          <Button
            size="icon"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-primary hover:bg-primary/90"
          >
            <Mic className="h-3.5 w-3.5 text-white" />
          </Button>
        </div>

        {/* Vibe Tags */}
        {vibes.length > 0 && (
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-xs text-muted-foreground">Your vibe:</span>
            {vibes.map((vibe) => (
              <Badge
                key={vibe}
                variant="secondary"
                className="bg-secondary/10 text-secondary-foreground text-xs px-2 py-0.5"
              >
                {vibe}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Playground Section */}
      <div className="bg-muted/30 px-4 py-3">
        <div className="text-center mb-2.5">
          <h2 className="text-xs font-semibold text-muted-foreground tracking-wider">Playground</h2>
        </div>

        <div className="space-y-2 max-w-md mx-auto">
          <Card className="p-1 bg-white border-border relative">
            <h3 className="text-xs font-semibold text-foreground mb-0 font-[family-name:var(--font-merriweather)]">
              Discovery
            </h3>
            <p className="text-[10px] text-muted-foreground leading-tight mb-0.5">
              Create boards with photos, notes, and inspiration
            </p>
            <div className="flex gap-1.5">
              <Button variant="outline" size="sm" disabled className="flex-1 h-5 text-[10px] gap-1.5 bg-transparent">
                <ImagePlus className="h-2.5 w-2.5" />
                Add Image
              </Button>
              <Button variant="outline" size="sm" disabled className="flex-1 h-5 text-[10px] gap-1.5 bg-transparent">
                <Mic className="h-2.5 w-2.5" />
                Voice Note
              </Button>
            </div>
          </Card>

          <Card className="p-1 bg-white border-border relative">
            <h3 className="text-xs font-semibold text-foreground mb-0 font-[family-name:var(--font-merriweather)]">
              Stories
            </h3>
            <p className="text-[10px] text-muted-foreground leading-tight mb-0.5">
              Share the story behind your treasures
            </p>
            <div className="flex gap-1.5">
              <input
                type="text"
                placeholder="Tell your story..."
                disabled
                className="flex-1 bg-muted/30 rounded px-2 py-0.5 text-[10px] placeholder:text-muted-foreground/50 h-5"
              />
              <Button size="icon" variant="outline" disabled className="h-5 w-5 shrink-0 bg-transparent">
                <Mic className="h-2.5 w-2.5" />
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Favorites, Purchases, and Badges Section */}
      <div className="px-4 py-3 space-y-2">
        {/* Favorites */}
        <div>
          <button
            onClick={() => setShowFavorites(!showFavorites)}
            className="flex items-center justify-between w-full mb-2"
          >
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-semibold text-foreground font-[family-name:var(--font-merriweather)]">
                Favorites
              </h2>
              <span className="text-xs text-muted-foreground">{savedItems.length}</span>
            </div>
            {showFavorites ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          {showFavorites && (
            <div className="flex flex-wrap gap-2">
              {savedItems.map((item) => (
                <div
                  key={item.id}
                  className="px-3 py-1.5 rounded-full border border-border bg-white flex items-center gap-1.5"
                >
                  <span className="text-[10px] text-foreground">{item.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Purchases */}
        <div>
          <button
            onClick={() => setShowPurchases(!showPurchases)}
            className="flex items-center justify-between w-full mb-2"
          >
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-semibold text-foreground font-[family-name:var(--font-merriweather)]">
                Purchases
              </h2>
              <span className="text-xs text-muted-foreground">{purchases.length}</span>
            </div>
            {showPurchases ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          {showPurchases && (
            <div className="flex flex-wrap gap-2">
              {purchases.map((item) => (
                <div
                  key={item.id}
                  className="px-3 py-1.5 rounded-full border border-border bg-white flex items-center gap-1.5"
                >
                  <span className="text-[10px] text-foreground">{item.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Badges */}
        <div>
          <button onClick={() => setShowBadges(!showBadges)} className="flex items-center justify-between w-full mb-2">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-semibold text-foreground font-[family-name:var(--font-merriweather)]">
                Badges
              </h2>
              <span className="text-xs text-muted-foreground">Earn as you hunt</span>
            </div>
            {showBadges ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          {showBadges && (
            <div className="flex flex-wrap gap-2">
              {[
                { name: "Rare Find", icon: Award },
                { name: "Collector", icon: Award },
                { name: "Early Bird", icon: Award },
              ].map((badge) => (
                <div
                  key={badge.name}
                  className="px-3 py-1.5 rounded-full border border-border bg-white flex items-center gap-1.5 opacity-30"
                >
                  <badge.icon className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[10px] text-foreground">{badge.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-primary border-t border-primary-foreground/10 px-4 py-2.5">
        <div className="max-w-2xl mx-auto flex items-center relative">
          <div className="flex gap-8 ml-6">
            <Button
              variant="ghost"
              size="sm"
              className="flex-col h-auto py-1.5 gap-0.5 text-white/70 hover:bg-white/10 hover:text-white"
            >
              <MessageSquare className="h-4 w-4" />
              <span className="text-[10px]">Messages</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex-col h-auto py-1.5 gap-0.5 text-white/70 hover:bg-white/10 hover:text-white"
            >
              <HeadphonesIcon className="h-4 w-4" />
              <span className="text-[10px]">Support</span>
            </Button>
          </div>

          <div className="absolute bottom-1.5 right-2">
            <Button
              variant="ghost"
              size="sm"
              className="flex-col h-auto py-1.5 gap-0.5 text-white/70 hover:bg-white/10 hover:text-white"
            >
              <Settings className="h-4 w-4" />
              <span className="text-[10px]">Settings</span>
            </Button>
          </div>
        </div>
      </nav>
    </div>
  )
}
