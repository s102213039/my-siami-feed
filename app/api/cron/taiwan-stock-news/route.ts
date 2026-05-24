import { NextResponse } from 'next/server';
import { runTaiwanStockNewsDigest } from '@/lib/news/taiwanStockNews';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function isAuthorized(request: Request) {
  // Vercel Cron 排程會帶此 header；手動觸發可改用 Authorization: Bearer <CRON_SECRET>
  if (request.headers.get('x-vercel-cron') === '1') {
    return true;
  }

  const secret = process.env.CRON_SECRET?.trim();

  if (!secret) {
    return process.env.NODE_ENV !== 'production';
  }

  const authorization = request.headers.get('authorization')?.trim();
  return authorization === `Bearer ${secret}` || authorization === secret;
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
