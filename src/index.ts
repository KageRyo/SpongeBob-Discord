import {
  ChatInputCommandInteraction,
  Client,
  GatewayIntentBits,
  Interaction,
  MessageFlags,
  PermissionFlagsBits,
  REST,
  Routes
} from "discord.js";

import { config } from "./config.js";
import { commandData, type KnownCommandName, type MemeVersion } from "./discord/commands.js";
import { renderMemeMessage, renderSearchResult } from "./discord/renderMeme.js";
import { GoogleSheetRepository } from "./services/googleSheetRepository.js";

const memeRepository = new GoogleSheetRepository();

const registerCommands = async () => {
  const rest = new REST({ version: "10" }).setToken(config.discordToken);

  if (config.discordGuildId) {
    await rest.put(
      Routes.applicationGuildCommands(config.discordClientId, config.discordGuildId),
      { body: commandData }
    );
    return;
  }

  await rest.put(Routes.applicationCommands(config.discordClientId), {
    body: commandData
  });
};

const pickRandom = <T>(items: T[]) => items[Math.floor(Math.random() * items.length)];
const getRequestedVersion = (interaction: ChatInputCommandInteraction): MemeVersion =>
  (interaction.options.getString("version") as MemeVersion | null) ?? "captioned";

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const replyWithError = async (interaction: ChatInputCommandInteraction, message: string) => {
  try {
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(message);
      return;
    }

    await interaction.reply({
      content: message,
      flags: MessageFlags.Ephemeral
    });
  } catch (error) {
    console.error("Failed to send error response:", error);
  }
};

const handleCommand = async (interaction: Interaction) => {
  if (interaction.isAutocomplete()) {
    try {
      if (interaction.commandName !== "spongebob") {
        await interaction.respond([]);
        return;
      }

      const focusedOption = interaction.options.getFocused(true);
      if (focusedOption.name !== "keyword") {
        await interaction.respond([]);
        return;
      }

      const memes = await memeRepository.getMemes();
      const suggestions = memeRepository.autocomplete(memes, focusedOption.value);
      await interaction.respond(
        suggestions.map((suggestion) => ({
          name: suggestion.label,
          value: suggestion.value
        }))
      );
      return;
    } catch (error) {
      console.error("Autocomplete failed:", error);
      await interaction.respond([]);
      return;
    }
  }

  if (!interaction.isChatInputCommand()) {
    return;
  }

  const commandName = interaction.commandName as KnownCommandName;

  try {
    switch (commandName) {
      case "ping": {
        await interaction.reply("pong");
        return;
      }

      case "spongebob": {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === "reload") {
          if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
            await interaction.reply({
              content: "只有具備 Manage Server 權限的成員可以重新載入資料。",
              flags: MessageFlags.Ephemeral
            });
            return;
          }

          await interaction.deferReply({ flags: MessageFlags.Ephemeral });
          const memes = await memeRepository.getMemes(true);
          await interaction.editReply(`已重新載入 ${memes.length} 筆海綿寶寶梗圖資料。`);
          return;
        }

        const memes = await memeRepository.getMemes();
        const version = getRequestedVersion(interaction);

        if (subcommand === "random") {
          await interaction.deferReply();
          const keyword = interaction.options.getString("keyword") ?? undefined;
          const filtered = memeRepository.search(memes, keyword);

          if (filtered.length === 0) {
            await interaction.editReply(
              keyword
                ? `找不到符合「${keyword}」的海綿寶寶梗圖。`
                : "目前沒有可用的海綿寶寶梗圖資料。"
            );
            return;
          }

          await interaction.editReply(renderMemeMessage(pickRandom(filtered), version));
          return;
        }

        if (subcommand === "search") {
          await interaction.deferReply({ flags: MessageFlags.Ephemeral });
          const keyword = interaction.options.getString("keyword", true);
          const filtered = memeRepository.search(memes, keyword);

          if (filtered.length === 0) {
            await interaction.editReply(`找不到符合「${keyword}」的海綿寶寶梗圖。`);
            return;
          }

          await interaction.editReply(renderSearchResult(filtered, keyword, version));
          return;
        }

        if (subcommand === "id") {
          await interaction.deferReply();
          const id = interaction.options.getString("id", true).trim();
          const meme = memes.find((item) => item.id.toLowerCase() === id.toLowerCase());

          if (!meme) {
            await interaction.editReply(`找不到編號 ${id} 的海綿寶寶梗圖。`);
            return;
          }

          await interaction.editReply(renderMemeMessage(meme, version));
          return;
        }

        await interaction.reply({
          content: `Unknown subcommand: ${subcommand}`,
          flags: MessageFlags.Ephemeral
        });
        return;
      }

      default:
        await interaction.reply({
          content: `Unknown command: ${commandName}`,
          flags: MessageFlags.Ephemeral
        });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await replyWithError(interaction, `執行失敗: ${message}`);
  }
};

client.once("clientReady", async () => {
  console.log(`Logged in as ${client.user?.tag}`);

  try {
    const memes = await memeRepository.getMemes();
    console.log(`Loaded ${memes.length} meme records from Google Sheets.`);
  } catch (error) {
    console.error("Failed to warm up meme data:", error);
  }
});

client.on("interactionCreate", (interaction) => {
  void handleCommand(interaction);
});

const main = async () => {
  await registerCommands();
  await client.login(config.discordToken);
};

main().catch((error) => {
  console.error("Fatal startup error:", error);
  process.exitCode = 1;
});
