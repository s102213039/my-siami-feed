# My Siami Feed - Cursor 開發規格書

最後更新：2026-08-25

## 1. 專案基本資訊與現狀

- 專案名稱：My Siami Feed
- 線上預覽：https://my-siami-feed.vercel.app/
- 當前進度：約 55%
- 專案角色分工：
  - PM / 需求提出：Yanli
  - 開發執行：Cursor Agent
- 開發原則：核心基礎架構與基本畫面已完成，後續以增量開發為主，請勿任意重構現有穩定功能。

### 技術棧

- 前端框架：Next.js 16 App Router、React 19、TypeScript
- 樣式工具：Tailwind CSS 4、自製元件、lucide-react icons
- 狀態管理：React hooks（`useState`、`useEffect`、`useMemo`、`useCallback`）
- 資料庫與即時資料：Supabase Database、Supabase Realtime
- AI 回覆：Vercel AI SDK + `@ai-sdk/google`，只允許直接呼叫 Google Gemini API，不使用 Vercel AI Gateway、不使用 OpenAI
- 股價資料：目前已有 Yahoo Finance chart endpoint 作為免費行情資料來源雛形
- 部署平台：Vercel production deployment，GitHub main branch push 觸發部署

### 目前主要檔案

- `app/page.tsx`：首頁 feed、今日/歷史切換、搜尋、分類、展開討論、留言表單
- `app/api/comments/route.ts`：留言讀取與建立 API
- `app/api/cron/taiwan-stock-news/route.ts`：每日台股新聞 Cron（支援 `x-vercel-cron` 與 `CRON_SECRET`）
- `app/api/cron/fetch-news/route.ts`：Hermes 相容手動觸發端點
- `app/api/market-quotes/route.ts`：股價行情 API
- `components/PostCard.tsx`：文章卡片與展開區塊（含 `detail` 簡短總結展示）
- `components/NewsArchiveSidebar.tsx`：左側依日期瀏覽歷史新聞（桌面版 sticky；手機版待改 drawer）
- `components/StockTicker.tsx`：五檔即時股價列
- `lib/supabase.ts`：Supabase client
- `lib/ai/commentReply.ts`：Gemini / 行情資料 / fallback 回覆邏輯
- `lib/news/taiwanStockNews.ts`：RSS 收集、去重、寫入 posts
- `lib/market/stockQuotes.ts`、`lib/market/shouldRefreshQuotes.ts`：股價與刷新策略
- `lib/dates/taipei.ts`：台灣時區日期分組
- `lib/types.ts`：共用型別
- `supabase/migrations/20260519160000_add_comments.sql`：comments 表相容 migration
- `supabase/migrations/20260523120000_add_posts_detail.sql`：posts.detail 欄位
- `vercel.json`：Cron 排程（UTC 00:55 = 台灣 08:55）

## 2. 核心設計架構與規則

### 程式碼風格

- 保持簡潔、模組化的元件設計。
- 禁止引入不必要的第三方套件。
- 優先使用既有工具：Next.js、React、Tailwind、Supabase、Vercel、Google Gemini API。
- 不要為了小功能建立過度抽象。
- UI 目前以黑色主題、白字、橘色重點為主，參考 `siami.tw` 的視覺方向。

### 檔案組織

- 元件放在 `components/`。
- 頁面放在 `app/`。
- API routes 放在 `app/api/`。
- 共用工具與型別放在 `lib/`。
- Supabase schema / migration 放在 `supabase/migrations/`。

### 權限與安全邊界

Cursor Agent 幾乎可以操作專案內程式碼與一般部署流程，但以下事項需要特別小心：

- 不可提交 `.env*`、API key、token、credential。
- 涉及 Supabase schema、資料刪除、RLS policy、production migration 時，必須先說明目的與風險。
- 涉及 Vercel environment variables、domain、billing、team/project 高權限設定時，必須先確認。
- 只允許 Google Gemini API 作為 AI provider；不要重新接回 Vercel AI Gateway 或 OpenAI，除非 PM 明確改需求。
- 若 Google Gemini API key 不存在或呼叫失敗，必須清楚告知 AI 未啟用，不可回傳假裝 AI 思考過的罐頭答案。

### 防壞機制

每次任務開始前：

1. 執行專案 git preflight：
   - `git fetch origin`
   - `git status --short`
   - `git status -sb`
   - `git rev-parse HEAD`
   - `git rev-parse @{u}`
2. 只有工作樹乾淨且本地 `HEAD` 等於 upstream 時才開始修改。
3. 修改任何檔案前，先理解該檔案與其他元件的依賴關係。

每次任務完成後：

- 程式碼變更至少執行：
  - `npm run lint`
  - `npm run build`
- 若有 UI / API / DB 行為變更，需要做對應功能測試。
- 完成一個任務階段後，commit 並 push 到 GitHub。

## 3. 當前功能清單與狀態

### 已完成

- [x] 環境建置與 Vercel 部署
- [x] Next.js App Router 基礎架構
- [x] 黑色主題首頁 UI
- [x] Supabase `posts` / `categories` 讀取
- [x] Supabase Realtime 監聽新貼文
- [x] 文章搜尋
- [x] 分類篩選
- [x] 文章卡片與展開討論區
- [x] 留言建立與讀取 API
- [x] Supabase `comments` 相容 migration
- [x] 留言後產生 Siami AI 回覆
- [x] 只使用 Google Gemini API，不使用 Vercel AI Gateway / OpenAI
- [x] 台積電股價問題可抓取 Yahoo Finance 行情資料
- [x] 基礎 README
- [x] 專案專屬 git sync workflow rule / skill
- [x] 主畫面預設今日新聞，左側歷史日期列表瀏覽舊文
- [x] `posts.detail` 欄位：保存並展示每則新聞的簡短總結（非 RSS 原文堆砌）
- [x] Vercel Cron 以 `x-vercel-cron` header 觸發新聞抓取（無需 Bearer token）

### 未完成 / 待調整

- [ ] **手機版 RWD（最高優先）**：`NewsArchiveSidebar` 在小螢幕改為 drawer / 底部 sheet，避免歷史列表擠壓主 feed
- [ ] 頁面細節優化：資訊密度、文章列表視覺層次
- [x] 展開討論筆數：列表初始狀態應直接顯示實際留言數，而不是打開後才更新
- [x] 即時股價展示元件
- [x] 每日上午 08:55（台灣時間）自動抓取台股相關重大新聞
- [x] 新聞資料來源策略與去重策略
- [ ] 新聞分類自動化（建議先用關鍵字規則，避免 Gemini 費用）
- [ ] Cron 健康檢查：production `dryRun=1` 驗證與 Vercel runtime logs 確認
- [ ] AI 回覆品質提升：需要更多文章上下文、可引用來源、避免只根據單篇短內容回答
- [ ] 測試策略：為 `lib/dates/taipei.ts`、`shouldRefreshQuotes`、新聞去重補最小單元測試
- [ ] 歷史瀏覽視圖：搜尋/分類篩選與 archive 模式整合

### 可以碰的範圍

- 一般前端 UI、元件、API route、資料讀取、留言功能、AI 回覆策略、Supabase migration、Vercel deployment 都可以由 Cursor Agent 處理。

### 需要先確認的範圍

- API key / secret 設定
- Supabase production schema 高風險更動
- Supabase 資料批量刪除或不可逆 migration
- Vercel billing、domain、team 權限、環境變數刪除
- 任何可能產生額外費用的第三方 API

## 4. 本次需求與待開發清單

> Cursor Agent 必讀規則：每次開始任何新任務前，都必須先閱讀本節，確認「已知 Bug 修復」與「待開發功能」兩個清單的狀態。每次完成任務後，必須回到本節更新項目狀態，並同步更新第 6 節開發日誌。

### 狀態標記規則

- `[todo]`：尚未開始。
- `[doing]`：正在開發或驗證中。
- `[blocked]`：被權限、金鑰、外部服務、資料不明等因素卡住。
- `[done]`：已完成、已驗證、已部署或明確不需部署。

### 每次任務檢查流程

1. 任務開始前：逐項檢查「已知 Bug 修復」與「待開發功能」，判斷本次任務是否涉及其中任何項目。
2. 任務進行中：若開始處理某項，將狀態改為 `[doing]`。
3. 任務完成後：只有符合第 5 節 Definition of Done，才可改為 `[done]`。
4. 若無法完成：改為 `[blocked]`，並寫明卡住原因與下一步需要 PM 提供什麼。
5. 每次回覆 PM 時：簡短說明本次有更新哪些第 4 點項目。

### 已知 Bug 修復

1. `[done]` 展開討論筆數問題
   - 現象：網站初始載入時，有留言的貼文仍顯示 `(0)`。
   - 現況：只有使用者打開討論後，該貼文留言數才會變正確。
   - 目標：文章列表初始載入時就顯示實際留言數。
   - 可能實作方向：
     - 查詢 `comments` 時預載各 post 的 count。
     - 或新增 Supabase view / RPC 提供 `post_id -> comment_count`。
     - 避免 N+1 query。

### 待開發功能

1. `[done]` 台股重大新聞自動抓取
   - 執行時間：每天台灣時間 08:55。
   - 目標內容：台灣股票相關重大新聞，優先國際股市、國際總經、供應鏈、半導體、航運、ETF、匯率、利率等會影響台股的新聞。
   - 數量：最少 5 條，最多 15 條。
   - 需要能力：
     - 定時任務：可用 Vercel Cron 或其他 scheduler。
     - 新聞來源：需挑選免費或不會額外收費的來源。
     - 去重：避免同一新聞重複寫入。
     - 分類：寫入 `categories`，必要時新增分類。
     - AI 整理：可用 Gemini 將新聞整理成標題、摘要、內容、來源。
   - 注意：任何可能產生 API 費用的新聞搜尋服務必須先確認。
   - 本 repo 已完成的安全部分：
     - 新增 Vercel Cron route：`/api/cron/taiwan-stock-news`。
     - 排程設定為每天 UTC 00:55，也就是台灣時間 08:55。
     - 使用免費 RSS 來源：TWSE 官方 RSS 與 Google News RSS 搜尋。
     - 寫入既有 `posts`，分類使用既有 `finance` category。
     - 以 `source_url` 與 `title` 去重，避免與 Hermes 或其他流程已寫入的新聞重複。
     - Gemini 新聞整理預設關閉；只有 `NEWS_DIGEST_USE_AI=true` 才會使用，避免非預期 API 用量。
   - Hermes 整合方式：
     - 已找到 Hermes 既有腳本 `/Users/yanli/stock_news_bot.py` 的實際行為：抓 Google News `finance` RSS Top 10，發送「今日金融/股市新聞摘要 (Top 10)」到 Telegram。
     - 已將新聞來源行為移植到本專案新聞 Cron：保留 Google News `finance` RSS Top 10 並寫入網站 `posts`。
     - Telegram 通知仍由 Hermes agent 原本流程處理，`my-siami-feed` 不需要設定 Telegram token。
     - 已新增相容端點 `/api/cron/fetch-news`，也可用 `Authorization: Bearer <CRON_SECRET>` 手動觸發同一套新聞整合流程。
   - 完成狀態：
     - PM 已在 Vercel 設定 `CRON_SECRET`。
     - 每日新聞 Cron 可專注寫入網站 feed；Telegram 通知不屬於本站責任範圍。

2. `[done]` 即時股價展示
   - 目標：透過免費行情資料來源抓取即時或非開盤時間的收盤價。
   - 初始標的：
     - `2330.TW` 台積電
     - `2603.TW` 長榮
     - `2615.TW` 萬海
     - `00403A.TW` 統一台灣高息動能
     - `0050.TW` 元大台灣50
   - 初步資料源：Yahoo Finance chart endpoint（免費但非正式保證 API）。
   - 需要能力：
     - 股票清單設定
     - 價格、漲跌、時間、交易狀態
     - RWD 股價卡片或列表
     - 錯誤與 rate limit fallback
   - 完成狀態：
     - 新增 `/api/market-quotes`，由 server 端統一呼叫 Yahoo Finance chart endpoint。
     - 首頁標題下方、搜尋區上方新增五檔股價卡片。
     - 已確認五個 Yahoo symbol 都可讀取，其中萬海為 `2615.TW`、`00403A` 使用 `00403A.TW`。
     - 已驗證本地 API、頁面位置、`npm run lint`、`npm run build`。

3. `[done]` 今日新聞 / 歷史新聞雙模式
   - 主畫面預設只顯示「今日」（台灣時區）新聞。
   - 左側 `NewsArchiveSidebar` 依日期分組，可點選歷史文章進入 archive 詳情視圖。
   - 點標題「Siami Feed」回到今日；盤中會一併刷新股價。
   - 相關檔案：`app/page.tsx`、`components/NewsArchiveSidebar.tsx`、`lib/dates/taipei.ts`。

4. `[done]` `posts.detail` 簡短總結
   - migration 新增 `posts.detail` text 欄位。
   - Cron 寫入時產生「為何可能影響台股」的簡短總結，非 RSS 原文全文。
   - `PostCard` 預設展示 `detail`；`content` 保留較長 insight。
   - AI 回覆 prompt 已納入 `detail` 上下文。

5. `[done]` Vercel Cron 授權修正
   - `/api/cron/taiwan-stock-news` 與 `/api/cron/fetch-news` 接受 `x-vercel-cron: 1`。
   - 手動觸發仍可用 `Authorization: Bearer <CRON_SECRET>` 或 `dryRun=1`（非 production）。

6. `[todo]` 手機版歷史新聞 drawer（**今日最高優先，已 pending 約 68 天**）
   - 現象：`NewsArchiveSidebar` 在手機上全寬堆疊於主 feed 上方，佔用大量垂直空間；`StockTicker` 固定五欄在小螢幕過於擁擠。
   - 目標：`< lg` breakpoint 改為浮動按鈕 + drawer/sheet；`lg+` 維持現有左側 sticky；股價列改為可橫向捲動或 2×2 格線。
   - DoD：手機與桌面皆通過第 5 節 RWD 要求，`npm run lint` / `npm run build` 通過。

7. `[todo]` Cron 健康檢查
   - 對 production 執行 `?dryRun=1`，確認 `candidates` 數量合理。
   - 查 Vercel Cron 執行紀錄與 runtime error logs。
   - 確認每日 08:55 後 feed 有新文章寫入。

8. `[todo]` 新聞關鍵字分類
   - 依標題/摘要關鍵字映射到既有 `categories`（半導體、航運、匯率等）。
   - 預設不用 Gemini，避免 API 費用。

9. `[todo]` AI 回覆品質
   - 擴充 `commentReply.ts` 上下文：同日主題、來源 URL、相關股價。
   - 回覆需標明資訊來源或不確定處。

10. `[todo]` 最小單元測試
    - 優先：`lib/dates/taipei.ts`、`lib/market/shouldRefreshQuotes.ts`、新聞去重邏輯。
    - 不需先上 e2e 框架。

## 5. 完成定義（Definition of Done）

每個功能或 bug 修復完成時，必須滿足：

1. 本地可以順利執行 `npm run build`，不可有 Error。
2. 程式碼需通過 `npm run lint`。
3. 元件具備 RWD，手機版與桌面版不可明顯跑版。
4. 若涉及 API，需實測成功與失敗路徑。
5. 若涉及 Supabase，需確認 migration / query 不破壞既有資料。
6. 若涉及 Vercel production，需確認 deployment `READY` 並查看 runtime error logs。
7. 測試資料需刪除，避免污染 production。
8. 完成後更新本文件的開發日誌。

## 6. 開發日誌

### 2026-05-20

