import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { BUYER_EVENT_TYPES, type BuyerEventType } from '@/lib/buyerEvents';

export const dynamic = 'force-dynamic';

function getAuthToken(request: Request): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) return authHeader.replace('Bearer ', '');
  return null;
}

async function getAuthTokenFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  for (const cookie of cookieStore.getAll()) {
    if (!cookie.name.includes('supabase') && !cookie.name.includes('auth')) continue;
    try {
      const parsed = JSON.parse(cookie.value);
      if (parsed.access_token) return parsed.access_token;
    } catch {
      if (cookie.value.startsWith('eyJ')) return cookie.value;
    }
  }
  return null;
}

async function getCurrentUserId(request: Request): Promise<string | null> {
  let token = getAuthToken(request);
  if (!token) token = await getAuthTokenFromCookies();
  if (!token) return null;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    }
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user?.id) return null;
  return user.id;
}

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const eventType = body?.event_type as BuyerEventType;
    if (!eventType || !BUYER_EVENT_TYPES.includes(eventType)) {
      return NextResponse.json({ error: 'Invalid event_type' }, { status: 400 });
    }

    const listingId =
      typeof body?.listing_id === 'string' && body.listing_id.length > 0
        ? body.listing_id
        : null;
    const payload =
      body?.payload && typeof body.payload === 'object' && !Array.isArray(body.payload)
        ? body.payload
        : {};

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const { error: insertError } = await supabase.from('buyer_events').insert({
      user_id: userId,
      event_type: eventType,
      listing_id: listingId,
      payload,
    });

    if (insertError) {
      console.error('[buyer-events] insert failed:', insertError.message);
      return NextResponse.json(
        { error: 'Failed to record event', details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[buyer-events] unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
