// ThriftShopper Seller Upload Service
// Saves to listings table in Supabase

import { createClient } from '@supabase/supabase-js';

// Use the correct environment variable names
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface UploadAndSaveResult {
  success: boolean;
  listingId?: string;
  data?: {
    processedImageUrl: string;
    originalImageUrl: string;
    backgroundRemoved: boolean;
    suggestedTitle: string;
    suggestedDescription: string;
    detectedCategory: string;
    detectedAttributes: string[];
    pricingIntelligence?: {
      minPrice: number;
      maxPrice: number;
      avgPrice: number;
      recentSales: number;
      source: 'ebay' | 'ai_estimate';
    };
  };
  error?: string;
}

export async function uploadAndCreateListing(
  imageFile: File | Buffer,
  sellerId: string,
  userInput?: {
    title?: string;
    description?: string;
    price?: number;
    category?: string;
  }
): Promise<UploadAndSaveResult> {
  try {
    // Step 1: Upload original image to Supabase Storage
    const originalFilename = `original-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
    
    let uploadData: Uint8Array;
    if (Buffer.isBuffer(imageFile)) {
      uploadData = new Uint8Array(imageFile);
    } else {
      // It's a File object
      const arrayBuffer = await (imageFile as File).arrayBuffer();
      uploadData = new Uint8Array(arrayBuffer);
    }

    const { data: originalUpload, error: originalError } = await supabase.storage
      .from('listings')
      .upload(originalFilename, uploadData, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (originalError) {
      throw new Error(`Image upload failed: ${originalError.message}`);
    }

    const { data: { publicUrl: originalUrl } } = supabase.storage
      .from('listings')
      .getPublicUrl(originalFilename);

    // Step 2: Try to process with AI (but don't fail if APIs are missing)
    let processedImageUrl = originalUrl;
    let visionData = { 
      category: userInput?.category || 'General', 
      attributes: [] as string[],
      suggestedTitle: '',
      suggestedDescription: '',
      suggestedPrice: null as number | null,
    };
    let listing = { 
      title: userInput?.title || 'New Listing', 
      description: userInput?.description || '' 
    };
    let pricingIntelligence = null;
    let backgroundRemoved = false;

    // Try background removal (optional - don't fail if key missing)
    if (process.env.REMOVE_BG_KEY) {
      try {
        processedImageUrl = await removeBackground(imageFile);
        backgroundRemoved = true;
        console.log('✓ Background removal successful');
      } catch (e) {
        // Background removal failed, continue with original image
        console.error('✗ Background removal failed:', e instanceof Error ? e.message : String(e));
        backgroundRemoved = false;
      }
    } else {
      console.log('ℹ REMOVE_BG_KEY not set, skipping background removal');
    }

    // Use OpenAI Vision (GPT-4o) for image analysis + listing generation + price estimation
    let aiSource = 'none';
    let aiError = '';
    
    if (process.env.OPENAI_API_KEY) {
      try {
        const openAIResult = await analyzeWithOpenAI(originalUrl);
        aiSource = 'openai';
        
        visionData = {
          category: openAIResult.category || 'General',
          attributes: openAIResult.attributes || [],
          suggestedTitle: openAIResult.title || '',
          suggestedDescription: openAIResult.description || '',
          suggestedPrice: openAIResult.estimatedPrice || null,
        };
        
        listing = {
          title: openAIResult.title || 'New Listing',
          description: openAIResult.description || '',
        };
        
        // Use OpenAI's price estimate if no eBay data
        if (openAIResult.estimatedPrice) {
          pricingIntelligence = {
            minPrice: Math.round(openAIResult.estimatedPrice * 0.7),
            maxPrice: Math.round(openAIResult.estimatedPrice * 1.3),
            avgPrice: openAIResult.estimatedPrice,
            recentSales: 0, // Estimated, not from eBay
            source: 'ai_estimate',
          };
        }
      } catch (e) {
        // OpenAI Vision failed, try Google Vision as fallback
        aiError = e instanceof Error ? e.message : String(e);
        aiSource = 'openai_failed';
      }
    }
    
    // Fallback: Try Google Vision image analysis (if OpenAI didn't work or isn't configured)
    if ((aiSource === 'none' || aiSource === 'openai_failed') && process.env.VISION_API_KEY) {
      try {
        const googleVisionData = await analyzeImage(processedImageUrl);
        visionData.category = googleVisionData.category;
        visionData.attributes = googleVisionData.attributes;
        if (aiSource !== 'openai_failed') aiSource = 'google_vision';
      } catch (e) {
        // Google Vision failed, continue with defaults
        if (aiSource !== 'openai_failed') aiSource = 'google_vision_failed';
      }
    }

    // Try eBay pricing (optional - better prices if available)
    if (process.env.EBAY_APP_ID && listing.title !== 'New Listing') {
      try {
        const ebayPricing = await getEbayPricing(listing.title);
        if (ebayPricing) {
          pricingIntelligence = { ...ebayPricing, source: 'ebay' };
        }
      } catch (e) {
        // eBay pricing failed, continue with AI estimate
      }
    }

    // Step 3: Create listing in database
  // Categorize the AI-detected attributes
const categorizeAttributes = (attributes: string[]) => {
  const styles: string[] = [];
  const moods: string[] = [];
  const intents: string[] = [];
  
  const styleKeywords = ['vintage', 'modern', 'rustic', 'mid-century', 'antique', 'contemporary', 
    'traditional', 'industrial', 'bohemian', 'minimalist', 'ornate', 'sleek', 'embroidered',
    'carved', 'painted', 'glazed', 'silver plated', 'brass', 'wood', 'ceramic', 'porcelain',
    'designer', 'loafers', 'shoes', 'jewelry', 'necklace', 'pearl', 'scalloped', 'serving bowl',
    'leather', 'Coach', 'Stubbs', 'Wootton'];
  
  const moodKeywords = ['whimsical', 'elegant', 'playful', 'cozy', 'luxurious', 'quirky', 
    'charming', 'romantic', 'bold', 'delicate', 'dramatic', 'cheerful', 'sophisticated',
    'humor', 'humorous', 'fun', 'serious', 'calm', 'energetic'];
  
  const intentKeywords = ['gift', 'decor', 'collection', 'display', 'functional', 'serving',
    'storage', 'wedding', 'housewarming', 'birthday', 'anniversary', 'everyday', 'special occasion'];
  
  attributes.forEach(attr => {
    const lower = attr.toLowerCase();
    
    if (styleKeywords.some(k => lower.includes(k))) {
      styles.push(attr);
    }
    else if (moodKeywords.some(k => lower.includes(k))) {
      moods.push(attr);
    }
    else if (intentKeywords.some(k => lower.includes(k))) {
      intents.push(attr);
    }
    else {
      styles.push(attr);
    }
  });
  
  return { styles, moods, intents };
};
// Generate embedding for semantic search
let embedding = null;
if (process.env.OPENAI_API_KEY) {
  try {
    const embeddingText = `${listing.title} ${listing.description} ${visionData.attributes.join(' ')} ${visionData.category}`;
    embedding = await generateEmbedding(embeddingText);
  } catch (e) {
    // Embedding generation failed, listing will work without semantic search
  }
}
const categorized = categorizeAttributes(visionData.attributes || []);

const listingInsert = {
  seller_id: sellerId,
  title: userInput?.title || listing.title,
  description: userInput?.description || listing.description,
  price: userInput?.price || pricingIntelligence?.avgPrice || null,
  category: userInput?.category || visionData.category,
  original_image_url: originalUrl,
  clean_image_url: processedImageUrl !== originalUrl ? processedImageUrl : null,
  staged_image_url: null,
  status: 'draft',
  styles: categorized.styles,
  moods: categorized.moods,
  intents: categorized.intents,
  embedding: embedding,
};

    const { data: listingData, error: listingError } = await supabase
      .from('listings')
      .insert(listingInsert)
      .select()
      .single();

    if (listingError) {
      throw new Error(`Listing creation failed: ${listingError.message}`);
    }

    return {
      success: true,
      listingId: listingData.id,
      data: {
        processedImageUrl: processedImageUrl,
        originalImageUrl: originalUrl,
        backgroundRemoved: backgroundRemoved,
        suggestedTitle: listing.title,
        suggestedDescription: listing.description,
        detectedCategory: visionData.category,
        detectedAttributes: visionData.attributes,
        pricingIntelligence: pricingIntelligence ? {
          minPrice: pricingIntelligence.minPrice,
          maxPrice: pricingIntelligence.maxPrice,
          avgPrice: pricingIntelligence.avgPrice,
          recentSales: pricingIntelligence.recentSales,
          source: pricingIntelligence.source as 'ebay' | 'ai_estimate',
        } : undefined,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

// OpenAI Vision (GPT-4o) - analyzes image and generates listing details + price estimate
async function analyzeWithOpenAI(imageUrl: string): Promise<{
  title: string;
  description: string;
  category: string;
  attributes: string[];
  estimatedPrice: number | null;
}> {
  const prompt = `You are an expert at identifying and pricing secondhand/vintage items for resale on marketplaces like eBay, Poshmark, and ThriftShopper.

Analyze this image and provide:
1. A compelling, SEO-friendly title (max 80 characters) 
2. A detailed description (2-3 sentences highlighting key features, condition, and appeal)
3. The most appropriate category from: Kitchen & Dining, Home Decor, Collectibles, Books & Media, Furniture, Art, Electronics, Fashion, Jewelry, Toys & Games, Sports & Outdoors, General
4. 5 descriptive attributes/tags (like: vintage, gold, leather, designer, bohemian, etc.)
5. An estimated resale price in USD based on typical secondhand marketplace prices

Be specific about what you see. If it's a designer item, identify the brand. If it's vintage, estimate the era.

Return ONLY valid JSON in this exact format:
{
  "title": "Vintage Coach Leather Crossbody Bag Brown",
  "description": "Beautiful vintage Coach crossbody bag in rich brown leather. Features adjustable strap and brass hardware. Shows light patina consistent with age, adding to its vintage charm.",
  "category": "Fashion",
  "attributes": ["vintage", "leather", "designer", "Coach", "crossbody"],
  "estimatedPrice": 85
}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: imageUrl, detail: 'high' } },
          ],
        },
      ],
      max_tokens: 500,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI Vision API failed: ${response.status}`);
  }

  const data = await response.json();
  let content = data.choices?.[0]?.message?.content?.trim() || '{}';

  // Clean up the response - remove markdown code blocks if present
  content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  
  // Extract JSON from response
  const firstBrace = content.indexOf('{');
  const lastBrace = content.lastIndexOf('}');

  if (firstBrace !== -1 && lastBrace !== -1) {
    content = content.substring(firstBrace, lastBrace + 1);
  }

  try {
    const parsed = JSON.parse(content);
    
    // Clean attributes - remove any JSON syntax characters like quotes, brackets
    const cleanAttributes = Array.isArray(parsed.attributes) 
      ? parsed.attributes.map((attr: any) => {
          // Convert to string and remove quotes, brackets, and extra whitespace
          let cleaned = String(attr).trim();
          // Remove leading/trailing quotes and brackets
          cleaned = cleaned.replace(/^[\["\s]+|[\]"\s]+$/g, '');
          // Remove any remaining quotes or brackets in the middle
          cleaned = cleaned.replace(/["\[\]]/g, '');
          // Ensure space after commas within the text
          cleaned = cleaned.replace(/,([^\s])/g, ', $1');
          return cleaned;
        }).filter((attr: string) => attr.length > 0)  // Remove empty strings
      : [];
    
    return {
      title: parsed.title || 'New Listing',
      description: parsed.description || '',
      category: parsed.category || 'General',
      attributes: cleanAttributes,
      estimatedPrice: typeof parsed.estimatedPrice === 'number' ? parsed.estimatedPrice : null,
    };
  } catch (e) {
    // Failed to parse AI response, return defaults
    return {
      title: 'New Listing',
      description: '',
      category: 'General',
      attributes: [],
      estimatedPrice: null,
    };
  }
}

async function removeBackground(imageFile: File | Buffer): Promise<string> {
  const formData = new FormData();
  
  if (imageFile instanceof File) {
    formData.append('image_file', imageFile);
  } else {
    const uint8Array = new Uint8Array(imageFile);
    const blob = new Blob([uint8Array], { type: 'image/jpeg' });
    formData.append('image_file', blob, 'image.jpg');
  }
  
  formData.append('size', 'auto');
  formData.append('format', 'png');

  const response = await fetch('https://api.remove.bg/v1.0/removebg', {
    method: 'POST',
    headers: { 'X-Api-Key': process.env.REMOVE_BG_KEY! },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Remove.bg failed: ${response.status} - ${errorText}`);
  }

  const processedImageBuffer = await response.arrayBuffer();
  
  const filename = `processed-${Date.now()}-${Math.random().toString(36).substring(7)}.png`;
  const { error } = await supabase.storage
    .from('listings')
    .upload(filename, new Uint8Array(processedImageBuffer), {
      contentType: 'image/png',
      upsert: false,
    });

  if (error) throw new Error(`Supabase upload failed: ${error.message}`);

  const { data: { publicUrl } } = supabase.storage
    .from('listings')
    .getPublicUrl(filename);

  return publicUrl;
}