- 建立 `CURSOR_SPEC.md` 作為後續 PM 與 Cursor Agent 溝通規格文件。
- 更新第 4 點任務看板規則：每次任務都必須檢查 Bug 修復清單與待開發功能清單，並在完成後更新狀態與開發日誌。
- 填入目前技術棧：
  - Next.js 16 App Router
  - React 19
  - TypeScript
  - Tailwind CSS 4
  - Supabase Database / Realtime
  - Vercel deployment
  - Google Gemini API via `@ai-sdk/google`
- 明確記錄 AI provider 規則：
  - 只允許 Google Gemini API。
  - 不使用 Vercel AI Gateway。
  - 不使用 OpenAI。
- 記錄下一階段重點：
  - 修復留言數初始顯示錯誤。
  - 建立台股重大新聞每日 08:55 自動抓取流程。
  - 建立即時股價展示功能。
- 修復展開討論筆數初始顯示錯誤：
  - 首頁載入時一次讀取 `comments.post_id` 並彙總各文章留言數。
  - 未展開文章收到 Realtime 新留言時只更新留言數，避免把單筆新留言誤當成完整留言列表。
  - 已驗證 `npm run lint`、`npm run build`，本地頁面可直接顯示 `展開討論 (5)`。

### 2026-05-21

- 實作台股重大新聞自動抓取在本 repo 可安全完成的部分：
  - 新增 `lib/news/taiwanStockNews.ts`，從免費 RSS 來源收集台股相關新聞候選。
  - 新增 `/api/cron/taiwan-stock-news`，支援 `dryRun=1` 測試且不寫入資料。
  - 新增 `vercel.json` Cron 設定，每天台灣時間 08:55 觸發。
  - 寫入共用 `posts` / `categories` 模型，分類使用既有 `finance`，以 `source_url` / `title` 避免和 Hermes 或其他流程重複。
  - 因 repo 內沒有 Hermes agent cron job 相關程式或設定，Hermes 外部整合細節暫列 blocker。
  - 因 production Cron endpoint 需 `CRON_SECRET` 保護，待 PM 確認或設定 Vercel 環境變數後才能標記完成。
  - 已驗證 `npm run lint`、`npm run build`、本機 dry run 回傳 `candidates: 15` 且 `usedAi: false`。
- 補上 Hermes agent cron job 相容整合點：
  - PM 已在 Vercel 設定 `CRON_SECRET`。
  - 新增 `/api/cron/fetch-news`，讓 Hermes 可呼叫同一套新聞整合流程。
  - 已驗證 `npm run lint`、`npm run build`，本機 `/api/cron/fetch-news?dryRun=1` 回傳 `candidates: 15` 且 `usedAi: false`。
  - Hermes 提供的是建議路徑，不是實際 `scripts/stock_news_scraper.py` 檔案；若要修改 Hermes Python 腳本本身，仍需取得實際檔案或 repo。
- 依 PM 修正，改為移植 Hermes 既有 cron job 行為本身：
  - 找到 `/Users/yanli/stock_news_bot.py`，其實際行為是 Google News `finance` RSS Top 10 + Telegram 通知。
  - 將 `finance` RSS Top 10 併入 `lib/news/taiwanStockNews.ts`，並優先納入每日網站 feed 寫入候選。
  - 已驗證 `npm run lint`、`npm run build`、本機 `/api/cron/fetch-news?dryRun=1` 回傳 `hermesLegacyCandidates: 10`。
  - PM 確認 Telegram 通知仍交由 Hermes agent 處理，`my-siami-feed` 只負責網站 feed；因此移除本站 Telegram 發送邏輯與相關環境變數需求。
- 完成即時股價展示：
  - 新增 `lib/market/stockQuotes.ts` 與 `/api/market-quotes`，以免費 Yahoo Finance chart endpoint 讀取五檔股價。
  - 新增首頁 `StockTicker` 區塊，位置在網站名稱下方、搜尋區上方，顯示價格、漲跌、漲跌幅、更新時間與盤中/收盤狀態。
  - 初始標的為 `2330.TW`、`2603.TW`、`2615.TW`、`00403A.TW`、`0050.TW`。
  - 已驗證本機 `/api/market-quotes` 成功回傳五檔資料，瀏覽器確認 UI 位置正確，`npm run lint` 與 `npm run build` 通過。
- 依 PM 回饋調整即時股價展示：
  - 五檔股價卡片改為同一列五欄顯示，不再在桌面寬度下換成兩行。
  - 縮小卡片間距、內距與價格字級，避免第五檔股票被裁切。
  - 已驗證本地瀏覽器畫面、`npm run lint` 與 `npm run build` 通過。
- 依 PM 回饋微調股價卡片：
  - 移除卡片下方更新時間。
  - ETF（`0050`、`00403A`）主標題改顯示不含 `.TW` 的代號；名稱下方仍保留完整代號列。

### 2026-05-24 至 2026-05-27

- 主畫面預設今日新聞並加入左側歷史日期列表（`NewsArchiveSidebar` + `lib/dates/taipei.ts`）。
- 新聞卡片預設顯示文章正文；後續改為 `posts.detail` 保存 RSS/來源內文。
- migration `20260523120000_add_posts_detail.sql` 新增 `detail` 欄位。
- 修正 Vercel Cron：允許 `x-vercel-cron` header 觸發，解決排程 401 問題。
- `detail` 語意調整：改為每則新聞的簡短總結（影響台股的原因），由 `lib/news/taiwanStockNews.ts` 產生。
- 最後功能 commit：`9489ff8`（2026-05-27）。此後至 2026-06-17 無新功能 commit。

### 2026-06-13 至 2026-06-17（規格同步期）

- 自動化 agent 多次執行規格書狀態盤點，確認進度約 55%。
- 盤點結果：5/27 後程式碼凍結，但 `CURSOR_SPEC.md` 仍停在 5/21，與實際功能脫節。
- 確認下一階段最高優先：**手機版 `NewsArchiveSidebar` drawer**（當時已 pending 約 4 天）。
- 6/17：完成工作分支規格對齊規劃；待 6/18 正式寫入本文件並 commit。

### 2026-06-18

- 同步更新本規格書至實際程式狀態（進度 55%、檔案清單、待辦優先序）。
- **今日建議執行順序**：
  1. 實作手機版歷史新聞 drawer（解開最大 UX blocker）。
  2. production Cron `dryRun=1` 健康檢查 + Vercel logs。
  3. 關鍵字新聞分類（低成本、可立即改善篩選）。
  4. AI 回覆上下文擴充。
  5. 補最小單元測試。
- 本日自動化任務：產出昨日回顧與今日計劃，並即時更新本 md。
- **執行結果**：僅完成規格書同步（commit `948e28a` 於工作分支），**未開始任何功能程式碼**；手機版 drawer 仍為 `[todo]`。

### 2026-06-19

- 自動化 cron 回顧 6/18 工作：規格書已對齊至 55% 進度，但 main 仍停在 `9489ff8`（2026-05-27）；6/18 規格 commit 尚未 merge。
- 盤點現況：核心 feed（今日/歷史、Cron、股價、AI 留言）已就緒；最大缺口仍是**手機版 UX**與**新聞自動分類**。
- **今日建議執行順序**（若開始實作，建議依序）：
  1. **手機版歷史新聞 drawer + `StockTicker` RWD** — 解開最大 UX blocker，預估改動 `NewsArchiveSidebar.tsx`、`app/page.tsx`、`StockTicker.tsx`。
  2. **Cron 健康檢查** — production `/api/cron/taiwan-stock-news?dryRun=1` + Vercel Cron logs，確認 08:55 後有新文寫入。
  3. **關鍵字新聞分類** — 在 `lib/news/taiwanStockNews.ts` 將既有 `KEYWORD_WEIGHTS` 映射到 `categories` slug，不需 Gemini。
  4. **AI 回覆上下文** — `commentReply.ts` 納入同日主題、來源 URL、相關股價。
  5. **最小單元測試** — `lib/dates/taipei.ts`、`shouldRefreshQuotes`、新聞去重。
- 本日自動化任務：產出 6/18 回顧、6/19 計劃，並即時更新本 md。
- **執行結果**：僅完成規格書同步（commit `ad98858` 於工作分支 `cursor/bc-cd006d30-...`），**未開始任何功能程式碼**；手機版 drawer 仍為 `[todo]`；main 分支仍停在 `9489ff8`。

### 2026-06-20

- 自動化 cron 回顧 6/19 工作：6/19 同樣僅完成規格書同步，連續兩日（6/18、6/19）無功能 commit；main 仍停在 `9489ff8`（2026-05-27）。
- 盤點現況（與程式碼一致）：
  - `NewsArchiveSidebar` 在小螢幕仍全寬堆疊於主 feed 上方（`app/page.tsx` 僅 `lg:grid` 分欄，無 drawer）。
  - `StockTicker` 仍固定 `grid-cols-5`，小螢幕五欄過於擁擠。
  - `KEYWORD_WEIGHTS` 已用於新聞評分排序，但尚未映射到 `categories` 寫入。
- **今日建議執行順序**（建議今日至少完成第 1 項，打破連續文件-only 循環）：
  1. **手機版歷史新聞 drawer + `StockTicker` RWD**（最高優先）
     - `< lg`：浮動「歷史新聞」按鈕 + 左側或底部 drawer/sheet；選文後關閉 drawer 並捲動至主 feed。
     - `lg+`：維持現有左側 sticky sidebar。
     - 股價列：小螢幕改 `overflow-x-auto` 橫向捲動，或 `grid-cols-2` + 桌面維持五欄。
     - 改動檔案：`components/NewsArchiveSidebar.tsx`、`app/page.tsx`、`components/StockTicker.tsx`。
  2. **Cron 健康檢查**（今日 08:55 台灣時間 Cron 應已觸發）
     - production `GET /api/cron/taiwan-stock-news?dryRun=1`（需 `CRON_SECRET` 或 Vercel 內部觸發）。
     - 查 Vercel Cron 執行紀錄與 runtime logs，確認 feed 有新文章。
  3. **關鍵字新聞分類** — 將 `KEYWORD_WEIGHTS` 規則映射到既有 `categories` slug，Cron 寫入時帶正確 `category_id`。
  4. **AI 回覆上下文** — `lib/ai/commentReply.ts` 納入同日主題、`detail`、來源 URL、相關股價。
  5. **最小單元測試** — `lib/dates/taipei.ts`、`lib/market/shouldRefreshQuotes.ts`、新聞去重。
- 本日自動化任務：產出 6/19 回顧、6/20 計劃，並即時更新本 md。
- **執行結果**：僅完成規格書同步（commit `daee8c7` 於工作分支），**未開始任何功能程式碼**；手機版 drawer 仍為 `[todo]`；main 分支仍停在 `9489ff8`；連續三日（6/18–6/20）僅文件更新。

### 2026-06-21

- 自動化 cron 回顧 6/20 工作：6/20 同樣僅完成規格書同步，連續三日無功能 commit；main 仍停在 `9489ff8`（2026-05-27）。
- 盤點現況（與程式碼一致，未變）：
  - `NewsArchiveSidebar` 仍為 `lg:sticky` 桌面側欄，手機全寬堆疊於主 feed 上方。
  - `StockTicker` 仍固定 `grid-cols-5`，320px 寬度下字級過小。
  - 新聞 Cron 每日 08:55 應已觸發，但 production 健康檢查尚未執行驗證。
  - `KEYWORD_WEIGHTS` 僅用於評分排序，尚未寫入對應 `category_id`。
- **今日建議執行順序**（強烈建議今日完成第 1 項，結束連續文件-only 循環）：
  1. **手機版歷史新聞 drawer + `StockTicker` RWD**（最高優先，預估 1 個工作階段可完成）
     - `< lg`：右下角或標題列旁浮動「歷史新聞」按鈕；點擊開啟左側 drawer（或底部 sheet）；選文後關閉並捲動至主 feed。
     - `lg+`：維持現有左側 sticky sidebar，不改桌面行為。
     - `StockTicker`：`< sm` 改 `flex overflow-x-auto` 橫向捲動；`sm+` 維持五欄 grid。
     - 同步修正 archive 說明文案（手機版 sidebar 不在左側）。
     - 改動檔案：`components/NewsArchiveSidebar.tsx`、`app/page.tsx`、`components/StockTicker.tsx`。
  2. **Cron 健康檢查**（本週六 08:55 Cron 應已觸發）
     - production `GET /api/cron/taiwan-stock-news?dryRun=1`（`Authorization: Bearer <CRON_SECRET>`）。
     - 查 Vercel Cron 執行紀錄與 runtime logs；確認今日 feed 有新文章。
  3. **關鍵字新聞分類** — `lib/news/taiwanStockNews.ts` 將 `KEYWORD_WEIGHTS` 映射到既有 `categories` slug。
  4. **AI 回覆上下文** — `lib/ai/commentReply.ts` 納入同日主題、`detail`、來源 URL、相關股價。
  5. **最小單元測試** — `lib/dates/taipei.ts`、`lib/market/shouldRefreshQuotes.ts`、新聞去重。
- 本日自動化任務：產出 6/20 回顧、6/21 計劃，並即時更新本 md。
- **執行結果**：僅完成規格書同步（commit `c89b385` 於工作分支 `cursor/bc-4501c026-...`），**未開始任何功能程式碼**；手機版 drawer 仍為 `[todo]`；main 分支仍停在 `9489ff8`；連續四日（6/18–6/21）僅文件更新。

### 2026-06-22

- 自動化 cron 回顧 6/21 工作：6/21 同樣僅完成規格書同步，連續四日無功能 commit；main 仍停在 `9489ff8`（2026-05-27）。
- 盤點現況（與程式碼一致，未變）：
  - `NewsArchiveSidebar` 仍為 `lg:sticky` 桌面側欄，手機全寬堆疊於主 feed 上方（`app/page.tsx` 僅 `lg:grid` 分欄，無 drawer）。
  - `StockTicker` 仍固定 `grid-cols-5`（`components/StockTicker.tsx:58`），小螢幕五欄過於擁擠。
  - 週六、週日 08:55 Cron 應已各觸發一次，但 production 健康檢查仍未執行驗證。
  - `KEYWORD_WEIGHTS` 僅用於評分排序（`lib/news/taiwanStockNews.ts`），尚未映射到 `category_id` 寫入。
- **今日建議執行順序**（強烈建議今日至少完成第 1 項，結束連續文件-only 循環）：
  1. **手機版歷史新聞 drawer + `StockTicker` RWD**（最高優先，預估 1 個工作階段可完成）
     - `< lg`：標題列旁或右下角浮動「歷史新聞」按鈕；點擊開啟左側 drawer（或底部 sheet）；選文後關閉並捲動至主 feed。
     - `lg+`：維持現有左側 sticky sidebar，不改桌面行為。
     - `StockTicker`：`< sm` 改 `flex overflow-x-auto` 橫向捲動；`sm+` 維持五欄 grid。
     - 同步修正 archive 說明文案（手機版 sidebar 不在左側）。
     - 改動檔案：`components/NewsArchiveSidebar.tsx`、`app/page.tsx`、`components/StockTicker.tsx`。
  2. **Cron 健康檢查**（週末兩次 08:55 Cron 應已觸發，適合今日補驗）
     - production `GET /api/cron/taiwan-stock-news?dryRun=1`（`Authorization: Bearer <CRON_SECRET>`）。
     - 查 Vercel Cron 執行紀錄與 runtime logs；確認週末 feed 有新文章。
  3. **關鍵字新聞分類** — `lib/news/taiwanStockNews.ts` 將 `KEYWORD_WEIGHTS` 映射到既有 `categories` slug。
  4. **AI 回覆上下文** — `lib/ai/commentReply.ts` 納入同日主題、`detail`、來源 URL、相關股價。
  5. **最小單元測試** — `lib/dates/taipei.ts`、`lib/market/shouldRefreshQuotes.ts`、新聞去重。
