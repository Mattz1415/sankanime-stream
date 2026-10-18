import { NextRequest, NextResponse } from 'next/server';
import { fetchSanka } from '@/lib/sanka';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Anime ID is required' },
        { status: 400 }
      );
    }

    const data = await fetchSanka(`/anime/${id}`, 300);
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch anime detail' },
      { status: 500 }
    );
  }
}
