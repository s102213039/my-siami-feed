# Siami Feed

即時資訊推送與 AI 對話牆。這個專案使用 Next.js App Router 與 Supabase，從 `posts` 讀取內容並透過 Supabase Realtime 在新增貼文時更新畫面。

## 功能

- 顯示最新貼文列表
- 顯示分類名稱、分類顏色、內容類型、建立日期與來源連結
- 從 Supabase `posts` 讀取資料，並關聯 `categories`
- 監聽 `posts` 的新增事件並即時刷新

## 環境變數

本機需提供：

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
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
