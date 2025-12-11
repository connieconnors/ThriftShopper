// ThriftShopper Seller Upload Service
// Saves to listings table in Supabase

import { createClient } from '@supabase/supabase-js';

// Use the correct environment variable names
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

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
        
        // Add brand info to attributes if detected
        if (googleVisionData.brandInfo) {
          visionData.attributes = [googleVisionData.brandInfo, ...visionData.attributes];
        }
        
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
  // Categorize the AI-detected attributes using OpenAI for better accuracy
const categorizeAttributes = async (attributes: string[], title: string, description: string) => {
  // If no OpenAI key, fall back to simple categorization
  if (!process.env.OPENAI_API_KEY) {
    // Simple keyword-based categorization
    const allText = `${title} ${description} ${attributes.join(' ')}`.toLowerCase();
    
    // Infer intents from keywords
    const intents: string[] = [];
    if (allText.includes('gift') || allText.includes('present') || allText.includes('wedding') || allText.includes('anniversary')) {
      intents.push('gifting');
    }
    if (allText.includes('decor') || allText.includes('display') || allText.includes('home') || allText.includes('vase') || allText.includes('bowl') || allText.includes('plate')) {
      intents.push('home-decor');
    }
    if (allText.includes('collect') || allText.includes('vintage') || allText.includes('antique')) {
      intents.push('collection');
    }
    if (allText.includes('functional') || allText.includes('use') || allText.includes('serve')) {
      intents.push('functional');
    }
    
    // Infer moods from keywords
    const moods: string[] = [];
    const moodKeywords = ['whimsical', 'elegant', 'cozy', 'playful', 'romantic', 'quirky', 'charming', 'delicate', 'bold', 'sophisticated'];
    moodKeywords.forEach(mood => {
      if (allText.includes(mood)) {
        moods.push(mood);
      }
    });
    
    return {
      styles: attributes.slice(0, Math.min(5, attributes.length)),
      moods: moods.slice(0, 3),
      intents: intents.slice(0, 3)
    };
  }

  try {
    const prompt = `Categorize these item attributes into styles, moods, and intents for search.

ITEM:
Title: ${title}
Description: ${description}
Attributes: ${attributes.join(', ')}

CATEGORIZE INTO:
- **styles**: Era (vintage, mid-century, art-deco, etc), materials (brass, ceramic, leather, etc), brands
- **moods**: Emotional vibes (whimsical, elegant, cozy, playful, romantic, quirky, etc)
- **intents**: Use cases (gifting, home-decor, collection, functional, etc)

RULES:
- Only use "vintage" for items clearly from 1920s-1980s
- Avoid generic mood words unless they truly apply
- Infer intents from the type of item (e.g., decorative items → home-decor, personal items → selfish, gift-worthy items → gifting)
- Return 2-4 items per category, prioritize most relevant

Return ONLY valid JSON:
{
  "styles": ["mid-century", "brass"],
  "moods": ["elegant"],
  "intents": ["home-decor", "gifting"]
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 200,
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim() || '{}';
    
    // Extract JSON from markdown code blocks if present
    const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || 
                      content.match(/(\{[\s\S]*\})/);
    
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[1]);
      return {
        styles: result.styles || [],
        moods: result.moods || [],
        intents: result.intents || []
      };
    }
  } catch (error) {
    console.error('Error categorizing attributes:', error);
  }

  // Fallback if AI categorization fails
  return {
    styles: attributes.slice(0, 3),
    moods: [],
    intents: []
  };
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
const categorized = await categorizeAttributes(
  visionData.attributes || [], 
  listing.title, 
  listing.description
);

const listingInsert = {
  seller_id: sellerId,
  title: userInput?.title || listing.title,
  description: userInput?.description || listing.description,
  // Save AI-generated content to separate columns
  ai_generated_title: visionData.suggestedTitle || listing.title || null,
  ai_generated_description: visionData.suggestedDescription || listing.description || null,
  price: userInput?.price || pricingIntelligence?.avgPrice || null,
  category: userInput?.category || visionData.category,
  original_image_url: originalUrl,
  clean_image_url: processedImageUrl !== originalUrl ? processedImageUrl : null,
  staged_image_url: null,
  status: 'draft',
  styles: categorized.styles || [],
  moods: categorized.moods || [],
  intents: categorized.intents || [],
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
  const prompt = `You are an expert at identifying and pricing secondhand items for resale on marketplaces like eBay, Poshmark, and ThriftShopper.

Analyze this image and provide:
1. A compelling, SEO-friendly title (max 80 characters) 
2. A detailed description (2-3 sentences highlighting key features, condition, and appeal)
3. The most appropriate category from: Kitchen & Dining, Home Decor, Collectibles, Books & Media, Furniture, Art, Electronics, Fashion, Jewelry, Toys & Games, Sports & Outdoors, General
4. 5 descriptive attributes/tags - BE SPECIFIC AND ACCURATE:
   - Only use "vintage" if the item is clearly from 1920s-1980s (not just old-looking)
   - Only use "antique" if pre-1920s
   - Avoid generic words like "charming", "beautiful", "nice" 
   - Focus on: materials, brands, specific styles, colors, patterns, era (if truly vintage)
   - Examples of GOOD tags: "brass", "art-deco", "mid-century", "ceramic", "floral-pattern"
   - Examples of BAD tags: "charming", "lovely", "vintage" (unless truly vintage)
5. An estimated resale price in USD based on typical secondhand marketplace prices

Return ONLY valid JSON in this exact format:
{
  "title": "Coach Leather Crossbody Bag Brown",
  "description": "Coach crossbody bag in rich brown leather. Features adjustable strap and brass hardware. Shows light wear consistent with use.",
  "category": "Fashion",
  "attributes": ["leather", "brass-hardware", "crossbody", "Coach", "brown"],
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

async function analyzeImage(imageUrl: string): Promise<{ category: string; attributes: string[]; brandInfo?: string }> {
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
            { type: 'WEB_DETECTION', maxResults: 10 },  // Like Google Lens!
          ],
        }],
      }),
    }
  );

  const data = await response.json();
  
  // Debug: Log the full response to see what we're getting
  console.log('📸 Google Vision API Response:', {
    hasLabels: !!data.responses?.[0]?.labelAnnotations,
    hasObjects: !!data.responses?.[0]?.localizedObjectAnnotations,
    hasWebDetection: !!data.responses?.[0]?.webDetection,
    webEntitiesCount: data.responses?.[0]?.webDetection?.webEntities?.length || 0,
    hasBestGuess: !!data.responses?.[0]?.webDetection?.bestGuessLabels
  });
  
  const labels = data.responses?.[0]?.labelAnnotations || [];
  const objects = data.responses?.[0]?.localizedObjectAnnotations || [];
  const webDetection = data.responses?.[0]?.webDetection || {};

  const allLabels = [
    ...labels.map((l: any) => ({ description: l.description, score: l.score })),
    ...objects.map((o: any) => ({ description: o.name, score: o.score })),
  ];

  // Extract brand info from web detection (like Google Lens!)
  let brandInfo = '';
  
  console.log('🌐 Web Detection Data:', {
    entities: webDetection.webEntities?.slice(0, 5),
    bestGuess: webDetection.bestGuessLabels?.[0]?.label,
    pagesWithMatching: webDetection.pagesWithMatchingImages?.length || 0
  });
  
  if (webDetection.webEntities) {
    // Web entities often contain brand names with high scores
    const brandEntities = webDetection.webEntities
      .filter((entity: any) => entity.score > 0.5)  // Lowered threshold from 0.6
      .map((entity: any) => entity.description)
      .slice(0, 5);  // Get more entities
    
    console.log('🏷️ Brand entities found:', brandEntities);
    
    if (brandEntities.length > 0) {
      brandInfo = brandEntities.join(', ');
      console.log('✅ Brand detection SUCCESS:', brandInfo);
    } else {
      console.log('❌ No brand entities with score > 0.5');
    }
  }

  // Also check best guess labels from web detection
  if (webDetection.bestGuessLabels && webDetection.bestGuessLabels.length > 0) {
    const bestGuess = webDetection.bestGuessLabels[0].label;
    console.log('🔍 Best guess from web:', bestGuess);
    if (bestGuess && !brandInfo.includes(bestGuess)) {
      brandInfo = brandInfo ? `${brandInfo}, ${bestGuess}` : bestGuess;
    }
  }
  
  if (!brandInfo) {
    console.log('⚠️ No brand info detected from web detection');
  }

  const category = inferCategory(allLabels);
  const attributes = allLabels
    .filter((l: any) => l.score > 0.7)
    .map((l: any) => l.description)
    .slice(0, 5);

  return { category, attributes, brandInfo };
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

IMPORTANT: 
- If a brand name is in the attributes (like "Guy Degrenne", "Coach", etc.), ALWAYS include it prominently in the title
- Brand names should be at the start or very early in the title for SEO

Generate a marketplace listing with:
1. A concise, SEO-friendly title (max 80 characters) - INCLUDE BRAND if detected
2. A compelling description (2-3 sentences)

Return ONLY valid JSON:
{
  "title": "your title here",
  "description": "your description here"
}

Example with brand:
- Attributes include "Guy Degrenne" → Title: "Guy Degrenne Silver-Plated Scalloped Serving Bowl"`;

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