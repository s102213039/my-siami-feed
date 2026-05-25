# My Siami Feed - Cursor 開發規格書

最後更新：2026-05-25

## 1. 專案基本資訊與現狀

- 專案名稱：My Siami Feed
- 線上預覽：https://my-siami-feed.vercel.app/
- 當前進度：約 68%（核心 feed、留言 AI、新聞 Cron（含 Vercel 排程驗證）、股價 ticker、今日/歷史新聞、RSS 原文 `detail` 已完成；待 RWD 精修、新聞分類、AI 上下文、production migration 套用與測試）
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

- `app/page.tsx`：首頁今日 feed、歷史新聞瀏覽、搜尋、分類、展開討論、留言表單
- `app/api/comments/route.ts`：留言讀取與建立 API
- `app/api/cron/taiwan-stock-news/route.ts`、`app/api/cron/fetch-news/route.ts`：每日新聞 Cron（Hermes 相容別名）
- `app/api/market-quotes/route.ts`：Yahoo Finance 股價 API
- `components/PostCard.tsx`：文章卡片（預設顯示正文）、展開討論區塊
- `components/NewsArchiveSidebar.tsx`：左側依台北日期分組的歷史新聞列表
- `components/StockTicker.tsx`：首頁五檔即時股價列
- `lib/dates/taipei.ts`：台北時區日期 key 與顯示格式
- `lib/market/shouldRefreshQuotes.ts`：盤中才刷新股價的判斷
- `lib/supabase.ts`：Supabase client
- `lib/ai/commentReply.ts`：Gemini / 行情資料 / fallback 回覆邏輯
- `lib/news/taiwanStockNews.ts`：RSS 收集、評分、去重、寫入 posts
- `lib/market/stockQuotes.ts`：Yahoo chart 行情解析
- `lib/types.ts`：共用型別
- `vercel.json`：Cron 排程（UTC 00:55 = 台灣 08:55）
- `supabase/migrations/20260519160000_add_comments.sql`：comments 表相容 migration
- `supabase/migrations/20260523120000_add_posts_detail.sql`：`posts.detail` 保存 RSS 原文內文

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
- [x] 主畫面預設顯示台北時區「今日」新聞
- [x] 左側歷史新聞依日期瀏覽（`NewsArchiveSidebar`）
- [x] 新聞卡片進入主畫面即可閱讀正文（留言區仍收合）
- [x] 盤中才自動刷新股價（`shouldRefreshStockQuotes`）
- [x] 新聞抓取寫入 `posts.detail`（RSS 原文），主畫面優先顯示 `detail`
- [x] Vercel Cron 以 `x-vercel-cron` header 通過授權（避免排程 401 靜默失敗）

### 未完成 / 待調整

- [ ] 頁面細節與 RWD：股價列小螢幕、歷史側欄手機版、列表資訊密度
- [x] 展開討論筆數：列表初始狀態應直接顯示實際留言數，而不是打開後才更新
- [x] 即時股價展示元件
- [x] 每日上午 08:55（台灣時間）自動抓取台股相關重大新聞
- [x] 新聞資料來源策略與去重策略
- [ ] 新聞分類自動化
- [ ] AI 回覆品質提升：需要更多文章上下文、可引用來源、避免只根據單篇短內容回答
- [ ] 測試策略：目前尚無正式 test script / e2e test

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
     - 2026-05-24 修復：`/api/cron/taiwan-stock-news` 信任 `x-vercel-cron: 1`，手動觸發仍可用 `Authorization: Bearer <CRON_SECRET>`；`maxDuration` 調為 60 秒（commit `ceecfb9`）。

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

3. `[doing]` 頁面細節與 RWD 優化
   - 已完成：今日/歷史新聞分流、卡片預設顯示正文、點標題展開、點 Siami Feed 回到今日。
   - 待完成：`StockTicker` 小螢幕橫向捲動或兩列網格；`NewsArchiveSidebar` 手機版抽屜或折疊；`PostCard` 標題/摘要行數微調。
   - 驗收：手機與桌面無明顯跑版（對應第 5 節 DoD #3）。

4. `[todo]` 新聞分類自動化
   - 現況：`lib/news/taiwanStockNews.ts` 固定 `FINANCE_CATEGORY_SLUG = 'finance'`。
   - 目標：依標題/摘要關鍵字映射到 Supabase 既有 `categories`（例如半導體、航運、總經），無法判斷時 fallback `finance`。
   - 注意：新增 category slug 前需確認 DB 已有對應列，避免 FK 失敗。

5. `[todo]` AI 留言回覆品質提升
   - 現況：`lib/ai/commentReply.ts` 主要使用單篇 post 欄位 + 可選台積電行情。
   - 目標：納入同串留言摘要、文章 `source_url` 重點、必要時引用 RSS 來源名稱；減少脫離上下文的泛用句。
   - 注意：仍只使用 Google Gemini；不可引入 AI Gateway / OpenAI。

6. `[todo]` 測試與回歸防護
   - 目標：為 `/api/market-quotes`、`/api/cron/*?dryRun=1` 建立最小 smoke test（Vitest 或 route handler 單元測試）。
   - 可先不覆蓋完整 e2e，但 CI 應能擋住行情解析與 RSS 解析 regressions。

