import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  if (!userId) return NextResponse.json(null);

  const sb = getSupabase();
  if (!sb) return NextResponse.json(null);

  try {
    const { data } = await sb
      .from('user_watchlists')
      .select('items')
      .eq('user_id', userId)
      .single();
    return NextResponse.json(data?.items ?? null);
  } catch {
    return NextResponse.json(null);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, items } = await req.json();
    if (!userId || !Array.isArray(items)) return NextResponse.json({ error: 'invalid' }, { status: 400 });

    const sb = getSupabase();
    if (!sb) return NextResponse.json({ error: 'supabase' }, { status: 500 });

    const { error } = await sb
      .from('user_watchlists')
      .upsert({ user_id: userId, items, updated_at: new Date().toISOString() });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
