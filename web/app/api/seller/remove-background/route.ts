// app/api/seller/remove-background/route.ts
// On-demand background removal after AI analysis
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { removeBackground } from '@/lib/seller-upload-service';

// Create Supabase client with service role key for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

if (!supabaseServiceKey) {
  console.error('❌ CRITICAL: SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_ROLE not set!');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export async function POST(request: NextRequest) {
  try {
    // Get auth token from request header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in.' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid or expired session. Please log in again.' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    const listingId = formData.get('listingId') as string;
    
    if (!imageFile) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    if (!process.env.REMOVE_BG_KEY) {
      return NextResponse.json(
        { error: 'Background removal is not configured. Please contact support.' },
        { status: 503 }
      );
    }

    // Remove background
    const processedImageUrl = await removeBackground(Buffer.from(await imageFile.arrayBuffer()));

    // Update the listing with the processed image URL
    if (listingId) {
      const { error: updateError } = await supabase
        .from('listings')
        .update({ clean_image_url: processedImageUrl })
        .eq('id', listingId)
        .eq('seller_id', user.id);

      if (updateError) {
        console.error('Error updating listing with processed image:', updateError);
        // Don't fail - return the URL anyway
      }
    }

    return NextResponse.json({
      success: true,
      processedImageUrl,
      backgroundRemoved: true,
    });
  } catch (error) {
    console.error('Remove background API error:', error);
    return NextResponse.json(
      { 
        error: 'Background removal failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

