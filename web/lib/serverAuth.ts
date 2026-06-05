import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

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

export async function getCurrentUserId(request: Request): Promise<string | null> {
  let token = getAuthToken(request);
  if (!token) token = await getAuthTokenFromCookies();
  if (!token) return null;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) return null;

  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user?.id) return null;
  return user.id;
}

export function getServiceSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;
  if (!supabaseUrl || !serviceKey) return null;
  return createClient(supabaseUrl, serviceKey);
}
