import { NextRequest, NextResponse } from 'next/server';
import { fetchSanka } from '@/lib/sanka';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');
    if (!q || !q.trim()) {
      return NextResponse.json({ success: true, data: { animeList: [] } });
    }

    const data = await fetchSanka(`/search/${encodeURIComponent(q.trim())}`, 120);
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to search anime' },
      { status: 500 }
    );
  }
}
