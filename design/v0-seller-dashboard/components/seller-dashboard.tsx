"use client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageSquare, HeadphonesIcon, Settings } from "lucide-react"

export default function SellerDashboard() {
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
      </header>

      {/* Profile Section */}
      <div className="bg-white px-4 py-4">
        <div className="flex items-center gap-2.5 mb-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src="/diverse-user-avatars.png" alt="Profile" />
            <AvatarFallback className="bg-muted text-muted-foreground text-sm">ME</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-foreground font-[family-name:var(--font-merriweather)]">
              Seller Dashboard
            </h1>
            <p className="text-xs text-muted-foreground">Storytelling seller since 2024</p>
          </div>
        </div>

        <Card className="my-1 bg-blue-50 border-blue-200">
          <div className="px-1 py-0 flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h2 className="text-xs font-semibold text-blue-900 leading-tight">Set Up Payouts</h2>
              <p className="text-[10px] leading-tight mt-0.5" style={{ color: "#333333" }}>
                ThriftShopper uses Stripe to process payouts. Complete onboarding to receive proceeds.
              </p>
            </div>
            <Button className="bg-blue-900 hover:bg-blue-800 text-white text-[10px] h-7 px-2 shrink-0 leading-none">
              Set Up Payouts
            </Button>
          </div>
        </Card>

        {/* Add New Listing Button */}
        <Button className="w-full bg-primary hover:bg-primary/90 text-white h-10 my-3">Add New Listing</Button>

        {/* Stats Grid */}
        <div className="flex flex-col gap-3 mb-4">
          <Card className="p-1 bg-white border-border">
            <div className="text-lg font-bold text-foreground">0</div>
            <div className="text-[10px] text-muted-foreground">Active Listings</div>
          </Card>

          <Card className="p-1 bg-white border-border">
            <div className="text-lg font-bold text-foreground">0</div>
            <div className="text-[10px] text-muted-foreground">Drafts</div>
          </Card>

          <Card className="p-1 bg-white border-border">
            <div className="text-lg font-bold text-foreground">0</div>
            <div className="text-[10px] text-muted-foreground">Sold Items</div>
          </Card>

          <Card className="p-1 bg-white border-border">
            <div className="text-lg font-bold text-foreground">$0.00</div>
            <div className="text-[10px] text-muted-foreground">Total Earnings</div>
          </Card>
        </div>

        {/* Your Listings Section */}
        <div>
          <h2 className="text-base font-semibold text-foreground font-[family-name:var(--font-merriweather)] mb-3">
            Your Listings
          </h2>

          {/* Table Header */}
          <div className="grid grid-cols-[2fr,1fr,1fr,1fr,auto] gap-2 px-3 py-2 border-b border-border mb-3">
            <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Title</div>
            <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Price</div>
            <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Status</div>
            <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Created</div>
            <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Actions</div>
          </div>

          {/* Empty State */}
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">
              No listings yet.{" "}
              <button className="text-primary hover:underline font-medium">Create your first listing</button>
            </p>
          </div>
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
