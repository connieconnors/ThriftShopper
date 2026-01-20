import { NextRequest, NextResponse } from 'next/server';
import { getEbayPricing } from '@/lib/seller-upload-service';

type PricingRequestItem = {
  id: string;
  title: string;
};

export async function POST(request: NextRequest) {
  try {
    const { items, limit } = await request.json();

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'items is required' }, { status: 400 });
    }

    if (!process.env.EBAY_APP_ID) {
      return NextResponse.json({ error: 'eBay pricing not configured' }, { status: 503 });
    }

    const capped = items
      .filter((item: PricingRequestItem) => item?.id && item?.title)
      .slice(0, limit || 20);

    const results = await Promise.allSettled(
      capped.map(async (item: PricingRequestItem) => {
        const pricing = await getEbayPricing(item.title);
        return {
          id: item.id,
          title: item.title,
          pricing,
        };
      })
    );

    const payload = results
      .map((result) => (result.status === 'fulfilled' ? result.value : null))
      .filter(Boolean);

    console.log('💰 Pricing lookup count:', payload.length);

    return NextResponse.json({ pricing: payload });
  } catch (error) {
    console.error('Pricing API error:', error);
    return NextResponse.json(
      { error: 'Pricing lookup failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
