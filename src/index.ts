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
import type { RESTPostAPIApplicationCommandsJSONBody } from "discord.js";

import { config } from "./config.js";
import { commandData, type KnownCommandName, type MemeVersion } from "./discord/commands.js";
import { renderMemeMessage, renderSearchResult } from "./discord/renderMeme.js";
import { GoogleSheetRepository } from "./services/googleSheetRepository.js";

const memeRepository = new GoogleSheetRepository();
const ownCommandNames = new Set(commandData.map((command) => command.name));

const registerCommand = async (
  rest: REST,
  command: RESTPostAPIApplicationCommandsJSONBody
) => {
  if (config.discordGuildId) {
    await rest.post(
      Routes.applicationGuildCommands(config.discordClientId, config.discordGuildId),
      { body: command }
    );
    return;
  }

  await rest.post(Routes.applicationCommands(config.discordClientId), {
    body: command
  });
};

const registerCommands = async () => {
  const rest = new REST({ version: "10" }).setToken(config.discordToken);

  for (const command of commandData) {
    await registerCommand(rest, command);
  }
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
      if (!ownCommandNames.has(interaction.commandName)) {
        return;
      }

      const focusedOption = interaction.options.getFocused(true);
      if (focusedOption.name !== "query") {
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
      if (!interaction.responded) {
        await interaction.respond([]);
      }
      return;
    }
  }

  if (!interaction.isChatInputCommand()) {
    return;
  }

  if (!ownCommandNames.has(interaction.commandName)) {
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
        await interaction.deferReply();
        const memes = await memeRepository.getMemes();
        const version = getRequestedVersion(interaction);
        const query = interaction.options.getString("query")?.trim();

        if (!query) {
          if (memes.length === 0) {
            await interaction.editReply("目前沒有可用的海綿寶寶梗圖資料。");
            return;
          }

          await interaction.editReply(renderMemeMessage(pickRandom(memes), version));
          return;
        }

        const memeById = memes.find((item) => item.id.toLowerCase() === query.toLowerCase());
        if (memeById) {
          await interaction.editReply(renderMemeMessage(memeById, version));
          return;
        }

        const filtered = memeRepository.search(memes, query);
        if (filtered.length === 0) {
          await interaction.editReply(`找不到符合「${query}」的海綿寶寶梗圖。`);
          return;
        }

        if (filtered.length === 1) {
          await interaction.editReply(renderMemeMessage(filtered[0], version));
          return;
        }

        await interaction.editReply(renderSearchResult(filtered, query, version));
        return;
      }

      case "spongebob-reload": {
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

      default:
        return;
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
