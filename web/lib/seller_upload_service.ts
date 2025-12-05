// ThriftShopper Seller Upload Service - WITH DATABASE INTEGRATION
// Saves to listings and listing_photos tables

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE! // Use service role for server-side operations
);

interface UploadAndSaveResult {
  success: boolean;
  listingId?: string;
  photoId?: string;
  data?: {
    processedImageUrl: string;
    suggestedTitle: string;
    suggestedDescription: string;
    detectedCategory: string;
    detectedAttributes: string[];
    pricingIntelligence?: {
      minPrice: number;
      maxPrice: number;
      avgPrice: number;
      recentSales: number;
    };
  };
  error?: string;
}

/**
 * Complete upload process that saves to database
 */
export async function uploadAndCreateListing(
  imageFile: File | Buffer,
  sellerId: string, // User ID of the seller
  userInput?: {
    title?: string;
    description?: string;
    price?: number;
    category?: string;
  }
): Promise<UploadAndSaveResult> {
  try {
    // Step 1: Upload original image to storage
    const originalFilename = `original-${Date.now()}.jpg`;
    const { data: originalUpload, error: originalError } = await supabase.storage
      .from('product-images')
      .upload(originalFilename, imageFile, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (originalError) throw new Error(`Original upload failed: ${originalError.message}`);

    const { data: { publicUrl: originalUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(originalFilename);

    // Step 2: Remove background
    const processedImageUrl = await removeBackground(imageFile);

    // Step 3: Analyze with Vision AI
    const visionData = await analyzeImage(processedImageUrl);

    // Step 4: Generate listing with OpenAI
    const listing = await generateListing(visionData, userInput);

    // Step 5: Get eBay pricing
    const pricingIntelligence = await getEbayPricing(listing.title);

    // Step 6: Create listing in database
    const { data: listingData, error: listingError } = await supabase
      .from('listings')
      .insert({
        seller_id: sellerId,
        title: userInput?.title || listing.title,
        description: userInput?.description || listing.description,
        price: userInput?.price || pricingIntelligence?.avgPrice || null,
        category: userInput?.category || visionData.category,
        ai_generated_title: listing.title,
        ai_generated_description: listing.description,
        user_edited_title: !!userInput?.title,
        user_edited_description: !!userInput?.description,
        ebay_min_price: pricingIntelligence?.minPrice,
        ebay_max_price: pricingIntelligence?.maxPrice,
        ebay_avg_price: pricingIntelligence?.avgPrice,
        ebay_recent_sales: pricingIntelligence?.recentSales,
        ebay_last_checked: new Date().toISOString(),
        status: 'draft', // Seller can review before publishing
      })
      .select()
      .single();

    if (listingError) throw new Error(`Listing creation failed: ${listingError.message}`);

    // Step 7: Create listing_photos entry
    const { data: photoData, error: photoError } = await supabase
      .from('listing_photos')
      .insert({
        listing_id: listingData.id,
        original_image_url: originalUrl,
        processed_image_url: processedImageUrl,
        storage_path: processedImageUrl.split('/').pop(), // Extract filename
        ai_detected_category: visionData.category,
        ai_detected_attributes: visionData.attributes,
        processing_status: 'complete',
        is_primary: true, // First photo is primary
      })
      .select()
      .single();

    if (photoError) throw new Error(`Photo record creation failed: ${photoError.message}`);

    return {
      success: true,
      listingId: listingData.id,
      photoId: photoData.id,
      data: {
        processedImageUrl,
        suggestedTitle: listing.title,
        suggestedDescription: listing.description,
        detectedCategory: visionData.category,
        detectedAttributes: visionData.attributes,
        pricingIntelligence: pricingIntelligence || undefined,
      },
    };
  } catch (error) {
    console.error('Upload and save error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Update existing listing with user edits
 */
export async function updateListing(
  listingId: string,
  updates: {
    title?: string;
    description?: string;
    price?: number;
    category?: string;
    status?: 'draft' | 'published' | 'sold';
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('listings')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', listingId);

    if (error) throw new Error(error.message);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Update failed',
    };
  }
}

/**
 * Publish a draft listing
 */
export async function publishListing(listingId: string): Promise<{ success: boolean; error?: string }> {
  return updateListing(listingId, { status: 'published' });
}

// Helper functions (same as before but extracted for clarity)

async function removeBackground(imageFile: File | Buffer): Promise<string> {
  const formData = new FormData();
  
  if (imageFile instanceof File) {
    formData.append('image_file', imageFile);
  } else {
    const blob = new Blob([imageFile]);
    formData.append('image_file', blob);
  }
  
  formData.append('size', 'auto');
  formData.append('format', 'png');

  const response = await fetch('https://api.remove.bg/v1.0/removebg', {
    method: 'POST',
    headers: { 'X-Api-Key': process.env.REMOVE_BG_KEY! },
    body: formData,
  });

  if (!response.ok) throw new Error(`Remove.bg failed: ${response.statusText}`);

  const processedImageBuffer = await response.arrayBuffer();
  
  const filename = `processed-${Date.now()}.png`;
  const { data, error } = await supabase.storage
    .from('product-images')
    .upload(filename, processedImageBuffer, {
      contentType: 'image/png',
      upsert: false,
    });

  if (error) throw new Error(`Supabase upload failed: ${error.message}`);

  const { data: { publicUrl } } = supabase.storage
    .from('product-images')
    .getPublicUrl(filename);

  return publicUrl;
}

async function analyzeImage(imageUrl: string): Promise<any> {
  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${process.env.VISION_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [{
          image: { source: { imageUri: imageUrl } },
          features: [
            { type: 'LABEL_DETECTION', maxResults: 10 },
            { type: 'OBJECT_LOCALIZATION', maxResults: 5 },
          ],
        }],
      }),
    }
  );

  const data = await response.json();
  const labels = data.responses[0]?.labelAnnotations || [];
  const objects = data.responses[0]?.localizedObjectAnnotations || [];

  const allLabels = [
    ...labels.map((l: any) => ({ description: l.description, score: l.score })),
    ...objects.map((o: any) => ({ description: o.name, score: o.score })),
  ];

  const category = inferCategory(allLabels);
  const attributes = allLabels
    .filter((l) => l.score > 0.7)
    .map((l) => l.description)
    .slice(0, 5);

  return { category, attributes, rawLabels: allLabels };
}

function inferCategory(labels: Array<{ description: string; score: number }>): string {
  const categoryMap: Record<string, string[]> = {
    'Kitchen & Dining': ['dishware', 'tableware', 'cookware', 'glassware', 'bowl', 'plate', 'cup', 'mug'],
    'Home Decor': ['vase', 'lamp', 'picture frame', 'sculpture', 'candle', 'mirror'],
    'Collectibles': ['figurine', 'toy', 'doll', 'statue', 'antique'],
    'Books & Media': ['book', 'vinyl record', 'cd', 'dvd', 'magazine'],
    'Furniture': ['chair', 'table', 'desk', 'cabinet', 'shelf'],
    'Art': ['painting', 'artwork', 'print', 'canvas'],
    'Electronics': ['camera', 'radio', 'clock', 'telephone'],
    'Fashion Accessories': ['handbag', 'jewelry', 'watch', 'scarf', 'hat'],
  };

  for (const [category, keywords] of Object.entries(categoryMap)) {
    for (const label of labels) {
      if (keywords.some((kw) => label.description.toLowerCase().includes(kw))) {
        return category;
      }
    }
  }

  return 'General';
}

async function generateListing(visionData: any, userInput?: any): Promise<any> {
  const prompt = `You are an expert at writing compelling secondhand marketplace listings.

ITEM DETAILS:
- Category: ${visionData.category}
- Detected attributes: ${visionData.attributes.join(', ')}
- User provided title: ${userInput?.title || 'None'}
- User provided description: ${userInput?.description || 'None'}

Generate a marketplace listing with:
1. A concise, SEO-friendly title (max 80 characters)
2. A compelling description (2-3 sentences) that highlights the item's appeal

Focus on:
- Era/vintage appeal if applicable
- Unique features or craftsmanship
- Condition (mention "pre-owned" or "vintage" as appropriate)
- Style keywords (Mid-Century, Art Deco, Boho, etc.)

Return ONLY valid JSON in this format:
{
  "title": "your title here",
  "description": "your description here"
}

DO NOT include any text outside the JSON structure.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 200,
    }),
  });

  const data = await response.json();
  const content = data.choices[0].message.content.trim();
  return JSON.parse(content);
}

async function getEbayPricing(searchQuery: string): Promise<any> {
  const endpoint = 'https://svcs.ebay.com/services/search/FindingService/v1';
  
  const params = new URLSearchParams({
    'OPERATION-NAME': 'findCompletedItems',
    'SERVICE-VERSION': '1.0.0',
    'SECURITY-APPNAME': process.env.EBAY_APP_ID!,
    'RESPONSE-DATA-FORMAT': 'JSON',
    'REST-PAYLOAD': '',
    'keywords': searchQuery,
    'itemFilter(0).name': 'SoldItemsOnly',
    'itemFilter(0).value': 'true',
    'itemFilter(1).name': 'ListingType',
    'itemFilter(1).value': 'FixedPrice',
    'sortOrder': 'EndTimeSoonest',
    'paginationInput.entriesPerPage': '20',
  });

  const response = await fetch(`${endpoint}?${params.toString()}`);
  const data = await response.json();

  const items = data.findCompletedItemsResponse?.[0]?.searchResult?.[0]?.item || [];
  
  if (items.length === 0) return null;

  const prices = items
    .map((item: any) => parseFloat(item.sellingStatus?.[0]?.currentPrice?.[0]?.__value__ || '0'))
    .filter((price: number) => price > 0);

  if (prices.length === 0) return null;

  return {
    minPrice: Math.min(...prices),
    maxPrice: Math.max(...prices),
    avgPrice: Math.round(prices.reduce((a: number, b: number) => a + b, 0) / prices.length),
    recentSales: prices.length,
  };
}