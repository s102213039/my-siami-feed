# Siami Feed

即時資訊推送與 AI 對話牆。這個專案使用 Next.js App Router 與 Supabase，從 `posts` 讀取內容並透過 Supabase Realtime 在新增貼文時更新畫面。

## 功能

- 顯示最新貼文列表
- 顯示分類名稱、分類顏色、內容類型、建立日期與來源連結
- 從 Supabase `posts` 讀取資料，並關聯 `categories`
- 監聽 `posts` 的新增事件並即時刷新
- 可搜尋新聞、依分類篩選、展開文章內容
- 可在文章下方留言，系統會根據文章與留言產生 Siami AI 回覆
- 可由 Vercel Cron 每天台灣時間 08:55 抓取台股相關 RSS 新聞並寫入 feed
- 提供 `/api/cron/fetch-news` 相容端點，方便 Hermes agent cron job 呼叫同一套新聞整合流程

## 資料庫

留言功能需要 `comments` 表。若 Supabase 尚未套用，請執行：

```bash
supabase db push
```

或在 Supabase SQL Editor 套用 `supabase/migrations/20260519160000_add_comments.sql`。

## 環境變數

本機需提供：

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY= # 選填；提供後 API 可在 RLS 較嚴格時寫入留言
GOOGLE_GENERATIVE_AI_API_KEY= # 選填；只使用 Google Gemini API，不使用 Vercel AI Gateway
GEMINI_MODEL=gemini-2.5-flash # 選填；請使用 Google AI Studio 顯示在 Free tier 可用的模型
NEWS_DIGEST_USE_AI=false # 選填；設為 true 才會讓每日新聞抓取使用 Gemini 整理
CRON_SECRET= # production 必填；用來保護每日新聞抓取端點
```

不要提交 `.env*` 檔案或任何憑證。

## 開發

```bash
npm install
npm run dev
```

打開 [http://localhost:3000](http://localhost:3000) 查看網站。

## 驗證

```bash
npm run lint
npm run build
```

## 部署

建議部署到 Vercel，並在 Vercel Project Environment Variables 設定 Supabase 相關變數。

新聞 Cron 已移植 Hermes 原本的 Google News `finance` RSS 來源：每天會抓 Top 10 金融/股市新聞並寫入網站 feed。Telegram 通知仍交由 Hermes agent 原本流程處理，本站不需要設定 Telegram token。

若 Hermes agent 要手動觸發同一套新聞整合流程，請讓它呼叫：

```bash
GET https://my-siami-feed.vercel.app/api/cron/fetch-news
Authorization: Bearer <CRON_SECRET>
```
