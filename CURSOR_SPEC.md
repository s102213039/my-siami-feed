# My Siami Feed - Cursor 開發規格書

最後更新：2026-05-27

## 1. 專案基本資訊與現狀

- 專案名稱：My Siami Feed
- 線上預覽：https://my-siami-feed.vercel.app/
- 當前進度：約 58%
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

- `app/page.tsx`：首頁 feed、今日/歷史新聞切換、搜尋、分類、展開討論、留言表單
- `app/api/comments/route.ts`：留言讀取與建立 API
- `app/api/cron/taiwan-stock-news/route.ts`：每日新聞 Cron（支援 `x-vercel-cron` 與 `CRON_SECRET`）
- `components/PostCard.tsx`：文章卡片、主畫面內文展示、展開討論區塊
- `components/NewsArchiveSidebar.tsx`：左側依台北日期瀏覽歷史新聞
- `components/StockTicker.tsx`：五檔即時股價列
- `lib/supabase.ts`：Supabase client
- `lib/ai/commentReply.ts`：Gemini / 行情資料 / fallback 回覆邏輯（prompt 已納入 `detail`）
- `lib/news/taiwanStockNews.ts`：RSS 抓取、去重、`detail` 寫入
- `lib/dates/taipei.ts`：台北時區日期 key 與顯示格式
- `lib/market/shouldRefreshQuotes.ts`：盤中才刷新股價的判斷
- `lib/types.ts`：共用型別
- `supabase/migrations/20260519160000_add_comments.sql`：comments 表相容 migration
- `supabase/migrations/20260523120000_add_posts_detail.sql`：posts.detail 欄位（RSS 原文內文）

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
- [x] 主畫面預設顯示台北時區「今日」新聞，左側歷史日期列表瀏覽舊文
- [x] 新聞卡片主畫面預設顯示正文（`detail` 優先，無則 `content`）
- [x] RSS 原文寫入 `posts.detail`，新寫入文章需有內文才入庫
- [x] Vercel Cron 以 `x-vercel-cron` header 授權，避免排程 401 靜默失敗
- [x] 盤中才自動刷新股價；點標題回今日視圖

### 未完成 / 待調整

- [ ] 頁面細節優化：資訊密度、手機版、歷史側欄與文章列表視覺層次
- [x] 展開討論筆數：列表初始狀態應直接顯示實際留言數，而不是打開後才更新
- [x] 即時股價展示元件
- [x] 每日上午 08:55（台灣時間）自動抓取台股相關重大新聞
- [x] 新聞資料來源策略與去重策略
- [ ] production 確認已套用 `posts.detail` migration（見第 4 節待辦 3）
- [ ] 新聞分類自動化
- [ ] AI 回覆品質提升：舊文無 `detail` 時上下文仍偏短；可加來源引用格式與回覆長度控制
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

3. `[done]` 新聞閱讀體驗與歷史瀏覽（2026-05-24）
   - 主畫面預設台北時區當日新聞；較早新聞由 `NewsArchiveSidebar` 依日期瀏覽。
   - 卡片主畫面直接顯示正文；留言區維持收合。
   - `posts.detail` 保存 RSS 原文；AI 留言 prompt 已帶入 `detail`。
   - Cron 授權修正：信任 `x-vercel-cron`，`maxDuration` 延長至 60 秒。

### 昨日建議推進（2026-05-26）— 均未標記完成，延續至今日

> 5/26 僅完成規格書同步（commit `b46aef2`），無功能程式碼提交。下列五項仍為 `[todo]`。

1. `[todo]` **驗證 production 新聞 Cron 與 migration**
   - 在 Supabase 確認 `posts.detail` 欄位已存在（套用 `20260523120000_add_posts_detail.sql`）。
   - 在 Vercel Logs 確認 08:55 排程回傳 200（修正 `x-vercel-cron` 後的首個交易日）。
   - 可手動：`GET /api/cron/taiwan-stock-news?dryRun=1` 或帶 `Authorization: Bearer <CRON_SECRET>`。

2. `[todo]` **手機版與側欄 RWD**
   - `NewsArchiveSidebar` 在小螢幕改為可收合抽屜或頂部日期選擇器。
   - 驗證長 `detail` 內文不撐破版面、搜尋列與股價列不重疊。

3. `[todo]` **新聞分類自動化**
   - 依 RSS 關鍵字或來源對應 `categories`（半導體、航運、總經等），避免全部落在 `finance`。

4. `[todo]` **AI 回覆與舊文補強**
   - 對無 `detail` 的舊貼文：後台一次性補抓或標記「僅摘要」。
   - 調整 Gemini prompt：要求引用 `source_url`、限制幻覺、區分「原文」與「AI 整理」。

5. `[todo]` **最小測試骨架**
   - 為 `lib/dates/taipei.ts`、`lib/news/taiwanStockNews` 去重邏輯加單元測試，降低 Cron 回歸風險。

### 今日建議推進（2026-05-27）