async function analyzeImage(imageUrl: string): Promise<{ category: string; attributes: string[] }> {
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
  const labels = data.responses?.[0]?.labelAnnotations || [];
  const objects = data.responses?.[0]?.localizedObjectAnnotations || [];

  const allLabels = [
    ...labels.map((l: any) => ({ description: l.description, score: l.score })),
    ...objects.map((o: any) => ({ description: o.name, score: o.score })),
  ];

  const category = inferCategory(allLabels);
  const attributes = allLabels
    .filter((l: any) => l.score > 0.7)
    .map((l: any) => l.description)
    .slice(0, 5);

  return { category, attributes };
}

function inferCategory(labels: Array<{ description: string; score: number }>): string {
  const categoryMap: Record<string, string[]> = {
    'Kitchen & Dining': ['dishware', 'tableware', 'cookware', 'glassware', 'bowl', 'plate', 'cup', 'mug', 'kitchen'],
    'Home Decor': ['vase', 'lamp', 'picture frame', 'sculpture', 'candle', 'mirror', 'decor'],
    'Collectibles': ['figurine', 'toy', 'doll', 'statue', 'antique', 'vintage'],
    'Books & Media': ['book', 'vinyl record', 'cd', 'dvd', 'magazine'],
    'Furniture': ['chair', 'table', 'desk', 'cabinet', 'shelf'],
    'Art': ['painting', 'artwork', 'print', 'canvas', 'art'],
    'Electronics': ['camera', 'radio', 'clock', 'telephone'],
    'Fashion': ['handbag', 'jewelry', 'watch', 'scarf', 'hat', 'clothing'],
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

async function generateListing(
  visionData: { category: string; attributes: string[] }, 
  userInput?: { title?: string; description?: string }
): Promise<{ title: string; description: string }> {
  const prompt = `You are an expert at writing compelling secondhand marketplace listings.

ITEM DETAILS:
- Category: ${visionData.category}
- Detected attributes: ${visionData.attributes.join(', ')}
- User provided title: ${userInput?.title || 'None'}
- User provided description: ${userInput?.description || 'None'}

Generate a marketplace listing with:
1. A concise, SEO-friendly title (max 80 characters)
2. A compelling description (2-3 sentences)

Return ONLY valid JSON:
{
  "title": "your title here",
  "description": "your description here"
}`;

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
  let content = data.choices?.[0]?.message?.content?.trim() || '{}';

  // Clean up the response
  content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  
  const firstBrace = content.indexOf('{');
  const lastBrace = content.lastIndexOf('}');

  if (firstBrace !== -1 && lastBrace !== -1) {
    content = content.substring(firstBrace, lastBrace + 1);
  }

  try {
    return JSON.parse(content);
  } catch {
    return { title: 'New Listing', description: '' };
  }
}

async function getEbayPricing(searchQuery: string): Promise<{
  minPrice: number;
  maxPrice: number;
  avgPrice: number;
  recentSales: number;
} | null> {
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
async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
    }),
  });

  if (!response.ok) {
    throw new Error(`Embedding generation failed: ${response.status}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}