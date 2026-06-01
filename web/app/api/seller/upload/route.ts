// app/api/seller/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { uploadAndCreateListing } from '@/lib/seller-upload-service';

export const runtime = 'nodejs';
export const maxDuration = 60;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function isAllowedListingImageUrl(imageUrl: string): boolean {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return false;
  return (
    imageUrl.startsWith(supabaseUrl) &&
    imageUrl.includes('/storage/v1/object/public/listings/')
  );
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in to create a listing.' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid or expired session. Please log in again.' },
        { status: 401 }
      );
    }

    const sellerId = user.id;
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const body = await request.json();
      const imageUrl = typeof body.imageUrl === 'string' ? body.imageUrl.trim() : '';

      if (!imageUrl) {
        return NextResponse.json({ error: 'No imageUrl provided' }, { status: 400 });
      }

      if (!isAllowedListingImageUrl(imageUrl)) {
        return NextResponse.json({ error: 'Invalid image URL' }, { status: 400 });
      }

      const userInput = {
        title: body.title as string | undefined,
        description: body.description as string | undefined,
        price: body.price !== undefined ? Number(body.price) : undefined,
        category: body.category as string | undefined,
      };

      const result = await uploadAndCreateListing(null, sellerId, userInput, {
        removeBackground: body.removeBackground === true,
        preUploadedImageUrl: imageUrl,
      });

      if (!result.success) {
        console.error('❌ Upload failed:', result.error);
        return NextResponse.json({ error: result.error }, { status: 500 });
      }

      return NextResponse.json(result);
    }

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
