// app/api/seller/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { uploadAndCreateListing } from '@/lib/seller-upload-service';

// Create Supabase client for server-side auth
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Get auth token from request header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in to create a listing.' },
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

    const sellerId = user.id;

    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    
    if (!imageFile) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const userInput = {
      title: formData.get('title') as string | undefined,
      description: formData.get('description') as string | undefined,
      price: formData.get('price') ? Number(formData.get('price')) : undefined,
      category: formData.get('category') as string | undefined,
    };

    // Background removal is now optional and happens AFTER AI analysis
    // Default to false - user can request it after seeing results
    const removeBackground = formData.get('removeBackground') === 'true';

    const result = await uploadAndCreateListing(
      Buffer.from(await imageFile.arrayBuffer()),
      sellerId,
      userInput,
      { removeBackground }
    );

    if (!result.success) {
      console.error('❌ Upload failed:', result.error);
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Log response structure for debugging
    console.log('✅ Upload success - Response structure:', {
      hasListingId: !!result.listingId,
      hasData: !!result.data,
      hasTitle: !!(result.data?.suggestedTitle),
      hasDescription: !!(result.data?.suggestedDescription),
      hasCategory: !!(result.data?.detectedCategory),
      title: result.data?.suggestedTitle || 'MISSING',
      description: result.data?.suggestedDescription ? 'present' : 'MISSING',
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Upload API error:', error);
    return NextResponse.json(
      { error: 'Upload failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
