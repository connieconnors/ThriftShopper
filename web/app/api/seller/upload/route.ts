// app/api/seller/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { uploadAndCreateListing } from '@/lib/seller-upload-service';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    
    if (!imageFile) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // TODO: Get actual seller ID from auth session
    // For now using a placeholder - you'll replace this with real auth
    const sellerId = '00000000-0000-0000-0000-000000000000'; // Temporary UUID
    
    const userInput = {
      title: formData.get('title') as string | undefined,
      description: formData.get('description') as string | undefined,
      price: formData.get('price') ? Number(formData.get('price')) : undefined,
      category: formData.get('category') as string | undefined,
    };

    const result = await uploadAndCreateListing(
      Buffer.from(await imageFile.arrayBuffer()),
      sellerId,
      userInput
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Upload API error:', error);
    return NextResponse.json(
      { error: 'Upload failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}