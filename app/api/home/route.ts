import { NextResponse } from 'next/server';
import { fetchSanka } from '@/lib/sanka';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await fetchSanka('/home', 300);
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch home data' },
      { status: 500 }
    );
  }
}
