import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types (will match your Supabase schema)
export type Product = {
  id: string
  seller_id: string
  title: string
  description: string
  price: number
  image_url: string
  images: string[]
  tags: string[]
  location: string
  seller_rating: number
  seller_reviews: number
  shipping: string
  condition: string
  is_trusted_seller: boolean
  is_available: boolean
  favorited_count: number
  created_at: string
  
  // Joined seller data
  seller?: {
    username: string
    display_name: string
    avatar_url?: string
  }
}