- 本日自動化任務：產出 6/21 回顧、6/22 計劃，並即時更新本 md。
- **執行結果**：僅完成規格書同步（commit `9047b0d` 於工作分支 `cursor/bc-3fbcf360-...`），**未開始任何功能程式碼**；手機版 drawer 仍為 `[todo]`；main 分支仍停在 `9489ff8`；連續五日（6/18–6/22）僅文件更新。

### 2026-06-23

- 自動化 cron 回顧 6/22 工作：6/22 同樣僅完成規格書同步，連續五日無功能 commit；main 仍停在 `9489ff8`（2026-05-27）。
- 盤點現況（與程式碼一致，未變）：
  - `NewsArchiveSidebar` 仍為 `lg:sticky` 桌面側欄，手機全寬堆疊於主 feed 上方（`app/page.tsx` 僅 `lg:grid` 分欄，無 drawer）。
  - `StockTicker` 仍固定 `grid-cols-5`（`components/StockTicker.tsx:58`），小螢幕五欄過於擁擠。
  - 週末兩次與今日（週一）08:55 Cron 應已觸發，但 production 健康檢查仍未執行驗證。
  - `KEYWORD_WEIGHTS` 僅用於評分排序（`lib/news/taiwanStockNews.ts`），尚未映射到 `category_id` 寫入。
- **今日建議執行順序**（強烈建議今日至少完成第 1 項，結束連續文件-only 循環）：
  1. **手機版歷史新聞 drawer + `StockTicker` RWD**（最高優先，預估 1 個工作階段可完成）
     - `< lg`：標題列旁或右下角浮動「歷史新聞」按鈕；點擊開啟左側 drawer（或底部 sheet）；選文後關閉並捲動至主 feed。
     - `lg+`：維持現有左側 sticky sidebar，不改桌面行為。
     - `StockTicker`：`< sm` 改 `flex overflow-x-auto` 橫向捲動；`sm+` 維持五欄 grid。
     - 同步修正 archive 說明文案（手機版 sidebar 不在左側）。
     - 改動檔案：`components/NewsArchiveSidebar.tsx`、`app/page.tsx`、`components/StockTicker.tsx`。
  2. **Cron 健康檢查**（週末 + 今日週一 08:55 Cron 應已觸發，適合今日補驗）
     - production `GET /api/cron/taiwan-stock-news?dryRun=1`（`Authorization: Bearer <CRON_SECRET>`）。
     - 查 Vercel Cron 執行紀錄與 runtime logs；確認週末與今日 feed 有新文章。
  3. **關鍵字新聞分類** — `lib/news/taiwanStockNews.ts` 將 `KEYWORD_WEIGHTS` 映射到既有 `categories` slug。
  4. **AI 回覆上下文** — `lib/ai/commentReply.ts` 納入同日主題、`detail`、來源 URL、相關股價。
  5. **最小單元測試** — `lib/dates/taipei.ts`、`lib/market/shouldRefreshQuotes.ts`、新聞去重。
- 本日自動化任務：產出 6/22 回顧、6/23 計劃，並即時更新本 md。
- **執行結果**：完成規格書同步至 2026-06-23（commit `c2b60e1` 於工作分支）；**未開始任何功能程式碼**；手機版 drawer 仍為 `[todo]`；main 分支仍停在 `9489ff8`；連續六日（6/18–6/23）僅文件更新。

### 2026-06-24

- 自動化 cron 回顧 6/23 工作：6/23 同樣僅完成規格書同步，連續六日無功能 commit；main 仍停在 `9489ff8`（2026-05-27）。
- 盤點現況（與程式碼一致，未變）：
  - `NewsArchiveSidebar` 仍為 `lg:sticky` 桌面側欄，手機全寬堆疊於主 feed 上方（`app/page.tsx` 僅 `lg:grid` 分欄，無 drawer）。
  - `StockTicker` 仍固定 `grid-cols-5`（`components/StockTicker.tsx:58`），小螢幕五欄過於擁擠。
  - 週末兩次、週一與今日（週二）08:55 Cron 應已各觸發一次，但 production 健康檢查仍未執行驗證。
  - `KEYWORD_WEIGHTS` 僅用於評分排序（`lib/news/taiwanStockNews.ts`），尚未映射到 `category_id` 寫入。
- **今日建議執行順序**（強烈建議今日至少完成第 1 項，結束連續文件-only 循環）：
  1. **手機版歷史新聞 drawer + `StockTicker` RWD**（最高優先，預估 1 個工作階段可完成）
     - `< lg`：標題列旁或右下角浮動「歷史新聞」按鈕；點擊開啟左側 drawer（或底部 sheet）；選文後關閉並捲動至主 feed。
     - `lg+`：維持現有左側 sticky sidebar，不改桌面行為。
     - `StockTicker`：`< sm` 改 `flex overflow-x-auto` 橫向捲動；`sm+` 維持五欄 grid。
     - 同步修正 archive 說明文案（手機版 sidebar 不在左側）。
     - 改動檔案：`components/NewsArchiveSidebar.tsx`、`app/page.tsx`、`components/StockTicker.tsx`。
  2. **Cron 健康檢查**（週末 + 週一 + 今日週二 08:55 Cron 應已觸發，適合今日補驗）
     - production `GET /api/cron/taiwan-stock-news?dryRun=1`（`Authorization: Bearer <CRON_SECRET>`）。
     - 查 Vercel Cron 執行紀錄與 runtime logs；確認近三日 feed 有新文章。
  3. **關鍵字新聞分類** — `lib/news/taiwanStockNews.ts` 將 `KEYWORD_WEIGHTS` 映射到既有 `categories` slug。
  4. **AI 回覆上下文** — `lib/ai/commentReply.ts` 納入同日主題、`detail`、來源 URL、相關股價。
  5. **最小單元測試** — `lib/dates/taipei.ts`、`lib/market/shouldRefreshQuotes.ts`、新聞去重。
- 本日自動化任務：產出 6/23 回顧、6/24 計劃，並即時更新本 md。
- **執行結果**：完成規格書同步至 2026-06-24（commit `1641925`、`1f308cb` 於工作分支）；**未開始任何功能程式碼**；手機版 drawer 仍為 `[todo]`；main 分支仍停在 `9489ff8`；連續七日（6/18–6/24）僅文件更新。

### 2026-06-25

- **無自動化執行紀錄**：本日未觸發每日 cron 自動化 agent；全 repo 無任何 commit。
- 盤點現況（與程式碼一致，未變）：main 仍停在 `9489ff8`（2026-05-27）；工作分支規格書 commit 尚未 merge 至 main。
- 今日（週三）08:55 Cron 應已觸發，但 production 健康檢查仍未執行驗證。
- **執行結果**：無。

### 2026-06-26

- **無自動化執行紀錄**：本日未觸發每日 cron 自動化 agent；全 repo 無任何 commit。
- 盤點現況（與程式碼一致，未變）：待辦項目 #6–#10 全部仍為 `[todo]`。
- 今日（週四）08:55 Cron 應已觸發，但 production 健康檢查仍未執行驗證。
- **執行結果**：無。

### 2026-06-27

- **無自動化執行紀錄**：本日未觸發每日 cron 自動化 agent；全 repo 無任何 commit。
- 盤點現況（與程式碼一致，未變）：自 6/24 規格同步後已連續三日零 commit。
- 今日（週五）08:55 Cron 應已觸發，但 production 健康檢查仍未執行驗證。
- **執行結果**：無。

### 2026-06-28

- **無自動化執行紀錄**：本日未觸發每日 cron 自動化 agent；全 repo 無任何 commit。
- 自動化 cron 回顧 6/25–6/27：連續四日（含週末）無任何開發活動；main 仍停在 `9489ff8`（2026-05-27）。
- 盤點現況（與程式碼一致，未變）：
  - `NewsArchiveSidebar` 仍為 `lg:sticky` 桌面側欄，手機全寬堆疊於主 feed 上方。
  - `StockTicker` 仍固定 `grid-cols-5`，小螢幕五欄過於擁擠。
  - 週三至週六共四次 08:55 Cron 應已觸發，但 production 健康檢查仍未執行驗證。
  - `KEYWORD_WEIGHTS` 僅用於評分排序，尚未映射到 `category_id` 寫入。
- **執行結果**：無（昨日無開發產出）。

### 2026-06-29

- 自動化 cron 回顧 6/28 工作：昨日同樣零 commit、零功能變更；自 6/24 規格同步後已連續五日無任何 repo 活動。
- 盤點現況（與程式碼一致，未變）：
  - `NewsArchiveSidebar` 仍為 `lg:sticky` 桌面側欄，手機全寬堆疊於主 feed 上方（`app/page.tsx` 僅 `lg:grid` 分欄，無 drawer）。
  - `StockTicker` 仍固定 `grid-cols-5`（`components/StockTicker.tsx`），小螢幕五欄過於擁擠。
  - 6/25–6/28 共四次 08:55 Cron 應已觸發，但 production 健康檢查仍未執行驗證。
  - `KEYWORD_WEIGHTS` 僅用於評分排序（`lib/news/taiwanStockNews.ts`），尚未映射到 `category_id` 寫入。
  - 工作區 `CURSOR_SPEC.md` 曾落後至 2026-05-21（未 merge 6/24 規格 commit）；本日已還原並補齊 6/25–6/29 日誌。
- **今日建議執行順序**（強烈建議今日至少完成第 1 項，結束連續零 commit 循環）：
  1. **手機版歷史新聞 drawer + `StockTicker` RWD**（最高優先，預估 1 個工作階段可完成）
     - `< lg`：標題列旁或右下角浮動「歷史新聞」按鈕；點擊開啟左側 drawer（或底部 sheet）；選文後關閉並捲動至主 feed。
     - `lg+`：維持現有左側 sticky sidebar，不改桌面行為。
     - `StockTicker`：`< sm` 改 `flex overflow-x-auto` 橫向捲動；`sm+` 維持五欄 grid。
     - 同步修正 archive 說明文案（手機版 sidebar 不在左側）。
     - 改動檔案：`components/NewsArchiveSidebar.tsx`、`app/page.tsx`、`components/StockTicker.tsx`。
  2. **Cron 健康檢查**（6/25–6/28 四次 08:55 Cron 應已觸發，適合今日補驗）
     - production `GET /api/cron/taiwan-stock-news?dryRun=1`（`Authorization: Bearer <CRON_SECRET>`）。
     - 查 Vercel Cron 執行紀錄與 runtime logs；確認近四日 feed 有新文章。
  3. **關鍵字新聞分類** — `lib/news/taiwanStockNews.ts` 將 `KEYWORD_WEIGHTS` 映射到既有 `categories` slug。
  4. **AI 回覆上下文** — `lib/ai/commentReply.ts` 納入同日主題、`detail`、來源 URL、相關股價。
  5. **最小單元測試** — `lib/dates/taipei.ts`、`lib/market/shouldRefreshQuotes.ts`、新聞去重。
- 本日自動化任務：產出 6/28 回顧、6/29 計劃，並即時更新本 md。
- **執行結果**：完成規格書同步至 2026-06-29（含 6/25–6/28 空窗紀錄與今日計劃）；功能實作待下一工作階段啟動。

### 2026-06-30

- 自動化 cron 回顧 6/29 工作：昨日完成規格書同步（commit `dad2d7e` 於工作分支），**未開始任何功能程式碼**；自 5/27 最後功能 commit `9489ff8` 起已逾一個月無新功能 merge 至 main。
- 盤點現況（與程式碼一致，未變）：
  - `NewsArchiveSidebar` 仍為 `lg:sticky` 桌面側欄，手機全寬堆疊於主 feed 上方（`app/page.tsx` 僅 `lg:grid` 分欄，無 drawer）。
  - `StockTicker` 仍固定 `grid-cols-5`（`components/StockTicker.tsx:58`），小螢幕五欄過於擁擠。
  - 6/25–6/29 共五次 08:55 Cron 應已觸發，但 production 健康檢查仍未執行驗證。
  - `KEYWORD_WEIGHTS` 僅用於評分排序（`lib/news/taiwanStockNews.ts`），尚未映射到 `category_id` 寫入。
  - 工作分支規格書 commit 尚未 merge 至 main；main 仍停在 `9489ff8`。
- **今日建議執行順序**（強烈建議今日至少完成第 1 項，結束連續文件-only / 零功能 commit 循環）：
  1. **手機版歷史新聞 drawer + `StockTicker` RWD**（最高優先，預估 1 個工作階段可完成）
     - `< lg`：標題列旁或右下角浮動「歷史新聞」按鈕；點擊開啟左側 drawer（或底部 sheet）；選文後關閉並捲動至主 feed。
     - `lg+`：維持現有左側 sticky sidebar，不改桌面行為。
     - `StockTicker`：`< sm` 改 `flex overflow-x-auto` 橫向捲動；`sm+` 維持五欄 grid。
     - 同步修正 archive 說明文案（手機版 sidebar 不在左側）。
     - 改動檔案：`components/NewsArchiveSidebar.tsx`、`app/page.tsx`、`components/StockTicker.tsx`。
  2. **Cron 健康檢查**（6/25–6/29 五次 08:55 Cron 應已觸發，適合今日補驗）
     - production `GET /api/cron/taiwan-stock-news?dryRun=1`（`Authorization: Bearer <CRON_SECRET>`）。
     - 查 Vercel Cron 執行紀錄與 runtime logs；確認近五日 feed 有新文章。
  3. **關鍵字新聞分類** — `lib/news/taiwanStockNews.ts` 將 `KEYWORD_WEIGHTS` 映射到既有 `categories` slug。
  4. **AI 回覆上下文** — `lib/ai/commentReply.ts` 納入同日主題、`detail`、來源 URL、相關股價。
  5. **最小單元測試** — `lib/dates/taipei.ts`、`lib/market/shouldRefreshQuotes.ts`、新聞去重。
- 本日自動化任務：產出 6/29 回顧、6/30 計劃，並即時更新本 md。
- **執行結果**：完成規格書同步至 2026-06-30（含 6/29 回顧與今日計劃）；功能實作待下一工作階段啟動。

### 2026-07-01

- **無自動化執行紀錄**：本日未觸發每日 cron 自動化 agent；全 repo 無任何 commit。
- 盤點現況（與程式碼一致，未變）：main 仍停在 `9489ff8`（2026-05-27）；6/30 規格書 commit `ab3e175` 僅在工作分支，尚未 merge 至 main。
- 今日（週二）08:55 Cron 應已觸發，但 production 健康檢查仍未執行驗證。
- **執行結果**：無。

### 2026-07-02

- **無自動化執行紀錄**：本日未觸發每日 cron 自動化 agent；全 repo 無任何 commit。
- 盤點現況（與程式碼一致，未變）：待辦項目 #6–#10 全部仍為 `[todo]`。
- 今日（週三）08:55 Cron 應已觸發，但 production 健康檢查仍未執行驗證。
- **執行結果**：無。

### 2026-07-03

- **無自動化執行紀錄**：本日未觸發每日 cron 自動化 agent；全 repo 無任何 commit。
- 盤點現況（與程式碼一致，未變）：自 6/30 規格同步後已連續三日零 commit。
- 今日（週四）08:55 Cron 應已觸發，但 production 健康檢查仍未執行驗證。
- **執行結果**：無。

### 2026-07-04

