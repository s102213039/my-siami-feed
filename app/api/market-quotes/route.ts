import { NextResponse } from 'next/server';
import { fetchStockQuotes } from '@/lib/market/stockQuotes';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const quotes = await fetchStockQuotes();

    return NextResponse.json({
      quotes,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Market quote API failed:', error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : '股價讀取失敗' },
      { status: 500 }
    );
  }
}