> 由每日 Cron 自動化（01:00 UTC）觸發更新。優先順序由上而下；與 5/26 相同，但 production 驗證應優先（5/26 08:55 排程已執行過一輪，需對照 Logs）。

1. `[doing]` **驗證 production 新聞 Cron 與 migration**（延續 5/26 第 1 項）
   - 在 Supabase 確認 `posts.detail` 欄位已存在；若未套用，執行 `20260523120000_add_posts_detail.sql`。
   - 在 Vercel Logs 查 2026-05-26 08:55（台灣時間）Cron 是否 200、是否有新 `posts` 且 `detail` 非空。
   - 本機／手動：`GET /api/cron/taiwan-stock-news?dryRun=1`；production 需 `x-vercel-cron: 1` 或 `Authorization: Bearer <CRON_SECRET>`。

2. `[todo]` **手機版與側欄 RWD**（延續 5/26 第 2 項）
   - 優先改 `NewsArchiveSidebar`：小螢幕抽屜或頂部日期選擇器。
   - 驗證長 `detail`、股價列、搜尋列在手機寬度不重疊、不橫向溢出。

3. `[todo]` **新聞分類自動化**（延續 5/26 第 3 項）
   - 在 `lib/news/taiwanStockNews.ts` 依關鍵字／來源對應 `categories`，減少全部寫入 `finance`。

4. `[todo]` **AI 回覆與舊文補強**（延續 5/26 第 4 項）
   - 舊文無 `detail`：補抓或 UI 標示「僅摘要」。
   - `lib/ai/commentReply.ts`：prompt 要求引用 `source_url`、區分原文與 AI 整理。

5. `[todo]` **最小測試骨架**（延續 5/26 第 5 項）
   - 新增 `npm run test`（Vitest 或 Node test runner），覆蓋 `lib/dates/taipei.ts` 與新聞去重邏輯。

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

### 2026-05-24

- 主畫面新聞 UX 重構（`63d89ff`、`53ae254`）：
  - 新增 `components/NewsArchiveSidebar.tsx`、`lib/dates/taipei.ts`。
  - 主區預設只顯示台北時區當日新聞；歷史依日期側欄瀏覽。
  - 點文章標題於主區展開全文；點「Siami Feed」回到今日。
  - 新增 `lib/market/shouldRefreshQuotes.ts`：僅台股盤中才刷新股價。
- 新聞內文與資料模型（`80a3202`）：
  - migration `20260523120000_add_posts_detail.sql` 新增 `posts.detail`。
  - `lib/news/taiwanStockNews.ts` 抓取時寫入 RSS 原文；無內文者不寫入。
  - `PostCard` 主畫面優先顯示 `detail`；`commentReply` prompt 納入 `detail`。
- Cron 可靠性修正（`ceecfb9`）：
  - `/api/cron/taiwan-stock-news` 信任 `x-vercel-cron: 1`，避免僅比對 `CRON_SECRET` 導致排程 401。
  - `maxDuration` 設為 60 秒。

### 2026-05-25

- Git 無新 commit；屬於規格文件與部署觀察日。
- 建議 PM／Agent 確認事項（若尚未執行）：
  - Production Supabase 是否已套用 `posts.detail` migration。
  - 5/24 部署後首個 08:55 Cron 是否在 Vercel Logs 顯示成功。

### 2026-05-26

- 每日 Cron 自動化（01:00 UTC）觸發規格書同步（commit `b46aef2`，分支 `cursor/-bc-f2727d69-...`）。
- **僅文件變更**：更新第 1、3、4、6 節；進度約 58%；補登 5/24 功能摘要；建立五項「今日建議推進」。
- **無新功能程式碼**；`main` 與目前開發分支仍停在 5/24 的四個功能 commit（`63d89ff`～`ceecfb9`）。
- 5/26 台灣時間 08:55 為修正 `x-vercel-cron` 後首個平日排程，**待 PM／Agent 在 Vercel Logs 確認是否成功**（對應待辦第 1 項）。

### 2026-05-27

- 每日 Cron 自動化（01:00 UTC）觸發本說明與規格書更新。
- 將工作區 `CURSOR_SPEC.md` 與 5/26 規格內容對齊，並新增「今日建議推進（2026-05-27）」；5/26 五項待辦標記為延續、尚未 `[done]`。
- 今日開發焦點（見第 4 節）：**production 驗證（含 5/26 Cron 日誌）** → 手機版 RWD → 分類自動化 → AI／舊文 → 測試骨架。

### 2026-05-19 至 2026-05-20 既有進度摘要

- 完成 Vercel production 部署。
- 完成黑色主題、白字與橘色重點 UI。
- 完成 Supabase `posts` / `categories` feed。
- 完成留言功能與 `comments` migration。
- 修復既有 `comments.content NOT NULL` 導致留言失敗的問題。
- 完成 Gemini API key 設定後的 production redeploy。
- 驗證 Gemini API 生效：不再回傳「尚未啟用 AI」fallback。
- 建立專案專屬 git sync workflow，要求每次修改前確認本地與 GitHub 遠端一致。