- **無自動化執行紀錄**：本日未觸發每日 cron 自動化 agent；全 repo 無任何 commit。
- 盤點現況（與程式碼一致，未變）：
  - `NewsArchiveSidebar` 仍為 `lg:sticky` 桌面側欄，手機全寬堆疊於主 feed 上方。
  - `StockTicker` 仍固定 `grid-cols-5`（`components/StockTicker.tsx:58`），小螢幕五欄過於擁擠。
  - 7/1–7/3 共三次 08:55 Cron 應已觸發，但 production 健康檢查仍未執行驗證。
- **執行結果**：無。

### 2026-07-05

- **無自動化執行紀錄**：本日未觸發每日 cron 自動化 agent；全 repo 無任何 commit。
- 自動化 cron 回顧 7/1–7/4：連續五日無任何開發活動；main 仍停在 `9489ff8`（2026-05-27）；自 5/27 最後功能 commit 起已逾五週無新功能 merge 至 main。
- 盤點現況（與程式碼一致，未變）：
  - `NewsArchiveSidebar` 仍為 `lg:sticky` 桌面側欄，手機全寬堆疊於主 feed 上方（`app/page.tsx` 僅 `lg:grid` 分欄，無 drawer）。
  - `StockTicker` 仍固定 `grid-cols-5`（`components/StockTicker.tsx:58`），小螢幕五欄過於擁擠。
  - 6/30–7/4 共六次 08:55 Cron 應已觸發，但 production 健康檢查仍未執行驗證。
  - `KEYWORD_WEIGHTS` 僅用於評分排序（`lib/news/taiwanStockNews.ts`），尚未映射到 `category_id` 寫入。
- **執行結果**：無（昨日無開發產出）。

### 2026-07-06

- 自動化 cron 回顧 7/5 工作：昨日同樣零 commit、零功能變更；自 6/30 規格同步後已連續六日無任何 repo 活動。
- 盤點現況（與程式碼一致，未變）：
  - `NewsArchiveSidebar` 仍為 `lg:sticky` 桌面側欄，手機全寬堆疊於主 feed 上方（`app/page.tsx` 僅 `lg:grid` 分欄，無 drawer）。
  - `StockTicker` 仍固定 `grid-cols-5`（`components/StockTicker.tsx:58`），小螢幕五欄過於擁擠。
  - 6/30–7/5 共七次 08:55 Cron 應已觸發，但 production 健康檢查仍未執行驗證。
  - `KEYWORD_WEIGHTS` 僅用於評分排序（`lib/news/taiwanStockNews.ts`），尚未映射到 `category_id` 寫入。
  - 工作區 `CURSOR_SPEC.md` 曾落後至 2026-05-21（未 merge 6/30 規格 commit）；本日已還原並補齊 7/1–7/6 日誌。
- **今日建議執行順序**（強烈建議今日至少完成第 1 項，結束連續零 commit 循環）：
  1. **手機版歷史新聞 drawer + `StockTicker` RWD**（最高優先，預估 1 個工作階段可完成）
     - `< lg`：標題列旁或右下角浮動「歷史新聞」按鈕；點擊開啟左側 drawer（或底部 sheet）；選文後關閉並捲動至主 feed。
     - `lg+`：維持現有左側 sticky sidebar，不改桌面行為。
     - `StockTicker`：`< sm` 改 `flex overflow-x-auto` 橫向捲動；`sm+` 維持五欄 grid。
     - 同步修正 archive 說明文案（手機版 sidebar 不在左側）。
     - 改動檔案：`components/NewsArchiveSidebar.tsx`、`app/page.tsx`、`components/StockTicker.tsx`。
  2. **Cron 健康檢查**（6/30–7/5 七次 08:55 Cron 應已觸發，適合今日補驗）
     - production `GET /api/cron/taiwan-stock-news?dryRun=1`（`Authorization: Bearer <CRON_SECRET>`）。
     - 查 Vercel Cron 執行紀錄與 runtime logs；確認近七日 feed 有新文章。
  3. **關鍵字新聞分類** — `lib/news/taiwanStockNews.ts` 將 `KEYWORD_WEIGHTS` 映射到既有 `categories` slug。
  4. **AI 回覆上下文** — `lib/ai/commentReply.ts` 納入同日主題、`detail`、來源 URL、相關股價。
  5. **最小單元測試** — `lib/dates/taipei.ts`、`lib/market/shouldRefreshQuotes.ts`、新聞去重。
- 本日自動化任務：產出 7/5 回顧、7/6 計劃，並即時更新本 md。
- **執行結果**：完成規格書同步至 2026-07-06（含 7/1–7/5 空窗紀錄與今日計劃）；功能實作待下一工作階段啟動。

### 2026-07-07

- **無自動化執行紀錄**：本日未觸發每日 cron 自動化 agent；全 repo 無任何 commit。
- 盤點現況（與程式碼一致，未變）：
  - main 仍停在 `9489ff8`（2026-05-27）；7/6 規格書 commit `412e8a3` 僅在工作分支 `cursor/bc-669133b9-...`，尚未 merge 至 main。
  - 待辦項目 #6–#10 全部仍為 `[todo]`。
  - 7/6–7/7 兩次 08:55 Cron 應已觸發，但 production 健康檢查仍未執行驗證。
- **執行結果**：無。

### 2026-07-08

- **無自動化執行紀錄**：本日未觸發每日 cron 自動化 agent；全 repo 無任何 commit。
- 自動化 cron 回顧 7/7 工作：昨日同樣零 commit、零功能變更；自 7/6 規格同步後已連續兩日無任何 repo 活動。
- 盤點現況（與程式碼一致，未變）：
  - `NewsArchiveSidebar` 仍為 `lg:sticky` 桌面側欄，手機全寬堆疊於主 feed 上方（`app/page.tsx` 僅 `lg:grid` 分欄，無 drawer）。
  - `StockTicker` 仍固定 `grid-cols-5`（`components/StockTicker.tsx:58`），小螢幕五欄過於擁擠。
  - 7/6–7/8 共三次 08:55 Cron 應已觸發，但 production 健康檢查仍未執行驗證。
  - `KEYWORD_WEIGHTS` 僅用於評分排序（`lib/news/taiwanStockNews.ts`），尚未映射到 `category_id` 寫入。
- **執行結果**：無（昨日無開發產出）。

### 2026-07-09

- 自動化 cron 回顧 7/8 工作：昨日同樣零 commit、零功能變更；自 5/27 最後功能 commit 起已逾六週無新功能 merge 至 main。
- 盤點現況（與程式碼一致，未變）：
  - `NewsArchiveSidebar` 仍為 `lg:sticky` 桌面側欄，手機全寬堆疊於主 feed 上方（`app/page.tsx` 僅 `lg:grid` 分欄，無 drawer）。
  - `StockTicker` 仍固定 `grid-cols-5`（`components/StockTicker.tsx:58`），小螢幕五欄過於擁擠。
  - 7/6–7/8 共三次 08:55 Cron 應已觸發，但 production 健康檢查仍未執行驗證。
  - `KEYWORD_WEIGHTS` 僅用於評分排序（`lib/news/taiwanStockNews.ts`），尚未映射到 `category_id` 寫入。
  - 工作區 `CURSOR_SPEC.md` 曾落後至 2026-05-21（未 merge 7/6 規格 commit）；本日已還原並補齊 7/7–7/9 日誌。
- **今日建議執行順序**（強烈建議今日至少完成第 1 項，結束連續零 commit 循環）：
  1. **手機版歷史新聞 drawer + `StockTicker` RWD**（最高優先，預估 1 個工作階段可完成）
     - `< lg`：標題列旁或右下角浮動「歷史新聞」按鈕；點擊開啟左側 drawer（或底部 sheet）；選文後關閉並捲動至主 feed。
     - `lg+`：維持現有左側 sticky sidebar，不改桌面行為。
     - `StockTicker`：`< sm` 改 `flex overflow-x-auto` 橫向捲動；`sm+` 維持五欄 grid。
     - 同步修正 archive 說明文案（手機版 sidebar 不在左側）。
     - 改動檔案：`components/NewsArchiveSidebar.tsx`、`app/page.tsx`、`components/StockTicker.tsx`。
  2. **Cron 健康檢查**（7/6–7/8 三次 08:55 Cron 應已觸發，適合今日補驗）
     - production `GET /api/cron/taiwan-stock-news?dryRun=1`（`Authorization: Bearer <CRON_SECRET>`）。
     - 查 Vercel Cron 執行紀錄與 runtime logs；確認近三日 feed 有新文章。
  3. **關鍵字新聞分類** — `lib/news/taiwanStockNews.ts` 將 `KEYWORD_WEIGHTS` 映射到既有 `categories` slug。
  4. **AI 回覆上下文** — `lib/ai/commentReply.ts` 納入同日主題、`detail`、來源 URL、相關股價。
  5. **最小單元測試** — `lib/dates/taipei.ts`、`lib/market/shouldRefreshQuotes.ts`、新聞去重。
- 本日自動化任務：產出 7/8 回顧、7/9 計劃，並即時更新本 md。
- **執行結果**：完成規格書同步至 2026-07-09（含 7/7–7/8 空窗紀錄與今日計劃）；功能實作待下一工作階段啟動。

### 2026-07-10

- **無自動化執行紀錄**：本日未觸發每日 cron 自動化 agent；全 repo 無任何 commit。
- 自動化 cron 回顧 7/9 工作：昨日完成規格書同步（commit `3ab31c6` 於工作分支 `cursor/bc-d32d3803-...`），**未開始任何功能程式碼**；自 5/27 最後功能 commit 起已逾六週無新功能 merge 至 main。
- 盤點現況（與程式碼一致，未變）：
  - `NewsArchiveSidebar` 仍為 `lg:sticky` 桌面側欄，手機全寬堆疊於主 feed 上方（`app/page.tsx` 僅 `lg:grid` 分欄，無 drawer）。
  - `StockTicker` 仍固定 `grid-cols-5`（`components/StockTicker.tsx:58`），小螢幕五欄過於擁擠。
  - 7/9–7/10 兩次 08:55 Cron 應已觸發，但 production 健康檢查仍未執行驗證。
  - `KEYWORD_WEIGHTS` 僅用於評分排序（`lib/news/taiwanStockNews.ts`），尚未映射到 `category_id` 寫入。
  - 7/9 規格書 commit `3ab31c6` 僅在工作分支，尚未 merge 至 main；main 仍停在 `9489ff8`。
- **執行結果**：無（昨日無開發產出）。

### 2026-07-11

- 自動化 cron 回顧 7/10 工作：昨日同樣零 commit、零功能變更；自 7/9 規格同步後已連續一日無任何 repo 活動。
- 盤點現況（與程式碼一致，未變）：
  - `NewsArchiveSidebar` 仍為 `lg:sticky` 桌面側欄，手機全寬堆疊於主 feed 上方（`app/page.tsx` 僅 `lg:grid` 分欄，無 drawer）。
  - `StockTicker` 仍固定 `grid-cols-5`（`components/StockTicker.tsx:58`），小螢幕五欄過於擁擠。
  - 7/9–7/11 共三次 08:55 Cron 應已觸發，但 production 健康檢查仍未執行驗證。
  - `KEYWORD_WEIGHTS` 僅用於評分排序（`lib/news/taiwanStockNews.ts`），尚未映射到 `category_id` 寫入。
  - 工作區 `CURSOR_SPEC.md` 曾落後至 2026-05-21（未 merge 7/9 規格 commit）；本日已還原並補齊 7/10–7/11 日誌。
- **今日建議執行順序**（強烈建議今日至少完成第 1 項，結束連續零 commit 循環）：
  1. **手機版歷史新聞 drawer + `StockTicker` RWD**（最高優先，預估 1 個工作階段可完成）
     - `< lg`：標題列旁或右下角浮動「歷史新聞」按鈕；點擊開啟左側 drawer（或底部 sheet）；選文後關閉並捲動至主 feed。
     - `lg+`：維持現有左側 sticky sidebar，不改桌面行為。
     - `StockTicker`：`< sm` 改 `flex overflow-x-auto` 橫向捲動；`sm+` 維持五欄 grid。
     - 同步修正 archive 說明文案（手機版 sidebar 不在左側）。
     - 改動檔案：`components/NewsArchiveSidebar.tsx`、`app/page.tsx`、`components/StockTicker.tsx`。
  2. **Cron 健康檢查**（7/9–7/11 三次 08:55 Cron 應已觸發，適合今日補驗）
     - production `GET /api/cron/taiwan-stock-news?dryRun=1`（`Authorization: Bearer <CRON_SECRET>`）。
     - 查 Vercel Cron 執行紀錄與 runtime logs；確認近三日 feed 有新文章。
  3. **關鍵字新聞分類** — `lib/news/taiwanStockNews.ts` 將 `KEYWORD_WEIGHTS` 映射到既有 `categories` slug。
  4. **AI 回覆上下文** — `lib/ai/commentReply.ts` 納入同日主題、`detail`、來源 URL、相關股價。
  5. **最小單元測試** — `lib/dates/taipei.ts`、`lib/market/shouldRefreshQuotes.ts`、新聞去重。
- 本日自動化任務：產出 7/10 回顧、7/11 計劃，並即時更新本 md。
- **執行結果**：完成規格書同步至 2026-07-11（含 7/10 空窗紀錄與今日計劃）；功能實作待下一工作階段啟動。

### 2026-07-12

- **無自動化執行紀錄**：本日未觸發每日 cron 自動化 agent；全 repo 無任何 commit。
- 自動化 cron 回顧 7/11 工作：昨日完成規格書同步（commit `138f1fd` 於工作分支 `cursor/bc-c999813a-...`），**未開始任何功能程式碼**；自 5/27 最後功能 commit 起已逾七週無新功能 merge 至 main。
- 盤點現況（與程式碼一致，未變）：
  - `NewsArchiveSidebar` 仍為 `lg:sticky` 桌面側欄，手機全寬堆疊於主 feed 上方（`app/page.tsx` 僅 `lg:grid` 分欄，無 drawer）。
  - `StockTicker` 仍固定 `grid-cols-5`（`components/StockTicker.tsx:58`），小螢幕五欄過於擁擠。
  - 7/11–7/12 兩次 08:55 Cron 應已觸發，但 production 健康檢查仍未執行驗證。
  - `KEYWORD_WEIGHTS` 僅用於評分排序（`lib/news/taiwanStockNews.ts`），尚未映射到 `category_id` 寫入。
  - 7/11 規格書 commit `138f1fd` 僅在工作分支，尚未 merge 至 main；main 仍停在 `9489ff8`。
- **執行結果**：無（昨日無開發產出）。

### 2026-07-13

- 自動化 cron 回顧 7/12 工作：昨日同樣零 commit、零功能變更；自 7/11 規格同步後已連續一日無任何 repo 活動。
- 盤點現況（與程式碼一致，未變）：
  - `NewsArchiveSidebar` 仍為 `lg:sticky` 桌面側欄，手機全寬堆疊於主 feed 上方（`app/page.tsx` 僅 `lg:grid` 分欄，無 drawer）。
  - `StockTicker` 仍固定 `grid-cols-5`（`components/StockTicker.tsx:58`），小螢幕五欄過於擁擠。
  - 7/11–7/13 共三次 08:55 Cron 應已觸發，但 production 健康檢查仍未執行驗證。
  - `KEYWORD_WEIGHTS` 僅用於評分排序（`lib/news/taiwanStockNews.ts`），尚未映射到 `category_id` 寫入。
  - 工作區 `CURSOR_SPEC.md` 曾落後至 2026-05-21（未 merge 7/11 規格 commit）；本日已還原並補齊 7/12–7/13 日誌。
