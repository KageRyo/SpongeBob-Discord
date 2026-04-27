import { SlashCommandBuilder } from "discord.js";

const versionChoices = [
  { name: "有字", value: "captioned" },
  { name: "無字", value: "blank" }
] as const;

export const commandData = [
  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("確認機器人是否在線。"),
  new SlashCommandBuilder()
    .setName("spongebob")
    .setDescription("海綿寶寶梗圖指令。")
    .addStringOption((option) =>
      option
        .setName("query")
        .setDescription("留空隨機抽圖；輸入編號會直接取圖；其他內容視為搜尋。")
        .setAutocomplete(true)
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("version")
        .setDescription("選擇有字版或無字版。")
        .addChoices(...versionChoices)
        .setRequired(false)
    ),
  new SlashCommandBuilder()
    .setName("spongebob-reload")
    .setDescription("重新抓取 Google Sheet 資料。")
].map((command) => command.toJSON());

export type KnownCommandName = "ping" | "spongebob" | "spongebob-reload";
export type MemeVersion = "captioned" | "blank";
