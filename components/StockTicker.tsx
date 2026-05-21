import type { StockQuote } from '@/lib/market/stockQuotes';

interface StockTickerProps {
  quotes: StockQuote[];
  loading?: boolean;
  error?: string;
}

function formatNumber(value?: number, fractionDigits = 2) {
  if (typeof value !== 'number') return '--';

  return new Intl.NumberFormat('zh-TW', {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
  }).format(value);
}

function getStatusLabel(status: StockQuote['status']) {
  if (status === 'regular') return '盤中';
  if (status === 'prepost') return '盤前後';
  if (status === 'closed') return '收盤';
  return '狀態未知';
}

const ETF_SYMBOLS = new Set(['00403A.TW', '0050.TW']);

function getCardTitle(quote: StockQuote) {
  if (ETF_SYMBOLS.has(quote.symbol)) {
    return quote.symbol.replace(/\.TW$/i, '');
  }

  return quote.displayName;
}

export default function StockTicker({ quotes, loading, error }: StockTickerProps) {
  return (
    <section className="mb-6 rounded-2xl border border-[#2a201c] bg-[#14100f] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.25)]">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#ff7447]">
            Market Watch
          </p>
          <h2 className="mt-1 text-lg font-semibold text-zinc-50">
            即時股價
          </h2>
        </div>
        <p className="text-xs text-zinc-500">
          Yahoo Finance 免費行情，約每分鐘更新
        </p>
      </div>

      {error && (
        <p className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="grid grid-cols-5 gap-2">
        {loading && quotes.length === 0 ? (
          Array.from({ length: 5 }).map((_, index) => (
            <div
              key={`stock-placeholder-${index}`}
              className="h-28 animate-pulse rounded-xl border border-[#2a201c] bg-[#0d0a09]"
            />
          ))
        ) : (
          quotes.map((quote) => {
            const isUp = typeof quote.change === 'number' && quote.change >= 0;
            const accentClass = isUp ? 'text-red-300' : 'text-emerald-300';
            const changePrefix = isUp ? '+' : '';

            return (
              <a
                key={quote.symbol}
                href={quote.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-0 rounded-xl border border-[#2a201c] bg-[#0d0a09] p-2 transition hover:border-[#ff7447]/60 hover:bg-[#17110f]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-zinc-50">
                      {getCardTitle(quote)}
                    </p>
                    <p className="mt-0.5 text-[11px] text-zinc-600">
                      {quote.symbol}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full border border-[#2a201c] px-1.5 py-0.5 text-[10px] text-zinc-500">
                    {getStatusLabel(quote.status)}
                  </span>
                </div>

                {quote.error ? (
                  <p className="mt-4 text-xs leading-5 text-red-300">
                    讀取失敗，稍後重試
                  </p>
                ) : (
                  <>
                    <p className="mt-3 text-xl font-semibold text-zinc-50">
                      {formatNumber(quote.price)}
                    </p>
                    <p className={`mt-1 text-xs font-medium ${accentClass}`}>
                      {changePrefix}{formatNumber(quote.change)} / {changePrefix}{formatNumber(quote.changePercent)}%
                    </p>
                  </>
                )}
              </a>
            );
          })
        )}
      </div>
    </section>
  );
}
