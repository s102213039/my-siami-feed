export type StockQuoteStatus = 'regular' | 'closed' | 'prepost' | 'unknown';

export interface StockQuote {
  symbol: string;
  name: string;
  displayName: string;
  price?: number;
  currency: string;
  previousClose?: number;
  change?: number;
  changePercent?: number;
  marketState: string;
  status: StockQuoteStatus;
  updatedAt?: string;
  sourceUrl: string;
  error?: string;
}

const STOCKS = [
  { symbol: '2330.TW', displayName: '台積電' },
  { symbol: '2603.TW', displayName: '長榮' },
  { symbol: '2615.TW', displayName: '萬海' },
  { symbol: '00403A.TW', displayName: '統一台灣高息動能' },
  { symbol: '0050.TW', displayName: '元大台灣50' },
] as const;

function getQuoteStatus(marketState?: string): StockQuoteStatus {
  if (!marketState) return 'closed';

  if (marketState === 'REGULAR') return 'regular';
  if (marketState === 'PRE' || marketState === 'POST' || marketState === 'PREPRE') {
    return 'prepost';
  }

  return 'closed';
}

function formatUpdatedAt(value?: number) {
  if (!value) return undefined;

  return new Date(value * 1000).toLocaleString('zh-TW', {
    timeZone: 'Asia/Taipei',
  });
}

async function fetchStockQuote(
  stock: typeof STOCKS[number]
): Promise<StockQuote> {
  const response = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${stock.symbol}?range=1d&interval=1m`,
    {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'SiamiFeed/1.0',
      },
      next: { revalidate: 60 },
    }
  );

  if (!response.ok) {
    throw new Error(`Yahoo Finance request failed: ${response.status}`);
  }

  const payload = await response.json() as {
    chart?: {
      result?: {
        meta?: {
          symbol?: string;
          shortName?: string;
          regularMarketPrice?: number;
          previousClose?: number;
          currency?: string;
          marketState?: string;
          regularMarketTime?: number;
        };
      }[];
    };
  };
  const meta = payload.chart?.result?.[0]?.meta;

  if (!meta?.regularMarketPrice) {
    throw new Error('Yahoo Finance response did not include a price');
  }

  const change = typeof meta.previousClose === 'number'
    ? meta.regularMarketPrice - meta.previousClose
    : undefined;
  const changePercent = typeof change === 'number' && meta.previousClose
    ? (change / meta.previousClose) * 100
    : undefined;

  return {
    symbol: meta.symbol || stock.symbol,
    name: meta.shortName || stock.displayName,
    displayName: stock.displayName,
    price: meta.regularMarketPrice,
    currency: meta.currency || 'TWD',
    previousClose: meta.previousClose,
    change,
    changePercent,
    marketState: meta.marketState || 'UNKNOWN',
    status: getQuoteStatus(meta.marketState),
    updatedAt: formatUpdatedAt(meta.regularMarketTime),
    sourceUrl: `https://finance.yahoo.com/quote/${stock.symbol}`,
  };
}

function buildErrorQuote(stock: typeof STOCKS[number], error: unknown): StockQuote {
  return {
    symbol: stock.symbol,
    name: stock.displayName,
    displayName: stock.displayName,
    currency: 'TWD',
    marketState: 'UNKNOWN',
    status: 'unknown',
    sourceUrl: `https://finance.yahoo.com/quote/${stock.symbol}`,
    error: error instanceof Error ? error.message : '股價讀取失敗',
  };
}

export async function fetchStockQuotes() {
  return Promise.all(
    STOCKS.map(async (stock) =>
      fetchStockQuote(stock).catch((error) => buildErrorQuote(stock, error))
    )
  );
}
