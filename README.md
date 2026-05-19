# Siami Feed

即時資訊推送與 AI 對話牆。這個專案使用 Next.js App Router 與 Supabase，從 `posts` 讀取內容並透過 Supabase Realtime 在新增貼文時更新畫面。

## 功能

- 顯示最新貼文列表
- 顯示分類名稱、分類顏色、內容類型、建立日期與來源連結
- 從 Supabase `posts` 讀取資料，並關聯 `categories`
- 監聽 `posts` 的新增事件並即時刷新
- 可搜尋新聞、依分類篩選、展開文章內容
- 可在文章下方留言，系統會根據文章與留言產生 Siami AI 回覆

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
AI_MODEL=openai/gpt-5.4 # 選填；搭配 Vercel AI Gateway 使用
OPENAI_API_KEY= # 選填；未設定 AI Gateway 時可用 OpenAI API 生成回覆
OPENAI_MODEL=gpt-5.4
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
