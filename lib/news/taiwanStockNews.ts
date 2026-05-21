import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { XMLParser } from 'fast-xml-parser';
import { createServerSupabaseClient } from '@/lib/supabase';

type FeedSource = {
  name: string;
  url: string;
  baseUrl?: string;
  limit?: number;
  isHermesLegacy?: boolean;
};

type FeedItem = {
  sourceName: string;
  title: string;
  sourceUrl: string;
  rawContent: string;
  publishedAt?: string;
  score: number;
  isHermesLegacy?: boolean;
};

type PreparedPost = {
  title: string;
  summary: string;
  content: string;
  source_url: string;
};

type DigestResult = {
  inserted: number;
  skipped: number;
  candidates: number;
  dryRun: boolean;
  usedAi: boolean;
  hermesLegacyCandidates: number;
  warning?: string;
};

const MAX_NEWS_ITEMS = 15;
const MIN_TARGET_ITEMS = 5;
const FINANCE_CATEGORY_SLUG = 'finance';
const parser = new XMLParser({
  ignoreAttributes: false,
  parseTagValue: false,
  trimValues: true,
});

const SOURCES: FeedSource[] = [
  {
    name: 'Hermes Google News Finance',
    url: 'https://news.google.com/rss/search?q=finance&hl=zh-TW&gl=TW&ceid=TW:zh-Hant',
    limit: 10,
    isHermesLegacy: true,
  },
  {
    name: 'TWSE 證交所新聞',
    url: 'https://www.twse.com.tw/rwd/zh/news/feed?type=rss',
    baseUrl: 'https://www.twse.com.tw',
  },
  {
    name: 'Google News 台股重大新聞',
    url: `https://news.google.com/rss/search?q=${encodeURIComponent('台股 OR 台積電 OR 半導體 OR 航運 OR ETF OR 匯率 OR 利率 when:1d')}&hl=zh-TW&gl=TW&ceid=TW:zh-Hant`,
  },
];

const KEYWORD_WEIGHTS: Array<[RegExp, number]> = [
  [/股票|股市|股價|台股|臺股|加權指數|大盤|finance/i, 5],
  [/台積電|臺積電|TSMC|半導體|晶片|先進製程/i, 5],
  [/國際股市|美股|那斯達克|道瓊|標普|費半|日股|港股/i, 4],
  [/總經|通膨|CPI|PCE|非農|央行|Fed|聯準會|利率|降息|升息/i, 4],
  [/匯率|新台幣|美元|日圓|外資/i, 3],
  [/供應鏈|AI|伺服器|輝達|NVIDIA|蘋果|Apple/i, 3],
  [/航運|長榮|陽明|萬海|運價/i, 3],
  [/ETF|0050|高股息|債券/i, 3],
  [/上市|證交所|櫃買|重大訊息/i, 2],
];

