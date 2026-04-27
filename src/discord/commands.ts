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
    .addSubcommand((subcommand) =>
      subcommand
        .setName("random")
        .setDescription("隨機抽一張海綿寶寶梗圖。")
        .addStringOption((option) =>
          option
            .setName("keyword")
            .setDescription("可選，依關鍵字過濾。")
            .setAutocomplete(true)
            .setRequired(false)
        )
        .addStringOption((option) =>
          option
            .setName("version")
            .setDescription("選擇有字版或無字版。")
            .addChoices(...versionChoices)
            .setRequired(false)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("search")
        .setDescription("搜尋符合關鍵字的海綿寶寶梗圖。")
        .addStringOption((option) =>
          option
            .setName("keyword")
            .setDescription("要搜尋的關鍵字。")
            .setAutocomplete(true)
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("version")
            .setDescription("搜尋時偏好顯示有字版或無字版。")
            .addChoices(...versionChoices)
            .setRequired(false)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("id")
        .setDescription("依編號取出特定梗圖。")
        .addStringOption((option) =>
          option
            .setName("id")
            .setDescription("梗圖編號，例如 SS0001。")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("version")
            .setDescription("選擇有字版或無字版。")
            .addChoices(...versionChoices)
            .setRequired(false)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("reload")
        .setDescription("重新抓取 Google Sheet 資料。")
    )
].map((command) => command.toJSON());

export type KnownCommandName = "ping" | "spongebob";
export type MemeVersion = "captioned" | "blank";