- **今日建議執行順序**（強烈建議今日至少完成第 1 項，結束連續零 commit 循環）：
  1. **手機版歷史新聞 drawer + `StockTicker` RWD**（最高優先，已 pending 約 26 天，預估 1 個工作階段可完成）
     - `< lg`：標題列旁或右下角浮動「歷史新聞」按鈕；點擊開啟左側 drawer（或底部 sheet）；選文後關閉並捲動至主 feed。
     - `lg+`：維持現有左側 sticky sidebar，不改桌面行為。
     - `StockTicker`：`< sm` 改 `flex overflow-x-auto` 橫向捲動；`sm+` 維持五欄 grid。
     - 同步修正 archive 說明文案（手機版 sidebar 不在左側）。
     - 改動檔案：`components/NewsArchiveSidebar.tsx`、`app/page.tsx`、`components/StockTicker.tsx`。
  2. **Cron 健康檢查**（7/11–7/13 三次 08:55 Cron 應已觸發，適合今日補驗）
     - production `GET /api/cron/taiwan-stock-news?dryRun=1`（`Authorization: Bearer <CRON_SECRET>`）。
     - 查 Vercel Cron 執行紀錄與 runtime logs；確認近三日 feed 有新文章。
  3. **關鍵字新聞分類** — `lib/news/taiwanStockNews.ts` 將 `KEYWORD_WEIGHTS` 映射到既有 `categories` slug。
  4. **AI 回覆上下文** — `lib/ai/commentReply.ts` 納入同日主題、`detail`、來源 URL、相關股價。
  5. **最小單元測試** — `lib/dates/taipei.ts`、`lib/market/shouldRefreshQuotes.ts`、新聞去重。
- 本日自動化任務：產出 7/12 回顧、7/13 計劃，並即時更新本 md。
- **執行結果**：完成規格書同步至 2026-07-13（含 7/12 空窗紀錄與今日計劃）；功能實作待下一工作階段啟動。

### 2026-07-14

- 自動化 cron 回顧 7/13 工作：昨日完成規格書同步（commit `fd476ff` 於工作分支 `cursor/bc-58c0aaf4-...`），**未開始任何功能程式碼**；自 5/27 最後功能 commit 起已逾七週無新功能 merge 至 main。
- 盤點現況（與程式碼一致，未變）：
  - `NewsArchiveSidebar` 仍為 `lg:sticky` 桌面側欄，手機全寬堆疊於主 feed 上方（`app/page.tsx` 僅 `lg:grid` 分欄，無 drawer）。
  - `StockTicker` 仍固定 `grid-cols-5`（`components/StockTicker.tsx:58`），小螢幕五欄過於擁擠。
  - 7/13–7/14 兩次 08:55 Cron 應已觸發，但 production 健康檢查仍未執行驗證。
  - `KEYWORD_WEIGHTS` 僅用於評分排序（`lib/news/taiwanStockNews.ts`），尚未映射到 `category_id` 寫入。
  - 7/13 規格書 commit `fd476ff` 僅在工作分支，尚未 merge 至 main；main 仍停在 `9489ff8`；本日工作區曾落後至 2026-05-21，已還原並補齊。
- **今日建議執行順序**（強烈建議今日至少完成第 1 項，結束連續零功能 commit 循環）：
  1. **手機版歷史新聞 drawer + `StockTicker` RWD**（最高優先，已 pending 約 27 天，預估 1 個工作階段可完成）
     - `< lg`：標題列旁或右下角浮動「歷史新聞」按鈕；點擊開啟左側 drawer（或底部 sheet）；選文後關閉並捲動至主 feed。
     - `lg+`：維持現有左側 sticky sidebar，不改桌面行為。
     - `StockTicker`：`< sm` 改 `flex overflow-x-auto` 橫向捲動；`sm+` 維持五欄 grid。
     - 同步修正 archive 說明文案（手機版 sidebar 不在左側）。
     - 改動檔案：`components/NewsArchiveSidebar.tsx`、`app/page.tsx`、`components/StockTicker.tsx`。
  2. **Cron 健康檢查**（7/13–7/14 兩次 08:55 Cron 應已觸發，適合今日補驗）
     - production `GET /api/cron/taiwan-stock-news?dryRun=1`（`Authorization: Bearer <CRON_SECRET>`）。
     - 查 Vercel Cron 執行紀錄與 runtime logs；確認近兩日 feed 有新文章。
  3. **關鍵字新聞分類** — `lib/news/taiwanStockNews.ts` 將 `KEYWORD_WEIGHTS` 映射到既有 `categories` slug。
  4. **AI 回覆上下文** — `lib/ai/commentReply.ts` 納入同日主題、`detail`、來源 URL、相關股價。
  5. **最小單元測試** — `lib/dates/taipei.ts`、`lib/market/shouldRefreshQuotes.ts`、新聞去重。
- 本日自動化任務：產出 7/13 回顧、7/14 計劃，並即時更新本 md。
- **執行結果**：完成規格書同步至 2026-07-14（含 7/13 回顧與今日計劃）；功能實作待下一工作階段啟動。

### 2026-07-15

- **無自動化執行紀錄**：本日未觸發每日 cron 自動化 agent；全 repo 無任何 commit。
- 自動化 cron 回顧 7/14 工作：昨日完成規格書同步（commit `279af76` 於工作分支 `cursor/bc-735ba710-...`），**未開始任何功能程式碼**；自 5/27 最後功能 commit 起已逾七週無新功能 merge 至 main。
- 盤點現況（與程式碼一致，未變）：
  - `NewsArchiveSidebar` 仍為 `lg:sticky` 桌面側欄，手機全寬堆疊於主 feed 上方（`app/page.tsx:573` 僅 `lg:grid` 分欄，無 drawer）。
  - `StockTicker` 仍固定 `grid-cols-5`（`components/StockTicker.tsx:58`），小螢幕五欄過於擁擠。
  - 7/14–7/15 兩次 08:55 Cron 應已觸發，但 production 健康檢查仍未執行驗證。
  - `KEYWORD_WEIGHTS` 僅用於評分排序（`lib/news/taiwanStockNews.ts`），尚未映射到 `category_id` 寫入。
  - 7/14 規格書 commit `279af76` 僅在工作分支，尚未 merge 至 main；main 仍停在 `9489ff8`。
- **執行結果**：無（昨日無開發產出）。

### 2026-07-16

- 自動化 cron 回顧 7/15 工作：昨日同樣零 commit、零功能變更；自 7/14 規格同步後已連續一日無任何 repo 活動。
- 盤點現況（與程式碼一致，未變）：
  - `NewsArchiveSidebar` 仍為 `lg:sticky` 桌面側欄，手機全寬堆疊於主 feed 上方（`app/page.tsx:573` 僅 `lg:grid` 分欄，無 drawer）。
  - `StockTicker` 仍固定 `grid-cols-5`（`components/StockTicker.tsx:58`），小螢幕五欄過於擁擠。
  - 7/14–7/16 共三次 08:55 Cron 應已觸發，但 production 健康檢查仍未執行驗證。
  - `KEYWORD_WEIGHTS` 僅用於評分排序（`lib/news/taiwanStockNews.ts`），尚未映射到 `category_id` 寫入。
  - 工作區 `CURSOR_SPEC.md` 曾落後至 2026-05-21（未 merge 7/14 規格 commit）；本日已還原並補齊 7/15–7/16 日誌。
- **今日建議執行順序**（強烈建議今日至少完成第 1 項，結束連續零功能 commit 循環）：
  1. **手機版歷史新聞 drawer + `StockTicker` RWD**（最高優先，已 pending 約 28 天，預估 1 個工作階段可完成）
     - `< lg`：標題列旁或右下角浮動「歷史新聞」按鈕；點擊開啟左側 drawer（或底部 sheet）；選文後關閉並捲動至主 feed。
     - `lg+`：維持現有左側 sticky sidebar，不改桌面行為。
     - `StockTicker`：`< sm` 改 `flex overflow-x-auto` 橫向捲動；`sm+` 維持五欄 grid。
     - 同步修正 archive 說明文案（手機版 sidebar 不在左側）。
     - 改動檔案：`components/NewsArchiveSidebar.tsx`、`app/page.tsx`、`components/StockTicker.tsx`。
  2. **Cron 健康檢查**（7/14–7/16 三次 08:55 Cron 應已觸發，適合今日補驗）
     - production `GET /api/cron/taiwan-stock-news?dryRun=1`（`Authorization: Bearer <CRON_SECRET>`）。
     - 查 Vercel Cron 執行紀錄與 runtime logs；確認近三日 feed 有新文章。
  3. **關鍵字新聞分類** — `lib/news/taiwanStockNews.ts` 將 `KEYWORD_WEIGHTS` 映射到既有 `categories` slug。
  4. **AI 回覆上下文** — `lib/ai/commentReply.ts` 納入同日主題、`detail`、來源 URL、相關股價。
  5. **最小單元測試** — `lib/dates/taipei.ts`、`lib/market/shouldRefreshQuotes.ts`、新聞去重。
- 本日自動化任務：產出 7/15 回顧、7/16 計劃，並即時更新本 md。
- **執行結果**：完成規格書同步至 2026-07-16（含 7/15 空窗紀錄與今日計劃）；功能實作待下一工作階段啟動。

### 2026-07-17

- 自動化 cron 回顧 7/16 工作：昨日完成規格書同步（commit `4d92bd4` 於工作分支 `cursor/bc-51dfceb6-...`），**未開始任何功能程式碼**；自 5/27 最後功能 commit 起已逾七週無新功能 merge 至 main。
- 盤點現況（與程式碼一致，未變）：
  - `NewsArchiveSidebar` 仍為 `lg:sticky` 桌面側欄，手機全寬堆疊於主 feed 上方（`app/page.tsx:573` 僅 `lg:grid` 分欄，無 drawer）。
  - `StockTicker` 仍固定 `grid-cols-5`（`components/StockTicker.tsx:58`），小螢幕五欄過於擁擠。
  - 7/15–7/17 共三次 08:55 Cron 應已觸發，但 production 健康檢查仍未執行驗證。
  - `KEYWORD_WEIGHTS` 僅用於評分排序（`lib/news/taiwanStockNews.ts`），尚未映射到 `category_id` 寫入。
  - 工作區 `CURSOR_SPEC.md` 曾落後至 2026-05-21（未 merge 7/16 規格 commit）；本日已還原並補齊 7/17 日誌。
- **今日建議執行順序**（強烈建議今日至少完成第 1 項，結束連續零功能 commit 循環）：
  1. **手機版歷史新聞 drawer + `StockTicker` RWD**（最高優先，已 pending 約 29 天，預估 1 個工作階段可完成）
     - `< lg`：標題列旁或右下角浮動「歷史新聞」按鈕；點擊開啟左側 drawer（或底部 sheet）；選文後關閉並捲動至主 feed。
     - `lg+`：維持現有左側 sticky sidebar，不改桌面行為。
     - `StockTicker`：`< sm` 改 `flex overflow-x-auto` 橫向捲動；`sm+` 維持五欄 grid。
     - 同步修正 archive 說明文案（手機版 sidebar 不在左側）。
     - 改動檔案：`components/NewsArchiveSidebar.tsx`、`app/page.tsx`、`components/StockTicker.tsx`。
  2. **Cron 健康檢查**（7/15–7/17 三次 08:55 Cron 應已觸發，適合今日補驗）
     - production `GET /api/cron/taiwan-stock-news?dryRun=1`（`Authorization: Bearer <CRON_SECRET>`）。
     - 查 Vercel Cron 執行紀錄與 runtime logs；確認近三日 feed 有新文章。
  3. **關鍵字新聞分類** — `lib/news/taiwanStockNews.ts` 將 `KEYWORD_WEIGHTS` 映射到既有 `categories` slug。
  4. **AI 回覆上下文** — `lib/ai/commentReply.ts` 納入同日主題、`detail`、來源 URL、相關股價。
  5. **最小單元測試** — `lib/dates/taipei.ts`、`lib/market/shouldRefreshQuotes.ts`、新聞去重。
- 本日自動化任務：產出 7/16 回顧、7/17 計劃，並即時更新本 md。
- **執行結果**：完成規格書同步至 2026-07-17（含 7/16 回顧與今日計劃）；功能實作待下一工作階段啟動。

### 2026-07-18

- 自動化 cron 回顧 7/17 工作：昨日完成規格書同步（commit `a46b697` 於工作分支 `cursor/bc-0b2effc2-...`），**未開始任何功能程式碼**；自 5/27 最後功能 commit（`9489ff8`）起已逾七週無新功能 merge 至 main。
- 盤點現況（與程式碼一致，未變）：
  - `NewsArchiveSidebar` 仍為 `lg:sticky` 桌面側欄，手機全寬堆疊於主 feed 上方（`app/page.tsx:573` 僅 `lg:grid` 分欄，無 drawer）。
  - `StockTicker` 仍固定 `grid-cols-5`（`components/StockTicker.tsx:58`），小螢幕五欄過於擁擠。
  - 7/16–7/18 共三次 08:55 Cron 應已觸發，但 production 健康檢查仍未執行驗證。
  - `KEYWORD_WEIGHTS` 僅用於評分排序（`lib/news/taiwanStockNews.ts`），尚未映射到 `category_id` 寫入。
  - 7/17 規格書 commit `a46b697` 僅在工作分支，尚未 merge 至 main；main 仍停在 `9489ff8`；本日工作區曾落後至 2026-05-21，已還原並補齊。
- **今日建議執行順序**（強烈建議今日至少完成第 1 項，結束連續零功能 commit 循環）：
  1. **手機版歷史新聞 drawer + `StockTicker` RWD**（最高優先，已 pending 約 30 天，預估 1 個工作階段可完成）
     - `< lg`：標題列旁或右下角浮動「歷史新聞」按鈕；點擊開啟左側 drawer（或底部 sheet）；選文後關閉並捲動至主 feed。
     - `lg+`：維持現有左側 sticky sidebar，不改桌面行為。
     - `StockTicker`：`< sm` 改 `flex overflow-x-auto` 橫向捲動；`sm+` 維持五欄 grid。
     - 同步修正 archive 說明文案（手機版 sidebar 不在左側）。
     - 改動檔案：`components/NewsArchiveSidebar.tsx`、`app/page.tsx`、`components/StockTicker.tsx`。
  2. **Cron 健康檢查**（7/16–7/18 三次 08:55 Cron 應已觸發，適合今日補驗）
     - production `GET /api/cron/taiwan-stock-news?dryRun=1`（`Authorization: Bearer <CRON_SECRET>`）。
     - 查 Vercel Cron 執行紀錄與 runtime logs；確認近三日 feed 有新文章。
  3. **關鍵字新聞分類** — `lib/news/taiwanStockNews.ts` 將 `KEYWORD_WEIGHTS` 映射到既有 `categories` slug。
  4. **AI 回覆上下文** — `lib/ai/commentReply.ts` 納入同日主題、`detail`、來源 URL、相關股價。
  5. **最小單元測試** — `lib/dates/taipei.ts`、`lib/market/shouldRefreshQuotes.ts`、新聞去重。
- 本日自動化任務：產出 7/17 回顧、7/18 計劃，並即時更新本 md。
- **執行結果**：完成規格書同步至 2026-07-18（含 7/17 回顧與今日計劃）；功能實作待下一工作階段啟動。

### 2026-07-19