function asArray<T>(value: T | T[] | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function stripHtml(value: string) {
  return normalizeWhitespace(
    value
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&#xD;/g, ' ')
  );
}

function getString(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function toAbsoluteUrl(link: string, baseUrl?: string) {
  if (!link) return '';
  try {
    return new URL(link, baseUrl).toString();
  } catch {
    return link;
  }
}

function scoreItem(title: string, content: string) {
  const searchable = `${title} ${content}`;
  return KEYWORD_WEIGHTS.reduce((score, [pattern, weight]) => {
    return pattern.test(searchable) ? score + weight : score;
  }, 0);
}

function parseFeed(xml: string, source: FeedSource): FeedItem[] {
  const parsed = parser.parse(xml) as {
    rss?: {
      channel?: {
        item?: unknown | unknown[];
      };
    };
  };

  return asArray(parsed.rss?.channel?.item)
    .map((item) => item as Record<string, unknown>)
    .map((item) => {
      const title = stripHtml(getString(item.title));
      const rawContent = stripHtml(
        getString(item['content:encoded']) || getString(item.description)
      );
      const sourceUrl = toAbsoluteUrl(
        getString(item.link) || getString(item.guid),
        source.baseUrl
      );
      const publishedAt = getString(item.pubDate) || getString(item['dc:date']);

      return {
        sourceName: source.name,
        title,
        sourceUrl,
        rawContent,
        publishedAt,
        score: scoreItem(title, rawContent),
        isHermesLegacy: source.isHermesLegacy,
      };
    })
    .filter((item) =>
      item.title && item.sourceUrl && (item.isHermesLegacy || item.score > 0)
    );
}

async function fetchFeed(source: FeedSource) {
  const response = await fetch(source.url, {
    headers: {
      Accept: 'application/rss+xml, application/xml, text/xml',
      'User-Agent': 'SiamiFeed/1.0',
    },
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new Error(`${source.name} RSS request failed: ${response.status}`);
  }

  return parseFeed(await response.text(), source).slice(0, source.limit);
}

async function collectCandidates() {
  const settled = await Promise.allSettled(SOURCES.map(fetchFeed));
  const items = settled.flatMap((result) => {
    if (result.status === 'fulfilled') return result.value;

    console.error('News source failed:', result.reason);
    return [];
  });
  const seen = new Set<string>();

  const deduped = items.filter((item) => {
    const key = item.sourceUrl || item.title;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const hermesLegacyItems = deduped
    .filter((item) => item.isHermesLegacy)
    .slice(0, 10);
  const marketItems = deduped
    .filter((item) => !item.isHermesLegacy)
    .sort((a, b) => b.score - a.score);

  return [...hermesLegacyItems, ...marketItems].slice(0, MAX_NEWS_ITEMS);
}

function buildFallbackPost(item: FeedItem): PreparedPost {
  const summary = item.rawContent.slice(0, 160) || item.title;
  const content = [
    `來源：${item.sourceName}`,
    item.publishedAt ? `發布時間：${item.publishedAt}` : undefined,
    item.rawContent || '此來源未提供完整內文，請點擊來源閱讀更多。',
  ]
    .filter(Boolean)
    .join('\n\n');

  return {
    title: item.title.slice(0, 120),
    summary,
    content,
    source_url: item.sourceUrl,
  };
}

async function buildGeminiPosts(items: FeedItem[]) {
  if (
    process.env.NEWS_DIGEST_USE_AI !== 'true'
    || !process.env.GOOGLE_GENERATIVE_AI_API_KEY
    || items.length === 0
  ) {
    return undefined;
  }

  const result = await generateText({
    model: google(process.env.GEMINI_MODEL || 'gemini-2.5-flash'),
    system: '你是 Siami Feed 的台股新聞編輯，請只根據提供的 RSS 資料整理，不要編造來源沒有的事實。',
    prompt: [
      '請把下列台股相關新聞整理成 JSON array。',
      '每個項目必須包含 title、summary、content、source_url。',
      '規則：title 使用繁體中文且不超過 60 字；summary 不超過 90 字；content 用 2-4 句說明為何可能影響台股；source_url 必須沿用原始 URL。',
      '只輸出 JSON，不要 Markdown。',
      JSON.stringify(items.map((item) => ({
        title: item.title,
        source: item.sourceName,
        source_url: item.sourceUrl,
        published_at: item.publishedAt,
        content: item.rawContent.slice(0, 1200),
      }))),
    ].join('\n\n'),
    temperature: 0.2,
  });

  const json = result.text.replace(/^```json|```$/g, '').trim();
  const parsed = JSON.parse(json) as PreparedPost[];

  return parsed
    .filter((item) => item.title && item.summary && item.content && item.source_url)
    .slice(0, MAX_NEWS_ITEMS);
}

async function getFinanceCategoryId() {
  const supabase = createServerSupabaseClient();
  const { data: category, error } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', FINANCE_CATEGORY_SLUG)
    .single();

  if (error || !category) {
    throw new Error(error?.message || 'Finance category not found');
  }

  return category.id as string;
}

async function filterExisting(posts: PreparedPost[]) {
  if (posts.length === 0) return [];

  const supabase = createServerSupabaseClient();
  const urls = posts.map((post) => post.source_url);
  const titles = posts.map((post) => post.title);
  const { data: sameUrl } = await supabase
    .from('posts')
    .select('source_url')
    .in('source_url', urls);
  const { data: sameTitle } = await supabase
    .from('posts')
    .select('title')
    .in('title', titles);
  const existingUrls = new Set((sameUrl ?? []).map((post) => post.source_url));
  const existingTitles = new Set((sameTitle ?? []).map((post) => post.title));

  return posts.filter((post) =>
    !existingUrls.has(post.source_url) && !existingTitles.has(post.title)
  );
}

export async function runTaiwanStockNewsDigest(dryRun = false): Promise<DigestResult> {
  const candidates = await collectCandidates();
  const aiPosts = await buildGeminiPosts(candidates).catch((error) => {
    console.error('Gemini news digest failed:', error);
    return undefined;
  });
  const prepared = aiPosts ?? candidates.map(buildFallbackPost);
  const newPosts = await filterExisting(prepared);
  const limitedPosts = newPosts.slice(0, MAX_NEWS_ITEMS);

  if (!dryRun && limitedPosts.length > 0) {
    const categoryId = await getFinanceCategoryId();
    const supabase = createServerSupabaseClient();
    const { error } = await supabase.from('posts').insert(
      limitedPosts.map((post) => ({
        category_id: categoryId,
        type: 'news',
        title: post.title,
        summary: post.summary,
        content: post.content,
        source_url: post.source_url,
      }))
    );

    if (error) throw new Error(error.message);
  }

  return {
    inserted: dryRun ? 0 : limitedPosts.length,
    skipped: prepared.length - limitedPosts.length,
    candidates: candidates.length,
    dryRun,
    usedAi: Boolean(aiPosts),
    hermesLegacyCandidates: candidates.filter((item) => item.isHermesLegacy).length,
    warning: candidates.length < MIN_TARGET_ITEMS
      ? `目前來源只取得 ${candidates.length} 則候選新聞，低於目標 ${MIN_TARGET_ITEMS} 則。`
      : undefined,
  };
}