7. `[done]` 主畫面今日新聞與歷史日期瀏覽
   - 主區預設只顯示台北時區當日新聞；較早新聞由左側 `NewsArchiveSidebar` 依日期分組瀏覽。
   - 點側欄標題可在主區展開該篇；點 Siami Feed 標題回到今日視圖。
   - 股價僅在台股盤中時段自動刷新（`lib/market/shouldRefreshQuotes.ts`）。
   - commit：`63d89ff`（2026-05-24）。

8. `[done]` 新聞卡片預設顯示文章正文
   - `PostCard` 新增 `showArticleBody`，將 `content` 移出「展開討論」區，進入主畫面即可閱讀全文。
   - 留言表單與 AI 回覆仍維持在展開討論區內。
   - commit：`53ae254`（2026-05-24）。

9. `[done]` RSS 原文內文（`posts.detail`）
   - migration `20260523120000_add_posts_detail.sql` 新增 `posts.detail` text 欄位。
   - `lib/news/taiwanStockNews.ts` 抓取時解析 RSS `content`/`description`，無內文則跳過不入庫；寫入 `detail`（截斷上限 8000 字）。
   - `PostCard` 優先顯示 `detail`；`content` 作為 AI 整理摘要，僅在與 `detail` 不同時顯示。
   - 舊文無 `detail` 時行為與先前一致（僅摘要）。
   - commit：`80a3202`（2026-05-24）。

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

### 2026-05-22

- Git 無新 commit；`main` 與功能分支內容與 5/21 收工狀態一致。
- 推測為部署穩定期：Vercel 上已具備新聞 Cron（08:55 台灣時間）與股價 ticker，待觀察 production 排程與 UI 實際表現。
- 建議 PM 目視確認：首頁五檔股價是否單列不裁切、隔日 feed 是否有新 Hermes/Google News 金融新聞寫入。

### 2026-05-23

- 每日自動化檢視（獨立 docs commit `16ba6de`，部分分支尚未 merge 至當前功能分支；本檔已手動合併內容）。
- 進度調整為約 55%，補齊主要檔案清單與第 4 節待辦 3–6。
- 第 4 節兩大功能（新聞 Cron、即時股價）維持 `[done]`；當日無程式碼變更，重心為規劃下一階段。
- 當日建議優先順序（由易到難）：
  1. 頁面細節與 RWD 優化
  2. 新聞分類自動化
  3. AI 留言回覆品質
  4. Cron / market-quotes smoke test
- 若 production 新聞 Cron 未如期寫入，先查 Vercel Cron logs 與 `CRON_SECRET`，勿在未確認前改 schema。

### 2026-05-24

- 完成主畫面今日/歷史新聞 UX（`63d89ff`）：
  - 新增 `lib/dates/taipei.ts`、`components/NewsArchiveSidebar.tsx`、`lib/market/shouldRefreshQuotes.ts`。
  - 重構 `app/page.tsx`：`feedView` 區分 today / archive，主區預設今日、側欄瀏覽歷史。
  - 盤中才刷新股價，減少非交易時段對 Yahoo API 的請求。
- 完成新聞卡片預設顯示正文（`53ae254`）：
  - `PostCard` 預設渲染 `content`，摘要僅在與正文不同時顯示；討論區仍收合。
- 完成 RSS 原文 `detail`（`80a3202`）：
  - Supabase migration、`taiwanStockNews` 寫入邏輯、`PostCard` 優先顯示 `detail`。
- 修復 Vercel Cron 授權（`ceecfb9`）：
  - 排程請求僅比對 `CRON_SECRET` 曾導致 401 靜默失敗；改信任 `x-vercel-cron` header。
- 更新本規格書（commit `2428523`）：進度約 65%，第 4 節項目 7–8 標 `[done]`，項目 3 為 `[doing]`。

### 2026-05-25

- 每日自動化檢視（cron `0 1 * * *`）：合併 5/24 晚間程式碼與規格書，進度調整為約 68%。
- **昨日（5/24）收穫摘要**：今日/歷史 feed UX、卡片正文、`posts.detail`、Cron 排程授權修復——產品已可「讀全文」且排程較不易靜默失敗。
- **今日建議優先順序**（由驗證到功能）：
  1. **Production 驗證**：確認 Supabase 已套用 `20260523120000_add_posts_detail.sql`；隔日 08:55 後檢查 Vercel Cron logs 是否有新文且含 `detail`。
  2. `[doing]` 項目 3 RWD：`StockTicker` 手機橫捲、`NewsArchiveSidebar` 手機抽屜/折疊。
  3. `[todo]` 項目 4 新聞分類自動化（關鍵字映射既有 `categories`）。
  4. `[todo]` 項目 6 最小 smoke test（`market-quotes`、`cron?dryRun=1`）。
  5. `[todo]` 項目 5 AI 留言上下文（同串留言 + `detail` 摘要，控制 token）。
- **風險提醒**：`detail` migration 未在 production 套用時，新 Cron 寫入可能失敗；優先於 UI 優化前確認 DB。

### 2026-05-19 至 2026-05-20 既有進度摘要

- 完成 Vercel production 部署。
- 完成黑色主題、白字與橘色重點 UI。
- 完成 Supabase `posts` / `categories` feed。
- 完成留言功能與 `comments` migration。
- 修復既有 `comments.content NOT NULL` 導致留言失敗的問題。
- 完成 Gemini API key 設定後的 production redeploy。
- 驗證 Gemini API 生效：不再回傳「尚未啟用 AI」fallback。
- 建立專案專屬 git sync workflow，要求每次修改前確認本地與 GitHub 遠端一致。

