import { NextResponse } from 'next/server';
import { runTaiwanStockNewsDigest } from '@/lib/news/taiwanStockNews';

export const dynamic = 'force-dynamic';

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return process.env.NODE_ENV !== 'production';
  }

  return request.headers.get('authorization') === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: 'Unauthorized cron request or missing CRON_SECRET.' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const dryRun = searchParams.get('dryRun') === '1';

  try {
    const result = await runTaiwanStockNewsDigest(dryRun);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Taiwan stock news cron failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Cron failed' },
      { status: 500 }
    );
  }
}
