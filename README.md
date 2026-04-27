# SpongeBob-Discord

SpongeBob memes bot for Discord. Data source comes from a Google Sheet and is exposed through slash commands.

## Features

- `/spongebob random` 隨機抽一張海綿寶寶梗圖
- `/spongebob random keyword:<關鍵字> version:<有字|無字>` 依條件隨機抽圖
- `/spongebob search keyword:<關鍵字> version:<有字|無字>` 搜尋符合條件的梗圖
- `/spongebob id id:<編號> version:<有字|無字>` 依編號查特定梗圖
- `/spongebob reload` 重新抓取 Google Sheet

## Data Source

預設使用這份公開試算表：

- https://docs.google.com/spreadsheets/d/1o91jy3c59gFZkjwbGLM4ncm62o1e03Jfhu1NsEwtGGM/edit?gid=1290223975#gid=1290223975

程式會透過 Google Sheets CSV export 抓資料，並自動嘗試辨識標題、有字版圖片、無字版圖片、標籤與描述欄位。若你的欄位名稱不同，可以用 `.env` 裡的欄位別名設定覆蓋。

## Setup

1. 建立 Discord Application 與 Bot，取得：
   - `DISCORD_TOKEN`
   - `DISCORD_CLIENT_ID`
2. 複製環境變數範本：

```bash
cp .env.example .env
```

3. 安裝依賴：

```bash
npm install
```

4. 開發模式執行：

```bash
npm run dev
```

5. 編譯並啟動：

```bash
npm run build
npm start
```

## Environment Variables

| Name | Required | Description |
| --- | --- | --- |
| `DISCORD_TOKEN` | Yes | Discord bot token |
| `DISCORD_CLIENT_ID` | Yes | Discord application client ID |
| `DISCORD_GUILD_ID` | No | 指定後只註冊到該 guild，開發時建議填 |
| `GOOGLE_SHEET_ID` | No | Google Sheet ID |
| `GOOGLE_SHEET_GID` | No | 工作表 gid |
| `GOOGLE_SHEET_REFRESH_MINUTES` | No | 快取分鐘數，預設 30 |
| `GOOGLE_SHEET_ID_COLUMNS` | No | 編號欄位別名 |
| `GOOGLE_SHEET_TITLE_COLUMNS` | No | 標題欄位別名 |
| `GOOGLE_SHEET_CAPTIONED_URL_COLUMNS` | No | 有字版圖片欄位別名 |
| `GOOGLE_SHEET_BLANK_URL_COLUMNS` | No | 無字版圖片欄位別名 |
| `GOOGLE_SHEET_TAG_COLUMNS` | No | 標籤欄位別名 |
| `GOOGLE_SHEET_DESCRIPTION_COLUMNS` | No | 描述欄位別名 |

## Notes

- 若未設定 `DISCORD_GUILD_ID`，slash commands 會註冊成 global commands，生效可能需要幾分鐘。
- 目前假設 Google Sheet 可被公開讀取。
- 這份試算表目前可直接辨識 `流水號 / 名稱 / i.imgur / 無文字版本 / 維基集數 / ESFIO` 欄位。
- 若試算表的圖片欄位不是直接圖片網址而是 Google Drive / 頁面連結，Discord embed 可能無法直接預覽，這時仍會附上來源連結。
