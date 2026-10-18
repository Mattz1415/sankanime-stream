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
        { success: false, error: 'Server ID is required' },
        { status: 400 }
      );
    }

    const data = await fetchSanka(`/server/${id}`, 3600);
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch server stream' },
      { status: 500 }
    );
  }
}
