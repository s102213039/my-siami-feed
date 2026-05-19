import type { Post } from '@/lib/types';
import { generateText } from 'ai';
import { google } from '@ai-sdk/google';

interface ReplyInput {
  post: Pick<Post, 'title' | 'summary' | 'content' | 'source_url'>;
  comment: string;
  marketQuote?: MarketQuote;
}

interface MarketQuote {
  symbol: string;
  name: string;
  price: number;
  currency: string;
  previousClose?: number;
  marketState?: string;
  updatedAt?: string;
  sourceUrl: string;
}

export function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function wantsTsmcQuote(comment: string) {
  return /(台積電|台积电|TSMC|2330|TSM).*(股價|股价|價格|价格|多少|報價|报价|quote|price)|((股價|股价|價格|价格|報價|报价|quote|price).*(台積電|台积电|TSMC|2330|TSM))/i
    .test(comment);
}

function formatPrice(value?: number) {
  if (typeof value !== 'number') return '未知';
  return new Intl.NumberFormat('zh-TW', {
    maximumFractionDigits: 2,
  }).format(value);
}

function buildPrompt({ post, comment, marketQuote }: ReplyInput) {
  return [
    '請用繁體中文回答讀者在新聞留言區提出的問題。',
    '規則：',
    '1. 先判斷留言是否真的能從文章或提供的即時資料回答。',
    '2. 不要編造沒有來源的最新數字、股價、時間或人物說法。',
    '3. 若提供了即時行情資料，請清楚標示價格、幣別、更新時間與資料來源。',
    '4. 若問題超出文章與即時資料，請直接說需要更多資料來源，不要套模板。',
    '5. 回覆要像助理真的理解問題，避免「你提到...這點可以從...」這種罐頭句。',
    '',
    `文章標題：${post.title}`,
    `文章摘要：${post.summary}`,
    `文章內容：${post.content || '無'}`,
    `文章來源：${post.source_url || '無'}`,
    marketQuote
      ? `即時行情資料：${JSON.stringify(marketQuote)}`
      : '即時行情資料：無',
    `讀者留言：${comment}`,
  ].join('\n');
}

function buildNoAiConfiguredReply({ comment, marketQuote }: ReplyInput) {
  if (marketQuote) {
    const change = typeof marketQuote.previousClose === 'number'
      ? marketQuote.price - marketQuote.previousClose
      : undefined;
    const changeText = typeof change === 'number'
      ? `，較前收 ${change >= 0 ? '上漲' : '下跌'} ${formatPrice(Math.abs(change))}`
      : '';

    return [
      `你問的是台積電股價。根據 Yahoo Finance 的即時行情資料，${marketQuote.name}（${marketQuote.symbol}）目前約為 ${formatPrice(marketQuote.price)} ${marketQuote.currency}${changeText}。`,
      marketQuote.updatedAt
        ? `資料時間：${marketQuote.updatedAt}，市場狀態：${marketQuote.marketState || '未知'}。`
        : `市場狀態：${marketQuote.marketState || '未知'}。`,
      `來源：${marketQuote.sourceUrl}`,
      '目前站內尚未啟用真正的 AI 模型服務；這則回覆是用即時行情資料組成，沒有做更深入的財報、新聞或技術面分析。',
    ].join('\n\n');
  }

  return [
    '你抓到問題了：目前站內尚未啟用真正的 AI 模型或通用網路搜尋服務，所以我不能假裝自己已經思考或搜尋。',
    `這次留言是：「${normalizeWhitespace(comment).slice(0, 120)}」`,
    '若要讓 Siami AI 真正根據文章、留言與即時資料回答，需要設定 `GOOGLE_GENERATIVE_AI_API_KEY`，並另外接入搜尋/行情資料來源。否則我只能根據文章已收錄內容做有限回覆。',
  ].join('\n\n');
}

export async function fetchMarketQuote(comment: string): Promise<MarketQuote | undefined> {
  if (!wantsTsmcQuote(comment)) return undefined;

  const symbol = /TSM(?!C)|ADR/i.test(comment) ? 'TSM' : '2330.TW';
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=1d&interval=1m`;
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'SiamiFeed/1.0',
    },
    next: { revalidate: 60 },
  });

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
    return undefined;
  }

  return {
    symbol: meta.symbol || symbol,
    name: meta.shortName || (symbol === 'TSM' ? 'TSMC ADR' : '台積電'),
    price: meta.regularMarketPrice,
    currency: meta.currency || (symbol === 'TSM' ? 'USD' : 'TWD'),
    previousClose: meta.previousClose,
    marketState: meta.marketState,
    updatedAt: meta.regularMarketTime
      ? new Date(meta.regularMarketTime * 1000).toLocaleString('zh-TW', {
        timeZone: 'Asia/Taipei',
      })
      : undefined,
    sourceUrl: `https://finance.yahoo.com/quote/${symbol}`,
  };
}

async function generateWithGemini(input: ReplyInput) {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return undefined;
  }

  const result = await generateText({
    model: google(process.env.GEMINI_MODEL || 'gemini-2.5-flash'),
    system: '你是 Siami 的新聞與資料助理。請根據使用者問題、文章內容與提供的即時資料回答，避免編造。',
    prompt: buildPrompt(input),
    temperature: 0.2,
  });

  return result.text.trim();
}

export async function generateCommentReply(input: ReplyInput) {
  const geminiReply = await generateWithGemini(input).catch((error) => {
    console.error('Gemini reply generation failed:', error);
    return undefined;
  });

  if (geminiReply) return geminiReply;

  return buildNoAiConfiguredReply(input);
}
