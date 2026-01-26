// web/app/api/debug/mood-filter/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { normalizeTagColumn } from '@/lib/utils/tagNormalizer';
import { getMoodVariations } from '@/lib/moodMappings';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;
const supabaseService =
  supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

/**
 * Debug endpoint to test mood filter matching
 * GET /api/debug/mood-filter?moods=Collectibles,Antique&limit=10
 */
export async function GET(request: NextRequest) {
  try {
    if (!supabaseService) {
      return NextResponse.json(
        { error: 'Supabase service not configured' },
        { status: 500 }
      );
    }

    const searchParams = new URL(request.url).searchParams;
    const moodsParam = searchParams.get('moods') || '';
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const selectedMoods = moodsParam.split(',').map(m => m.trim()).filter(Boolean);
    
    if (selectedMoods.length === 0) {
      return NextResponse.json({
        error: 'No moods provided. Use ?moods=Collectibles,Antique',
        example: '/api/debug/mood-filter?moods=Collectibles,Antique&limit=10',
      });
    }

    // Fetch active listings
    const { data: listings, error } = await supabaseService
      .from('listings')
      .select('id, title, styles, moods, intents, category, description')
      .eq('status', 'active')
      .limit(limit * 3); // Get more to test matching

    if (error) {
      console.error('Error fetching listings:', error);
      return NextResponse.json(
        { error: 'Failed to fetch listings', details: error.message },
        { status: 500 }
      );
    }

    if (!listings || listings.length === 0) {
      return NextResponse.json({
        message: 'No listings found',
        selectedMoods,
        matches: [],
      });
    }

    // Test the filter logic
    const matches = listings
      .map((listing) => {
        const listingStyles = normalizeTagColumn(listing.styles);
        const listingMoods = normalizeTagColumn(listing.moods);
        const listingIntents = normalizeTagColumn(listing.intents);
        
        const allSearchableFields = [
          ...listingStyles,
          ...listingMoods,
          ...listingIntents,
        ].map(field => field.toLowerCase());

        const matchDetails = selectedMoods.map(selectedMood => {
          const normalizedMood = selectedMood.toLowerCase().trim();
          
          // Get all variations for fuzzy matching
          const variations = getMoodVariations(selectedMood);
          
          // Check if any variation matches any field
          const matched = allSearchableFields.some(field => {
            return variations.some(variation => {
              // Exact match
              if (field === variation) return true;
              // Word boundary match
              const escaped = variation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              const regex = new RegExp(`\\b${escaped}\\b`, 'i');
              return regex.test(field);
            });
          });
          
          // Find which fields matched
          const matchedIn = matched ? {
            styles: listingStyles.filter(s => {
              return variations.some(v => {
                const escaped = v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(`\\b${escaped}\\b`, 'i');
                return regex.test(s.toLowerCase());
              });
            }),
            moods: listingMoods.filter(m => {
              return variations.some(v => {
                const escaped = v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(`\\b${escaped}\\b`, 'i');
                return regex.test(m.toLowerCase());
              });
            }),
            intents: listingIntents.filter(i => {
              return variations.some(v => {
                const escaped = v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(`\\b${escaped}\\b`, 'i');
                return regex.test(i.toLowerCase());
              });
            }),
          } : null;
          
          return {
            selectedMood,
            normalizedMood,
            variations,
            matched,
            matchedIn,
          };
        });

        const allMatched = matchDetails.every(m => m.matched);

        return {
          listing: {
            id: listing.id,
            title: listing.title?.substring(0, 50),
            styles: listing.styles,
            moods: listing.moods,
            intents: listing.intents,
            stylesNormalized: listingStyles,
            moodsNormalized: listingMoods,
            intentsNormalized: listingIntents,
          },
          matchDetails,
          allMatched,
        };
      })
      .filter(result => result.allMatched);

    // Show sample of non-matching listings for debugging
    const nonMatches = listings
      .slice(0, 5)
      .map((listing) => {
        const listingStyles = normalizeTagColumn(listing.styles);
        const listingMoods = normalizeTagColumn(listing.moods);
        const listingIntents = normalizeTagColumn(listing.intents);
        
        return {
          id: listing.id?.substring(0, 8),
          title: listing.title?.substring(0, 40),
          styles: listing.styles,
          moods: listing.moods,
          intents: listing.intents,
          stylesNormalized: listingStyles,
          moodsNormalized: listingMoods,
          intentsNormalized: listingIntents,
          allFields: [
            ...listingStyles,
            ...listingMoods,
            ...listingIntents,
          ].map(f => f.toLowerCase()),
        };
      });

    return NextResponse.json({
      selectedMoods,
      totalListings: listings.length,
      matchesFound: matches.length,
      matches: matches.slice(0, 10),
      sampleNonMatches: nonMatches,
      debug: {
        selectedMoodsNormalized: selectedMoods.map(m => m.toLowerCase().trim()),
      },
    });
  } catch (error) {
    console.error('Debug mood filter error:', error);
    return NextResponse.json(
      {
        error: 'Failed to debug mood filter',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