- 自動化 cron 回顧 7/18 工作：昨日完成規格書同步（commit `690a53e` 於工作分支 `cursor/bc-5d90db21-...`），**未開始任何功能程式碼**；自 5/27 最後功能 commit（`9489ff8`）起已逾七週無新功能 merge 至 main。
- 盤點現況（與程式碼一致，未變）：
  - `NewsArchiveSidebar` 仍為 `lg:sticky` 桌面側欄，手機全寬堆疊於主 feed 上方（`app/page.tsx` 僅 `lg:grid` 分欄，無 drawer）。
  - `StockTicker` 仍固定 `grid-cols-5`（`components/StockTicker.tsx:58`），小螢幕五欄過於擁擠。
  - 7/17–7/19 共三次 08:55 Cron 應已觸發，但 production 健康檢查仍未執行驗證。
  - `KEYWORD_WEIGHTS` 僅用於評分排序（`lib/news/taiwanStockNews.ts`），尚未映射到 `category_id` 寫入。
  - 7/18 規格書 commit `690a53e` 僅在工作分支，尚未 merge 至 main；main 仍停在 `9489ff8`；本日工作區曾落後至 2026-05-21，已還原並補齊。
- **今日建議執行順序**（強烈建議今日至少完成第 1 項，結束連續零功能 commit 循環）：
  1. **手機版歷史新聞 drawer + `StockTicker` RWD**（最高優先，已 pending 約 31 天，預估 1 個工作階段可完成）
     - `< lg`：標題列旁或右下角浮動「歷史新聞」按鈕；點擊開啟左側 drawer（或底部 sheet）；選文後關閉並捲動至主 feed。
     - `lg+`：維持現有左側 sticky sidebar，不改桌面行為。
     - `StockTicker`：`< sm` 改 `flex overflow-x-auto` 橫向捲動；`sm+` 維持五欄 grid。
     - 同步修正 archive 說明文案（手機版 sidebar 不在左側）。
     - 改動檔案：`components/NewsArchiveSidebar.tsx`、`app/page.tsx`、`components/StockTicker.tsx`。
  2. **Cron 健康檢查**（7/17–7/19 三次 08:55 Cron 應已觸發，適合今日補驗）
     - production `GET /api/cron/taiwan-stock-news?dryRun=1`（`Authorization: Bearer <CRON_SECRET>`）。
     - 查 Vercel Cron 執行紀錄與 runtime logs；確認近三日 feed 有新文章。
  3. **關鍵字新聞分類** — `lib/news/taiwanStockNews.ts` 將 `KEYWORD_WEIGHTS` 映射到既有 `categories` slug。
  4. **AI 回覆上下文** — `lib/ai/commentReply.ts` 納入同日主題、`detail`、來源 URL、相關股價。
  5. **最小單元測試** — `lib/dates/taipei.ts`、`lib/market/shouldRefreshQuotes.ts`、新聞去重。
- 本日自動化任務：產出 7/18 回顧、7/19 計劃，並即時更新本 md。
- **執行結果**：完成規格書同步至 2026-07-19（含 7/18 回顧與今日計劃）；功能實作待下一工作階段啟動。

### 2026-07-20

- 自動化 cron 回顧 7/19 工作：昨日完成規格書同步（commit `fbb5928` 於工作分支 `cursor/bc-cc07e08b-...`），**未開始任何功能程式碼**；自 5/27 最後功能 commit（`9489ff8`）起已逾七週無新功能 merge 至 main。
- 盤點現況（與程式碼一致，未變）：
  - `NewsArchiveSidebar` 仍為 `lg:sticky` 桌面側欄，手機全寬堆疊於主 feed 上方（`app/page.tsx` 僅 `lg:grid` 分欄，無 drawer）。
  - `StockTicker` 仍固定 `grid-cols-5`（`components/StockTicker.tsx:58`），小螢幕五欄過於擁擠。
  - 7/18–7/20 共三次 08:55 Cron 應已觸發，但 production 健康檢查仍未執行驗證。
  - `KEYWORD_WEIGHTS` 僅用於評分排序（`lib/news/taiwanStockNews.ts`），尚未映射到 `category_id` 寫入。
  - 7/19 規格書 commit `fbb5928` 僅在工作分支，尚未 merge 至 main；main 仍停在 `9489ff8`；本日工作區曾落後至 2026-05-21，已還原並補齊。
- **今日建議執行順序**（強烈建議今日至少完成第 1 項，結束連續零功能 commit 循環）：
  1. **手機版歷史新聞 drawer + `StockTicker` RWD**（最高優先，已 pending 約 32 天，預估 1 個工作階段可完成）
     - `< lg`：標題列旁或右下角浮動「歷史新聞」按鈕；點擊開啟左側 drawer（或底部 sheet）；選文後關閉並捲動至主 feed。
     - `lg+`：維持現有左側 sticky sidebar，不改桌面行為。
     - `StockTicker`：`< sm` 改 `flex overflow-x-auto` 橫向捲動；`sm+` 維持五欄 grid。
     - 同步修正 archive 說明文案（手機版 sidebar 不在左側）。
     - 改動檔案：`components/NewsArchiveSidebar.tsx`、`app/page.tsx`、`components/StockTicker.tsx`。
  2. **Cron 健康檢查**（7/18–7/20 三次 08:55 Cron 應已觸發，適合今日補驗）
     - production `GET /api/cron/taiwan-stock-news?dryRun=1`（`Authorization: Bearer <CRON_SECRET>`）。
     - 查 Vercel Cron 執行紀錄與 runtime logs；確認近三日 feed 有新文章。
  3. **關鍵字新聞分類** — `lib/news/taiwanStockNews.ts` 將 `KEYWORD_WEIGHTS` 映射到既有 `categories` slug。
  4. **AI 回覆上下文** — `lib/ai/commentReply.ts` 納入同日主題、`detail`、來源 URL、相關股價。
  5. **最小單元測試** — `lib/dates/taipei.ts`、`lib/market/shouldRefreshQuotes.ts`、新聞去重。
- 本日自動化任務：產出 7/19 回顧、7/20 計劃，並即時更新本 md。
- **執行結果**：完成規格書同步至 2026-07-20（含 7/19 回顧與今日計劃）；功能實作待下一工作階段啟動。

### 2026-07-21

- 自動化 cron 回顧 7/20 工作：昨日完成規格書同步（commit `ff98f38` 於工作分支 `cursor/bc-cc07e08b-...`），**未開始任何功能程式碼**；自 5/27 最後功能 commit（`9489ff8`）起已逾七週無新功能 merge 至 main。
- 盤點現況（與程式碼一致，未變）：
  - `NewsArchiveSidebar` 仍為 `lg:sticky` 桌面側欄，手機全寬堆疊於主 feed 上方（`app/page.tsx:573` 僅 `lg:grid` 分欄，無 drawer）。
  - `StockTicker` 仍固定 `grid-cols-5`（`components/StockTicker.tsx:58`），小螢幕五欄過於擁擠。
  - 7/19–7/21 共三次 08:55 Cron 應已觸發，但 production 健康檢查仍未執行驗證。
  - `KEYWORD_WEIGHTS` 僅用於評分排序（`lib/news/taiwanStockNews.ts`），尚未映射到 `category_id` 寫入。
  - 7/20 規格書 commit `ff98f38` 僅在工作分支，尚未 merge 至 main；main 仍停在 `9489ff8`；本日工作區曾落後至 2026-05-21，已還原並補齊。
- **今日建議執行順序**（強烈建議今日至少完成第 1 項，結束連續零功能 commit 循環）：
  1. **手機版歷史新聞 drawer + `StockTicker` RWD**（最高優先，已 pending 約 33 天，預估 1 個工作階段可完成）
     - `< lg`：標題列旁或右下角浮動「歷史新聞」按鈕；點擊開啟左側 drawer（或底部 sheet）；選文後關閉並捲動至主 feed。
     - `lg+`：維持現有左側 sticky sidebar，不改桌面行為。
     - `StockTicker`：`< sm` 改 `flex overflow-x-auto` 橫向捲動；`sm+` 維持五欄 grid。
     - 同步修正 archive 說明文案（手機版 sidebar 不在左側）。
     - 改動檔案：`components/NewsArchiveSidebar.tsx`、`app/page.tsx`、`components/StockTicker.tsx`。
  2. **Cron 健康檢查**（7/19–7/21 三次 08:55 Cron 應已觸發，適合今日補驗）
     - production `GET /api/cron/taiwan-stock-news?dryRun=1`（`Authorization: Bearer <CRON_SECRET>`）。
     - 查 Vercel Cron 執行紀錄與 runtime logs；確認近三日 feed 有新文章。
  3. **關鍵字新聞分類** — `lib/news/taiwanStockNews.ts` 將 `KEYWORD_WEIGHTS` 映射到既有 `categories` slug。
  4. **AI 回覆上下文** — `lib/ai/commentReply.ts` 納入同日主題、`detail`、來源 URL、相關股價。
  5. **最小單元測試** — `lib/dates/taipei.ts`、`lib/market/shouldRefreshQuotes.ts`、新聞去重。
- 本日自動化任務：產出 7/20 回顧、7/21 計劃，並即時更新本 md。
- **執行結果**：完成規格書同步至 2026-07-21（含 7/20 回顧與今日計劃）；功能實作待下一工作階段啟動。

### 2026-07-22

- 自動化 cron 回顧 7/21 工作：昨日完成規格書同步（commit `9581ef2` 於工作分支 `cursor/bc-1c92c460-...`），**未開始任何功能程式碼**；自 5/27 最後功能 commit（`9489ff8`）起已逾七週無新功能 merge 至 main。
- 盤點現況（與程式碼一致，未變）：
  - `NewsArchiveSidebar` 仍為 `lg:sticky` 桌面側欄，手機全寬堆疊於主 feed 上方（`app/page.tsx:573` 僅 `lg:grid` 分欄，無 drawer）。
  - `StockTicker` 仍固定 `grid-cols-5`（`components/StockTicker.tsx:58`），小螢幕五欄過於擁擠。
  - 7/20–7/22 共三次 08:55 Cron 應已觸發，但 production 健康檢查仍未執行驗證。
  - `KEYWORD_WEIGHTS` 僅用於評分排序（`lib/news/taiwanStockNews.ts`），尚未映射到 `category_id` 寫入。
  - 7/21 規格書 commit `9581ef2` 僅在工作分支，尚未 merge 至 main；main 仍停在 `9489ff8`；本日工作區曾落後至 2026-05-21，已還原並補齊。
- **今日建議執行順序**（強烈建議今日至少完成第 1 項，結束連續零功能 commit 循環）：
  1. **手機版歷史新聞 drawer + `StockTicker` RWD**（最高優先，已 pending 約 34 天，預估 1 個工作階段可完成）
     - `< lg`：標題列旁或右下角浮動「歷史新聞」按鈕；點擊開啟左側 drawer（或底部 sheet）；選文後關閉並捲動至主 feed。
     - `lg+`：維持現有左側 sticky sidebar，不改桌面行為。
     - `StockTicker`：`< sm` 改 `flex overflow-x-auto` 橫向捲動；`sm+` 維持五欄 grid。
     - 同步修正 archive 說明文案（手機版 sidebar 不在左側）。
     - 改動檔案：`components/NewsArchiveSidebar.tsx`、`app/page.tsx`、`components/StockTicker.tsx`。
  2. **Cron 健康檢查**（7/20–7/22 三次 08:55 Cron 應已觸發，適合今日補驗）
     - production `GET /api/cron/taiwan-stock-news?dryRun=1`（`Authorization: Bearer <CRON_SECRET>`）。
     - 查 Vercel Cron 執行紀錄與 runtime logs；確認近三日 feed 有新文章。
  3. **關鍵字新聞分類** — `lib/news/taiwanStockNews.ts` 將 `KEYWORD_WEIGHTS` 映射到既有 `categories` slug。
  4. **AI 回覆上下文** — `lib/ai/commentReply.ts` 納入同日主題、`detail`、來源 URL、相關股價。
  5. **最小單元測試** — `lib/dates/taipei.ts`、`lib/market/shouldRefreshQuotes.ts`、新聞去重。
- 本日自動化任務：產出 7/21 回顧、7/22 計劃，並即時更新本 md。
- **執行結果**：完成規格書同步至 2026-07-22（含 7/21 回顧與今日計劃）；功能實作待下一工作階段啟動。

### 2026-07-23

- 自動化 cron 回顧 7/22 工作：昨日完成規格書同步（commit `cd419ac` 於工作分支 `cursor/bc-1c92c460-...`），**未開始任何功能程式碼**；自 5/27 最後功能 commit（`9489ff8`）起已逾七週無新功能 merge 至 main。
- 盤點現況（與程式碼一致，未變）：
  - `NewsArchiveSidebar` 仍為 `lg:sticky` 桌面側欄，手機全寬堆疊於主 feed 上方（`app/page.tsx` 僅 `lg:grid` 分欄，無 drawer）。
  - `StockTicker` 仍固定 `grid-cols-5`（`components/StockTicker.tsx:58`），小螢幕五欄過於擁擠。
  - 7/21–7/23 共三次 08:55 Cron 應已觸發，但 production 健康檢查仍未執行驗證。
  - `KEYWORD_WEIGHTS` 僅用於評分排序（`lib/news/taiwanStockNews.ts`），尚未映射到 `category_id` 寫入。
  - 7/22 規格書 commit `cd419ac` 僅在工作分支，尚未 merge 至 main；main 仍停在 `9489ff8`；本日工作區曾落後至 2026-05-21，已還原並補齊。
- **今日建議執行順序**（強烈建議今日至少完成第 1 項，結束連續零功能 commit 循環）：
  1. **手機版歷史新聞 drawer + `StockTicker` RWD**（最高優先，已 pending 約 35 天，預估 1 個工作階段可完成）
     - `< lg`：標題列旁或右下角浮動「歷史新聞」按鈕；點擊開啟左側 drawer（或底部 sheet）；選文後關閉並捲動至主 feed。
     - `lg+`：維持現有左側 sticky sidebar，不改桌面行為。
     - `StockTicker`：`< sm` 改 `flex overflow-x-auto` 橫向捲動；`sm+` 維持五欄 grid。
     - 同步修正 archive 說明文案（手機版 sidebar 不在左側）。
     - 改動檔案：`components/NewsArchiveSidebar.tsx`、`app/page.tsx`、`components/StockTicker.tsx`。
  2. **Cron 健康檢查**（7/21–7/23 三次 08:55 Cron 應已觸發，適合今日補驗）
     - production `GET /api/cron/taiwan-stock-news?dryRun=1`（`Authorization: Bearer <CRON_SECRET>`）。
     - 查 Vercel Cron 執行紀錄與 runtime logs；確認近三日 feed 有新文章。
  3. **關鍵字新聞分類** — `lib/news/taiwanStockNews.ts` 將 `KEYWORD_WEIGHTS` 映射到既有 `categories` slug。
  4. **AI 回覆上下文** — `lib/ai/commentReply.ts` 納入同日主題、`detail`、來源 URL、相關股價。
  5. **最小單元測試** — `lib/dates/taipei.ts`、`lib/market/shouldRefreshQuotes.ts`、新聞去重。
- 本日自動化任務：產出 7/22 回顧、7/23 計劃，並即時更新本 md。
- **執行結果**：完成規格書同步至 2026-07-23（含 7/22 回顧與今日計劃）；功能實作待下一工作階段啟動。

### 2026-07-24

