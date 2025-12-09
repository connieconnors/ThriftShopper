import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Function to generate embedding using OpenAI (MUST match seller-upload-service.ts!)
async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small', // SAME model as seller upload
      input: text,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('OpenAI Embedding API error:', errorData);
    throw new Error(`Failed to generate embedding: ${errorData.message || response.statusText}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

export async function POST(req: NextRequest) {
  try {
    const { moods, threshold = 0.7, limit = 50 } = await req.json();

    if (!moods || !Array.isArray(moods) || moods.length === 0) {
      return NextResponse.json({ error: 'No moods provided' }, { status: 400 });
    }

    // Combine moods into a single query string
    const queryText = moods.join(', ');

    // Generate embedding for the combined moods
    const queryEmbedding = await generateEmbedding(queryText);

    // Call the Supabase function for semantic search
    const { data, error } = await supabase.rpc('match_listings_by_mood', {
      query_embedding: queryEmbedding,
      match_threshold: threshold,
      match_count: limit,
    });

    if (error) {
      console.error('Supabase RPC error:', error);
      return NextResponse.json({ error: 'Semantic search failed', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ listings: data || [] });

  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

