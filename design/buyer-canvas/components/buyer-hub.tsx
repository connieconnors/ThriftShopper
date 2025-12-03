"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageSquare, HeadphonesIcon, Mic, Heart, Award, ArrowLeft, Upload } from "lucide-react"

export default function BuyerHub() {
  const [vibes, setVibes] = useState(["vintage", "rustic", "quirky"])

  // Mock data for purchased items
  const purchases = [
    {
      id: 1,
      image: "/images/img-7658.jpeg",
      title: "Iron Fence Finials",
      price: 175,
    },
  ]

  // Mock saved items
  const savedItems = [
    {
      id: 1,
      image: "/vintage-brass-candlesticks.jpg",
      title: "Brass Candlesticks",
    },
    {
      id: 2,
      image: "/antique-wooden-box.jpg",
      title: "Wooden Jewelry Box",
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-primary px-4 py-3 flex items-center justify-between">
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

      <div className="bg-white px-4 py-4">
        <div className="flex items-center gap-2.5 mb-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src="/diverse-user-avatars.png" alt="Profile" />
            <AvatarFallback className="bg-muted text-muted-foreground text-xs">ME</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="text-base font-semibold text-foreground">My Canvas</h1>
            <p className="text-xs text-muted-foreground">Treasure hunter since 2024</p>
          </div>
        </div>

        <div className="relative mb-2.5">
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

      <div className="bg-muted/30 px-4 py-5">
        <div className="text-center mb-4">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">PLAYGROUND</h2>
        </div>

        <div className="space-y-3 max-w-md mx-auto">
          {/* Stories */}
          <Card className="p-1.5 bg-white border-border relative">
            <h3 className="text-xs font-semibold text-foreground mb-0">Stories</h3>
            <p className="text-[11px] text-muted-foreground leading-tight mb-1">
              Share the story behind your treasures
            </p>
            <div className="flex gap-1.5">
              <input
                type="text"
                placeholder="Tell your story..."
                disabled
                className="flex-1 bg-muted/30 rounded px-2 py-1 text-[11px] placeholder:text-muted-foreground/50"
              />
              <Button size="icon" variant="outline" disabled className="h-6 w-6 shrink-0 bg-transparent">
                <Mic className="h-3 w-3" />
              </Button>
            </div>
          </Card>

          {/* Collections */}
          <Card className="p-1.5 bg-white border-border relative">
            <h3 className="text-xs font-semibold text-foreground mb-0">Discovery Collection</h3>
            <p className="text-[11px] text-muted-foreground leading-tight mb-1">
              Organize your finds by theme, room, or era
            </p>
            <Button variant="outline" size="sm" disabled className="w-full h-6 text-[11px] gap-1.5 bg-transparent">
              <Upload className="h-3 w-3" />
              Upload Photos
            </Button>
          </Card>

          {/* Badges */}
          <Card className="p-1 bg-white border-border relative">
            <h3 className="text-xs font-semibold text-foreground mb-0">Badges</h3>
            <p className="text-[11px] text-muted-foreground leading-tight mb-0.5">Earn badges as you hunt</p>
            <div className="flex justify-center gap-2">
              {[
                { name: "Rare Find", icon: Award },
                { name: "Collector", icon: Award },
                { name: "Early Bird", icon: Award },
              ].map((badge) => (
                <div key={badge.name} className="flex flex-col items-center gap-0.5 opacity-30">
                  <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center">
                    <badge.icon className="h-2.5 w-2.5 text-muted-foreground" />
                  </div>
                  <span className="text-[8px] text-muted-foreground text-center">{badge.name}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* First Dibs Status */}
          <Card className="p-1 bg-white border-border">
            <h3 className="text-xs font-semibold text-foreground mb-0">First Dibs Status</h3>
            <p className="text-[11px] text-muted-foreground leading-tight mb-0.5">Your exclusive access level</p>
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-muted-foreground">Points</span>
                <span className="text-foreground font-medium">150 / 1000</span>
              </div>
              <div className="h-1 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                  style={{ width: "15%" }}
                />
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="px-4 py-4 space-y-5 pb-20">
        {/* Favorites */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-foreground">Favorites</h2>
            <span className="text-xs text-muted-foreground">{savedItems.length}</span>
          </div>
          <div className="overflow-x-auto -mx-4 px-4">
            <div className="flex gap-2.5 w-max">
              {savedItems.map((item) => (
                <Card key={item.id} className="overflow-hidden border-border aspect-square w-40 relative p-0">
                  <img src={item.image || "/placeholder.svg"} alt={item.title} className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow-sm">
                    <Heart className="h-3.5 w-3.5 text-foreground" />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Purchases */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-foreground">Purchases</h2>
            <span className="text-xs text-muted-foreground">{purchases.length}</span>
          </div>
          <div className="overflow-x-auto -mx-4 px-4">
            <div className="flex gap-2.5 w-max">
              {purchases.map((item) => (
                <Card key={item.id} className="overflow-hidden border-border aspect-square w-40 p-0">
                  <img src={item.image || "/placeholder.svg"} alt={item.title} className="w-full h-full object-cover" />
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

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

          <div className="absolute bottom-1.5 right-2 opacity-30">
            <div className="flex flex-col items-center gap-0">
              <div className="flex items-center -tracking-wider">
                <span className="text-[17px] font-semibold text-white font-[family-name:var(--font-merriweather)]">
                  T
                </span>
                <span className="text-[17px] font-semibold text-white font-[family-name:var(--font-merriweather)] -ml-0.5">
                  S
                </span>
              </div>
              <svg
                className="h-2 w-2.5 -mt-0.5"
                viewBox="0 0 24 24"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" className="text-secondary" />
              </svg>
            </div>
          </div>
        </div>
      </nav>
    </div>
  )
}
