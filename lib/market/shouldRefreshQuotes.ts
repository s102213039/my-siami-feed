import type { StockQuote } from '@/lib/market/stockQuotes';

function isTaiwanEquitySessionOpenNow(): boolean {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Taipei',
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  });
  const parts = formatter.formatToParts(new Date());
  const weekday = parts.find((part) => part.type === 'weekday')?.value;
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? NaN);
  const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? NaN);

  if (!weekday || Number.isNaN(hour) || Number.isNaN(minute)) {
    return false;
  }

  if (weekday === 'Sat' || weekday === 'Sun') {
    return false;
  }

  const minutesSinceMidnight = hour * 60 + minute;
  const sessionOpen = 9 * 60;
  const sessionClose = 13 * 60 + 30;

  return minutesSinceMidnight >= sessionOpen && minutesSinceMidnight < sessionClose;
}

export function shouldRefreshStockQuotes(quotes: StockQuote[]): boolean {
  if (quotes.some((quote) => quote.status === 'regular' || quote.status === 'prepost')) {
    return true;
  }

  if (quotes.length > 0 && quotes.every((quote) => quote.status === 'closed')) {
    return false;
  }

  return isTaiwanEquitySessionOpenNow();
}