- 自動化 cron 回顧 7/23 工作：昨日完成規格書同步（commit `b92289c` 於工作分支 `cursor/bc-d557c459-...`），**未開始任何功能程式碼**；自 5/27 最後功能 commit（`9489ff8`）起已逾八週無新功能 merge 至 main。
- 盤點現況（與程式碼一致，未變）：
  - `NewsArchiveSidebar` 仍為 `lg:sticky` 桌面側欄，手機全寬堆疊於主 feed 上方（`app/page.tsx:573` 僅 `lg:grid` 分欄，無 drawer）。
  - `StockTicker` 仍固定 `grid-cols-5`（`components/StockTicker.tsx:58`），小螢幕五欄過於擁擠。
  - 7/22–7/24 共三次 08:55 Cron 應已觸發，但 production 健康檢查仍未執行驗證。
  - `KEYWORD_WEIGHTS` 僅用於評分排序（`lib/news/taiwanStockNews.ts`），尚未映射到 `category_id` 寫入。
  - 7/23 規格書 commit `b92289c` 僅在工作分支，尚未 merge 至 main；main 仍停在 `9489ff8`；本日工作區曾落後至 2026-05-21，已還原並補齊。
- **今日建議執行順序**（強烈建議今日至少完成第 1 項，結束連續零功能 commit 循環）：
  1. **手機版歷史新聞 drawer + `StockTicker` RWD**（最高優先，已 pending 約 36 天，預估 1 個工作階段可完成）
     - `< lg`：標題列旁或右下角浮動「歷史新聞」按鈕；點擊開啟左側 drawer（或底部 sheet）；選文後關閉並捲動至主 feed。
     - `lg+`：維持現有左側 sticky sidebar，不改桌面行為。
     - `StockTicker`：`< sm` 改 `flex overflow-x-auto` 橫向捲動；`sm+` 維持五欄 grid。
     - 同步修正 archive 說明文案（手機版 sidebar 不在左側）。
     - 改動檔案：`components/NewsArchiveSidebar.tsx`、`app/page.tsx`、`components/StockTicker.tsx`。
  2. **Cron 健康檢查**（7/22–7/24 三次 08:55 Cron 應已觸發，適合今日補驗）
     - production `GET /api/cron/taiwan-stock-news?dryRun=1`（`Authorization: Bearer <CRON_SECRET>`）。
     - 查 Vercel Cron 執行紀錄與 runtime logs；確認近三日 feed 有新文章。
  3. **關鍵字新聞分類** — `lib/news/taiwanStockNews.ts` 將 `KEYWORD_WEIGHTS` 映射到既有 `categories` slug。
  4. **AI 回覆上下文** — `lib/ai/commentReply.ts` 納入同日主題、`detail`、來源 URL、相關股價。
  5. **最小單元測試** — `lib/dates/taipei.ts`、`lib/market/shouldRefreshQuotes.ts`、新聞去重。
- 本日自動化任務：產出 7/23 回顧、7/24 計劃，並即時更新本 md。
- **執行結果**：完成規格書同步至 2026-07-24（含 7/23 回顧與今日計劃）；功能實作待下一工作階段啟動。

### 2026-07-25

- 自動化 cron 回顧 7/24 工作：昨日完成規格書同步（commit `7aea56b` 於工作分支 `cursor/bc-a46e2208-...`），**未開始任何功能程式碼**；自 5/27 最後功能 commit（`9489ff8`）起已逾八週無新功能 merge 至 main。
- 盤點現況（與程式碼一致，未變）：
  - `NewsArchiveSidebar` 仍為 `lg:sticky` 桌面側欄，手機全寬堆疊於主 feed 上方（`app/page.tsx:573` 僅 `lg:grid` 分欄，無 drawer）。
  - `StockTicker` 仍固定 `grid-cols-5`（`components/StockTicker.tsx:58`），小螢幕五欄過於擁擠。
  - 7/23–7/25 共三次 08:55 Cron 應已觸發，但 production 健康檢查仍未執行驗證。
  - `KEYWORD_WEIGHTS` 僅用於評分排序（`lib/news/taiwanStockNews.ts`），尚未映射到 `category_id` 寫入。
  - 7/24 規格書 commit `7aea56b` 僅在工作分支，尚未 merge 至 main；main 仍停在 `9489ff8`；本日工作區曾落後至 2026-05-21，已還原並補齊。
- **今日建議執行順序**（強烈建議今日至少完成第 1 項，結束連續零功能 commit 循環）：
  1. **手機版歷史新聞 drawer + `StockTicker` RWD**（最高優先，已 pending 約 37 天，預估 1 個工作階段可完成）
     - `< lg`：標題列旁或右下角浮動「歷史新聞」按鈕；點擊開啟左側 drawer（或底部 sheet）；選文後關閉並捲動至主 feed。
     - `lg+`：維持現有左側 sticky sidebar，不改桌面行為。
     - `StockTicker`：`< sm` 改 `flex overflow-x-auto` 橫向捲動；`sm+` 維持五欄 grid。
     - 同步修正 archive 說明文案（手機版 sidebar 不在左側）。
     - 改動檔案：`components/NewsArchiveSidebar.tsx`、`app/page.tsx`、`components/StockTicker.tsx`。
  2. **Cron 健康檢查**（7/23–7/25 三次 08:55 Cron 應已觸發，適合今日補驗）
     - production `GET /api/cron/taiwan-stock-news?dryRun=1`（`Authorization: Bearer <CRON_SECRET>`）。
     - 查 Vercel Cron 執行紀錄與 runtime logs；確認近三日 feed 有新文章。
  3. **關鍵字新聞分類** — `lib/news/taiwanStockNews.ts` 將 `KEYWORD_WEIGHTS` 映射到既有 `categories` slug。
  4. **AI 回覆上下文** — `lib/ai/commentReply.ts` 納入同日主題、`detail`、來源 URL、相關股價。
  5. **最小單元測試** — `lib/dates/taipei.ts`、`lib/market/shouldRefreshQuotes.ts`、新聞去重。
- 本日自動化任務：產出 7/24 回顧、7/25 計劃，並即時更新本 md。
- **執行結果**：完成規格書同步至 2026-07-25（含 7/24 回顧與今日計劃）；功能實作待下一工作階段啟動。

### 2026-07-26

- 自動化 cron 回顧 7/25 工作：昨日完成規格書同步（commit `a8837fa` 於工作分支 `cursor/bc-a46e2208-...`），**未開始任何功能程式碼**；自 5/27 最後功能 commit（`9489ff8`）起已逾八週無新功能 merge 至 main。
- 盤點現況（與程式碼一致，未變）：
  - `NewsArchiveSidebar` 仍為 `lg:sticky` 桌面側欄，手機全寬堆疊於主 feed 上方（`app/page.tsx:573` 僅 `lg:grid` 分欄，無 drawer）。
  - `StockTicker` 仍固定 `grid-cols-5`（`components/StockTicker.tsx:58`），小螢幕五欄過於擁擠。
  - 7/24–7/26 共三次 08:55 Cron 應已觸發，但 production 健康檢查仍未執行驗證。
  - `KEYWORD_WEIGHTS` 僅用於評分排序（`lib/news/taiwanStockNews.ts`），尚未映射到 `category_id` 寫入。
  - 7/25 規格書 commit `a8837fa` 僅在工作分支，尚未 merge 至 main；main 仍停在 `9489ff8`；本日工作區曾落後至 2026-05-21，已還原並補齊。
- **今日建議執行順序**（強烈建議今日至少完成第 1 項，結束連續零功能 commit 循環）：
  1. **手機版歷史新聞 drawer + `StockTicker` RWD**（最高優先，已 pending 約 38 天，預估 1 個工作階段可完成）
     - `< lg`：標題列旁或右下角浮動「歷史新聞」按鈕；點擊開啟左側 drawer（或底部 sheet）；選文後關閉並捲動至主 feed。
     - `lg+`：維持現有左側 sticky sidebar，不改桌面行為。
     - `StockTicker`：`< sm` 改 `flex overflow-x-auto` 橫向捲動；`sm+` 維持五欄 grid。
     - 同步修正 archive 說明文案（手機版 sidebar 不在左側）。
     - 改動檔案：`components/NewsArchiveSidebar.tsx`、`app/page.tsx`、`components/StockTicker.tsx`。
  2. **Cron 健康檢查**（7/24–7/26 三次 08:55 Cron 應已觸發，適合今日補驗）
     - production `GET /api/cron/taiwan-stock-news?dryRun=1`（`Authorization: Bearer <CRON_SECRET>`）。
     - 查 Vercel Cron 執行紀錄與 runtime logs；確認近三日 feed 有新文章。
  3. **關鍵字新聞分類** — `lib/news/taiwanStockNews.ts` 將 `KEYWORD_WEIGHTS` 映射到既有 `categories` slug。
  4. **AI 回覆上下文** — `lib/ai/commentReply.ts` 納入同日主題、`detail`、來源 URL、相關股價。
  5. **最小單元測試** — `lib/dates/taipei.ts`、`lib/market/shouldRefreshQuotes.ts`、新聞去重。
- 本日自動化任務：產出 7/25 回顧、7/26 計劃，並即時更新本 md。
- **執行結果**：完成規格書同步至 2026-07-26（含 7/25 回顧與今日計劃）；功能實作待下一工作階段啟動。

### 2026-07-27

- 自動化 cron 回顧 7/26 工作：昨日完成規格書同步（commit `4418b3b` 於工作分支 `cursor/bc-09bad1f5-...`），**未開始任何功能程式碼**；自 5/27 最後功能 commit（`9489ff8`）起已逾八週無新功能 merge 至 main。
- 盤點現況（與程式碼一致，未變）：
  - `NewsArchiveSidebar` 仍為 `lg:sticky` 桌面側欄，手機全寬堆疊於主 feed 上方（`app/page.tsx:573` 僅 `lg:grid` 分欄，無 drawer）。
  - `StockTicker` 仍固定 `grid-cols-5`（`components/StockTicker.tsx:58`），小螢幕五欄過於擁擠。
  - 7/25–7/27 共三次 08:55 Cron 應已觸發，但 production 健康檢查仍未執行驗證。
  - `KEYWORD_WEIGHTS` 僅用於評分排序（`lib/news/taiwanStockNews.ts`），尚未映射到 `category_id` 寫入。
  - 7/26 規格書 commit `4418b3b` 僅在工作分支，尚未 merge 至 main；main 仍停在 `9489ff8`；本日工作區曾落後至 2026-05-21，已還原並補齊。
- **今日建議執行順序**（強烈建議今日至少完成第 1 項，結束連續零功能 commit 循環）：
  1. **手機版歷史新聞 drawer + `StockTicker` RWD**（最高優先，已 pending 約 39 天，預估 1 個工作階段可完成）
     - `< lg`：標題列旁或右下角浮動「歷史新聞」按鈕；點擊開啟左側 drawer（或底部 sheet）；選文後關閉並捲動至主 feed。
     - `lg+`：維持現有左側 sticky sidebar，不改桌面行為。
     - `StockTicker`：`< sm` 改 `flex overflow-x-auto` 橫向捲動；`sm+` 維持五欄 grid。
     - 同步修正 archive 說明文案（手機版 sidebar 不在左側）。
     - 改動檔案：`components/NewsArchiveSidebar.tsx`、`app/page.tsx`、`components/StockTicker.tsx`。
  2. **Cron 健康檢查**（7/25–7/27 三次 08:55 Cron 應已觸發，適合今日補驗）
     - production `GET /api/cron/taiwan-stock-news?dryRun=1`（`Authorization: Bearer <CRON_SECRET>`）。
     - 查 Vercel Cron 執行紀錄與 runtime logs；確認近三日 feed 有新文章。
  3. **關鍵字新聞分類** — `lib/news/taiwanStockNews.ts` 將 `KEYWORD_WEIGHTS` 映射到既有 `categories` slug。
  4. **AI 回覆上下文** — `lib/ai/commentReply.ts` 納入同日主題、`detail`、來源 URL、相關股價。
  5. **最小單元測試** — `lib/dates/taipei.ts`、`lib/market/shouldRefreshQuotes.ts`、新聞去重。
- 本日自動化任務：產出 7/26 回顧、7/27 計劃，並即時更新本 md。
- **執行結果**：完成規格書同步至 2026-07-27（含 7/26 回顧與今日計劃）；功能實作待下一工作階段啟動。

### 2026-07-28

- 自動化 cron 回顧 7/27 工作：7/27 當日**無任何新 commit**（main 仍停在 `9489ff8`）；7/26–7/27 的規格同步已於工作分支完成（`4418b3b` 同步至 2026-07-26、`2d97e67` 同步至 2026-07-27），**仍未開始任何功能程式碼**；自 5/27 最後功能 commit 起已逾九週無新功能 merge 至 main。
- 盤點現況（與程式碼一致，未變）：
  - `NewsArchiveSidebar` 仍為 `lg:sticky` 桌面側欄，手機全寬堆疊於主 feed 上方（`app/page.tsx:573` 僅 `lg:grid` 分欄，無 drawer）。
  - `StockTicker` 仍固定 `grid-cols-5`（`components/StockTicker.tsx:58`），小螢幕五欄過於擁擠。
  - 7/26–7/28 共三次 08:55 Cron 應已觸發，但 production 健康檢查仍未執行驗證。
  - `KEYWORD_WEIGHTS` 僅用於評分排序（`lib/news/taiwanStockNews.ts`），尚未映射到 `category_id` 寫入。
  - 歷次規格書 commit 僅在工作分支，尚未 merge 至 main；本日工作區曾落後至 2026-05-21，已還原並補齊至 2026-07-28。
- **今日建議執行順序**（強烈建議今日至少完成第 1 項，結束連續零功能 commit 循環）：
  1. **手機版歷史新聞 drawer + `StockTicker` RWD**（最高優先，已 pending 約 40 天，預估 1 個工作階段可完成）
     - `< lg`：標題列旁或右下角浮動「歷史新聞」按鈕；點擊開啟左側 drawer（或底部 sheet）；選文後關閉並捲動至主 feed。
     - `lg+`：維持現有左側 sticky sidebar，不改桌面行為。
     - `StockTicker`：`< sm` 改 `flex overflow-x-auto` 橫向捲動；`sm+` 維持五欄 grid。
     - 同步修正 archive 說明文案（手機版 sidebar 不在左側）。
     - 改動檔案：`components/NewsArchiveSidebar.tsx`、`app/page.tsx`、`components/StockTicker.tsx`。
  2. **Cron 健康檢查**（7/26–7/28 三次 08:55 Cron 應已觸發，適合今日補驗）
     - production `GET /api/cron/taiwan-stock-news?dryRun=1`（`Authorization: Bearer <CRON_SECRET>`）。
     - 查 Vercel Cron 執行紀錄與 runtime logs；確認近三日 feed 有新文章。
  3. **關鍵字新聞分類** — `lib/news/taiwanStockNews.ts` 將 `KEYWORD_WEIGHTS` 映射到既有 `categories` slug。
  4. **AI 回覆上下文** — `lib/ai/commentReply.ts` 納入同日主題、`detail`、來源 URL、相關股價。
  5. **最小單元測試** — `lib/dates/taipei.ts`、`lib/market/shouldRefreshQuotes.ts`、新聞去重。
- 本日自動化任務：產出 7/27 回顧、7/28 計劃，並即時更新本 md。
- **執行結果**：完成規格書同步至 2026-07-28（含 7/27 回顧與今日計劃）；功能實作待下一工作階段啟動。

### 2026-07-29

- 自動化 cron 回顧 7/28 工作：7/28 完成規格書同步（commit `b5e1bb5` 於工作分支 `cursor/bc-09bad1f5-...`），**未開始任何功能程式碼**；自 5/27 最後功能 commit（`9489ff8`）起已逾九週無新功能 merge 至 main。
- **7/29 空窗**：無自動化執行、無新 commit；main 仍停在 `9489ff8`。
- 盤點現況（與程式碼一致，未變）：
  - `NewsArchiveSidebar` 仍為 `lg:sticky` 桌面側欄，手機全寬堆疊於主 feed 上方（`app/page.tsx:573` 僅 `lg:grid` 分欄，無 drawer）。
  - `StockTicker` 仍固定 `grid-cols-5`（`components/StockTicker.tsx:58`），小螢幕五欄過於擁擠。
  - 7/27–7/29 共三次 08:55 Cron 應已觸發，但 production 健康檢查仍未執行驗證。
  - `KEYWORD_WEIGHTS` 僅用於評分排序（`lib/news/taiwanStockNews.ts`），尚未映射到 `category_id` 寫入。
