import "dotenv/config";

type AppConfig = {
  discordToken: string;
  discordClientId: string;
  discordGuildId?: string;
  googleSheetId: string;
  googleSheetGid: string;
  googleSheetRefreshMinutes: number;
  idColumns: string[];
  titleColumns: string[];
  captionedUrlColumns: string[];
  blankUrlColumns: string[];
  tagColumns: string[];
  descriptionColumns: string[];
};

const parseColumnAliases = (value: string | undefined, defaults: string[]) =>
  (value ?? defaults.join(","))
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

const required = (name: string): string => {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

export const config: AppConfig = {
  discordToken: required("DISCORD_TOKEN"),
  discordClientId: required("DISCORD_CLIENT_ID"),
  discordGuildId: process.env.DISCORD_GUILD_ID?.trim() || undefined,
  googleSheetId: process.env.GOOGLE_SHEET_ID?.trim() || "1o91jy3c59gFZkjwbGLM4ncm62o1e03Jfhu1NsEwtGGM",
  googleSheetGid: process.env.GOOGLE_SHEET_GID?.trim() || "1290223975",
  googleSheetRefreshMinutes: Number(process.env.GOOGLE_SHEET_REFRESH_MINUTES ?? 30),
  idColumns: parseColumnAliases(process.env.GOOGLE_SHEET_ID_COLUMNS, [
    "id",
    "serial",
    "code",
    "流水號",
    "編號"
  ]),
  titleColumns: parseColumnAliases(process.env.GOOGLE_SHEET_TITLE_COLUMNS, [
    "title",
    "name",
    "meme",
    "template",
    "名稱",
    "梗圖",
    "標題"
  ]),
  captionedUrlColumns: parseColumnAliases(process.env.GOOGLE_SHEET_CAPTIONED_URL_COLUMNS, [
    "i.imgur",
    "image_url",
    "image",
    "url",
    "link",
    "imgur",
    "圖片",
    "網址"
  ]),
  blankUrlColumns: parseColumnAliases(process.env.GOOGLE_SHEET_BLANK_URL_COLUMNS, [
    "無文字版本",
    "blank",
    "blank_url",
    "template",
    "template_url"
  ]),
  tagColumns: parseColumnAliases(process.env.GOOGLE_SHEET_TAG_COLUMNS, [
    "tags",
    "keywords",
    "keyword",
    "tag",
    "分類",
    "關鍵字"
  ]),
  descriptionColumns: parseColumnAliases(process.env.GOOGLE_SHEET_DESCRIPTION_COLUMNS, [
    "description",
    "desc",
    "text",
    "caption",
    "備註",
    "描述",
    "維基集數",
    "esfio"
  ])
};