- **今日建議執行順序**（當日未執行，順延至 7/30）：
  1. 手機版歷史新聞 drawer + `StockTicker` RWD（最高優先，已 pending 約 41 天）
  2. Cron 健康檢查（7/27–7/29 三次 08:55 Cron 應已觸發）
  3. 關鍵字新聞分類
  4. AI 回覆上下文
  5. 最小單元測試

### 2026-07-30

- 自動化 cron 回顧 7/29 工作：**7/29 無任何新 commit、無自動化執行**；main 仍停在 `9489ff8`；功能實作持續停滯。
- **7/30 空窗**：無自動化執行、無新 commit；連續兩日（7/29–7/30）無規格書同步或功能開發。
- 盤點現況（與程式碼一致，未變）：
  - `NewsArchiveSidebar` 仍為 `lg:sticky` 桌面側欄，手機全寬堆疊於主 feed 上方，無 drawer。
  - `StockTicker` 仍固定 `grid-cols-5`，小螢幕五欄過於擁擠。
  - 7/28–7/30 共三次 08:55 Cron 應已觸發，但 production 健康檢查仍未執行驗證。
  - `KEYWORD_WEIGHTS` 僅用於評分排序，尚未映射到 `category_id` 寫入。
  - 7/28 規格書 commit `b5e1bb5` 僅在工作分支，尚未 merge 至 main。
- **昨日（7/30）結論**：無實質開發進度；手機版 RWD 已 pending 約 42 天，為當前最大技術債。
- **今日建議執行順序**（當日未執行，順延至 7/31）：
  1. 手機版歷史新聞 drawer + `StockTicker` RWD（最高優先，已 pending 約 42 天）
  2. Cron 健康檢查（7/28–7/30 三次 08:55 Cron 應已觸發）
  3. 關鍵字新聞分類
  4. AI 回覆上下文
  5. 最小單元測試

### 2026-07-31

- 自動化 cron 回顧 7/30 工作：**7/30 無任何新 commit、無自動化執行**；自 7/28 規格書同步（`b5e1bb5`）起已連續三日（7/29–7/31 晨）無新進度；main 仍停在 `9489ff8`。
- 盤點現況（與程式碼一致，未變）：
  - `NewsArchiveSidebar` 仍為 `lg:sticky` 桌面側欄，手機全寬堆疊於主 feed 上方（`app/page.tsx:573` 僅 `lg:grid` 分欄，無 drawer）。
  - `StockTicker` 仍固定 `grid-cols-5`（`components/StockTicker.tsx:58`），小螢幕五欄過於擁擠。
  - 7/29–7/31 共三次 08:55 Cron 應已觸發，但 production 健康檢查仍未執行驗證。
  - `KEYWORD_WEIGHTS` 僅用於評分排序（`lib/news/taiwanStockNews.ts`），尚未映射到 `category_id` 寫入。
  - 歷次規格書 commit 僅在工作分支，尚未 merge 至 main；本日工作區曾落後至 2026-05-21，已還原並補齊至 2026-07-31。
- **今日建議執行順序**（強烈建議今日至少完成第 1 項，結束連續零功能 commit 循環）：
  1. **手機版歷史新聞 drawer + `StockTicker` RWD**（最高優先，已 pending 約 43 天，預估 1 個工作階段可完成）
     - `< lg`：標題列旁或右下角浮動「歷史新聞」按鈕；點擊開啟左側 drawer（或底部 sheet）；選文後關閉並捲動至主 feed。
     - `lg+`：維持現有左側 sticky sidebar，不改桌面行為。
     - `StockTicker`：`< sm` 改 `flex overflow-x-auto` 橫向捲動；`sm+` 維持五欄 grid。
     - 同步修正 archive 說明文案（手機版 sidebar 不在左側）。
     - 改動檔案：`components/NewsArchiveSidebar.tsx`、`app/page.tsx`、`components/StockTicker.tsx`。
  2. **Cron 健康檢查**（7/29–7/31 三次 08:55 Cron 應已觸發，適合今日補驗）
     - production `GET /api/cron/taiwan-stock-news?dryRun=1`（`Authorization: Bearer <CRON_SECRET>` 或 `x-vercel-cron: 1`）。
     - 查 Vercel Cron 執行紀錄與 runtime logs；確認近三日 feed 有新文章。
  3. **關鍵字新聞分類** — `lib/news/taiwanStockNews.ts` 將 `KEYWORD_WEIGHTS` 映射到既有 `categories` slug。
  4. **AI 回覆上下文** — `lib/ai/commentReply.ts` 納入同日主題、`detail`、來源 URL、相關股價。
  5. **最小單元測試** — `lib/dates/taipei.ts`、`lib/market/shouldRefreshQuotes.ts`、新聞去重。
- 本日自動化任務：產出 7/30 回顧、7/31 計劃，並即時更新本 md。
- **執行結果**：完成規格書同步至 2026-07-31（含 7/30 回顧、7/29–7/30 空窗記錄與今日計劃）；功能實作待下一工作階段啟動。

### 2026-08-01 至 2026-08-14（空窗期）

- **8/1–8/14 空窗**：自 7/31 規格書同步（`cc1e7b7`）起連續兩週無自動化執行、無新 commit；main 仍停在 `9489ff8`（最後功能 commit 為 2026-05-27）。
- 盤點現況（與程式碼一致，未變）：
  - `NewsArchiveSidebar` 仍為 `lg:sticky` 桌面側欄，手機全寬堆疊於主 feed 上方，無 drawer。
  - `StockTicker` 仍固定 `grid-cols-5`（`components/StockTicker.tsx:58`），小螢幕五欄過於擁擠。
  - 8/1–8/14 共 14 次 08:55 Cron 應已觸發，但 production 健康檢查仍未執行驗證。
  - `KEYWORD_WEIGHTS` 僅用於評分排序（`lib/news/taiwanStockNews.ts`），尚未映射到 `category_id` 寫入。
  - 歷次規格書 commit 僅在工作分支，尚未 merge 至 main。
- **結論**：兩週零進度；手機版 RWD 已 pending 約 57 天，為當前最大技術債；7/31 排定的五項任務全部順延。

### 2026-08-15

- 自動化 cron 回顧 8/14 工作：**8/14 無任何新 commit、無自動化執行**；main 仍停在 `9489ff8`。
- **8/15 空窗**：無自動化執行、無新 commit；連續第 15 日無規格書同步或功能開發。
- 盤點現況（與程式碼一致，未變）：
  - 手機版歷史新聞 drawer 與 `StockTicker` RWD 仍未實作。
  - 8/13–8/15 共三次 08:55 Cron 應已觸發，但 production 健康檢查仍未執行驗證。
- **昨日（8/15）結論**：無實質開發進度；所有待辦自 7/31 起持續順延。

### 2026-08-16

- 自動化 cron 回顧 8/15 工作：**8/15 無任何新 commit、無自動化執行**；自 7/31 規格書同步起已連續 16 日無新進度；main 仍停在 `9489ff8`。
- 盤點現況（與程式碼一致，未變）：
  - `NewsArchiveSidebar` 仍為 `lg:sticky` 桌面側欄，手機全寬堆疊於主 feed 上方（`app/page.tsx` 僅 `lg:grid` 分欄，無 drawer）。
  - `StockTicker` 仍固定 `grid-cols-5`（`components/StockTicker.tsx:58`），小螢幕五欄過於擁擠。
  - 8/13–8/16 共四次 08:55 Cron 應已觸發，但 production 健康檢查仍未執行驗證。
  - `KEYWORD_WEIGHTS` 僅用於評分排序，尚未映射到 `category_id` 寫入。
  - 本日工作區曾落後至 2026-05-21，已從 `cursor/bc-f5d1a682-...` 還原並補齊至 2026-08-16。
- **今日建議執行順序**（強烈建議今日至少完成第 1 項，結束連續零功能 commit 循環）：
  1. **手機版歷史新聞 drawer + `StockTicker` RWD**（最高優先，已 pending 約 59 天，預估 1 個工作階段可完成）
     - `< lg`：標題列旁或右下角浮動「歷史新聞」按鈕；點擊開啟左側 drawer（或底部 sheet）；選文後關閉並捲動至主 feed。
     - `lg+`：維持現有左側 sticky sidebar，不改桌面行為。
     - `StockTicker`：`< sm` 改 `flex overflow-x-auto` 橫向捲動；`sm+` 維持五欄 grid。
     - 同步修正 archive 說明文案（手機版 sidebar 不在左側）。
     - 改動檔案：`components/NewsArchiveSidebar.tsx`、`app/page.tsx`、`components/StockTicker.tsx`。
  2. **Cron 健康檢查**（8/13–8/16 四次 08:55 Cron 應已觸發，適合今日補驗）
     - production `GET /api/cron/taiwan-stock-news?dryRun=1`（`Authorization: Bearer <CRON_SECRET>` 或 `x-vercel-cron: 1`）。
     - 查 Vercel Cron 執行紀錄與 runtime logs；確認近三日 feed 有新文章。
  3. **關鍵字新聞分類** — `lib/news/taiwanStockNews.ts` 將 `KEYWORD_WEIGHTS` 映射到既有 `categories` slug。
  4. **AI 回覆上下文** — `lib/ai/commentReply.ts` 納入同日主題、`detail`、來源 URL、相關股價。
  5. **最小單元測試** — `lib/dates/taipei.ts`、`lib/market/shouldRefreshQuotes.ts`、新聞去重。
- 本日自動化任務：產出 8/15 回顧、8/16 計劃，並即時更新本 md。
- **執行結果**：完成規格書同步至 2026-08-16（含 8/1–8/14 空窗、8/15 回顧與今日計劃）；功能實作待下一工作階段啟動。

### 2026-08-17 至 2026-08-23（空窗期）

- **8/17–8/23 空窗**：自 8/16 規格書同步（`fb49ba2`）起連續 7 日無自動化執行、無新 commit；main 仍停在 `9489ff8`（最後功能 commit 為 2026-05-27）。
- 盤點現況（與程式碼一致，未變）：
  - `NewsArchiveSidebar` 仍為 `lg:sticky` 桌面側欄，手機全寬堆疊於主 feed 上方（`app/page.tsx:573` 僅 `lg:grid` 分欄，無 drawer）。
  - `StockTicker` 仍固定 `grid-cols-5`（`components/StockTicker.tsx:58`），小螢幕五欄過於擁擠。
  - 8/17–8/23 共 7 次 08:55 Cron 應已觸發，但 production 健康檢查仍未執行驗證。
  - `KEYWORD_WEIGHTS` 僅用於評分排序（`lib/news/taiwanStockNews.ts`），尚未映射到 `category_id` 寫入。
  - 歷次規格書 commit 僅在工作分支，尚未 merge 至 main。
- **結論**：一週零進度；手機版 RWD 已 pending 約 66 天，為當前最大技術債；8/16 排定的五項任務全部順延。

### 2026-08-24

- 自動化 cron 回顧 8/23 工作：**8/23 無任何新 commit、無自動化執行**；main 仍停在 `9489ff8`。
- **8/24 空窗**：無自動化執行、無新 commit；連續第 8 日無規格書同步或功能開發。
- 盤點現況（與程式碼一致，未變）：
  - 手機版歷史新聞 drawer 與 `StockTicker` RWD 仍未實作。
  - 8/22–8/24 共三次 08:55 Cron 應已觸發，但 production 健康檢查仍未執行驗證。
  - 股價僅在頁面載入與點擊「Siami Feed」標題時刷新，盤中無定時輪詢。
  - 搜尋/分類篩選僅作用於今日 feed，archive 模式尚未整合。
- **昨日（8/24）結論**：無實質開發進度；所有待辦自 8/16 起持續順延。

### 2026-08-25

- 自動化 cron 回顧 8/24 工作：**8/24 無任何新 commit、無自動化執行**；自 8/16 規格書同步起已連續 8 日無新進度；main 仍停在 `9489ff8`。
- 盤點現況（與程式碼一致，未變）：
  - `NewsArchiveSidebar` 仍為 `lg:sticky` 桌面側欄，手機全寬堆疊於主 feed 上方（`app/page.tsx:573` 僅 `lg:grid` 分欄，無 drawer）。
  - `StockTicker` 仍固定 `grid-cols-5`（`components/StockTicker.tsx:58`），小螢幕五欄過於擁擠。
  - 8/22–8/25 共四次 08:55 Cron 應已觸發，但 production 健康檢查仍未執行驗證。
  - `KEYWORD_WEIGHTS` 僅用於評分排序，尚未映射到 `category_id` 寫入。
  - 本日工作區曾落後至 2026-05-21，已從 `cursor/bc-a80ee894-...` 還原並補齊至 2026-08-25。
- **今日建議執行順序**（強烈建議今日至少完成第 1 項，結束連續零功能 commit 循環）：
  1. **手機版歷史新聞 drawer + `StockTicker` RWD**（最高優先，已 pending 約 68 天，預估 1 個工作階段可完成）
     - `< lg`：標題列旁或右下角浮動「歷史新聞」按鈕；點擊開啟左側 drawer（或底部 sheet）；選文後關閉並捲動至主 feed。
     - `lg+`：維持現有左側 sticky sidebar，不改桌面行為。
     - `StockTicker`：`< sm` 改 `flex overflow-x-auto` 橫向捲動；`sm+` 維持五欄 grid。
     - 同步修正 archive 說明文案（手機版 sidebar 不在左側）。
     - 改動檔案：`components/NewsArchiveSidebar.tsx`、`app/page.tsx`、`components/StockTicker.tsx`。
  2. **Cron 健康檢查**（8/22–8/25 四次 08:55 Cron 應已觸發，適合今日補驗）
     - production `GET /api/cron/taiwan-stock-news?dryRun=1`（`Authorization: Bearer <CRON_SECRET>` 或 `x-vercel-cron: 1`）。
     - 查 Vercel Cron 執行紀錄與 runtime logs；確認近三日 feed 有新文章。
  3. **關鍵字新聞分類** — `lib/news/taiwanStockNews.ts` 將 `KEYWORD_WEIGHTS` 映射到既有 `categories` slug。
  4. **AI 回覆上下文** — `lib/ai/commentReply.ts` 納入同日主題、`detail`、來源 URL、相關股價。
  5. **最小單元測試** — `lib/dates/taipei.ts`、`lib/market/shouldRefreshQuotes.ts`、新聞去重。
- 本日自動化任務：產出 8/24 回顧、8/25 計劃，並即時更新本 md。
- **執行結果**：完成規格書同步至 2026-08-25（含 8/17–8/23 空窗、8/24 回顧與今日計劃）；功能實作待下一工作階段啟動。

### 2026-05-19 至 2026-05-20 既有進度摘要

- 完成 Vercel production 部署。
- 完成黑色主題、白字與橘色重點 UI。
- 完成 Supabase `posts` / `categories` feed。
- 完成留言功能與 `comments` migration。
- 修復既有 `comments.content NOT NULL` 導致留言失敗的問題。
- 完成 Gemini API key 設定後的 production redeploy。
- 驗證 Gemini API 生效：不再回傳「尚未啟用 AI」fallback。
- 建立專案專屬 git sync workflow，要求每次修改前確認本地與 GitHub 遠端一致。

