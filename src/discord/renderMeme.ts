import { EmbedBuilder } from "discord.js";

import type { MemeRecord } from "../domain/memeRecord.js";
import type { MemeVersion } from "./commands.js";

const IMAGE_FILE_REGEX = /\.(png|jpe?g|gif|webp|bmp)(\?.*)?$/i;

const getDisplayUrl = (meme: MemeRecord, version: MemeVersion) =>
  version === "blank"
    ? meme.blankUrl ?? meme.captionedUrl ?? meme.url
    : meme.captionedUrl ?? meme.blankUrl ?? meme.url;

const getVersionLabel = (version: MemeVersion) => (version === "blank" ? "無字版" : "有字版");

export const renderMemeMessage = (meme: MemeRecord, version: MemeVersion) => {
  const displayUrl = getDisplayUrl(meme, version);
  const embed = new EmbedBuilder()
    .setTitle(`${meme.id}. ${meme.title}`)
    .setColor(0xf7d046)
    .setURL(displayUrl)
    .addFields({
      name: "Source",
      value: displayUrl
    }, {
      name: "Version",
      value: getVersionLabel(version)
    });

  if (meme.description) {
    embed.setDescription(meme.description.slice(0, 4000));
  }

  if (meme.tags.length > 0) {
    embed.addFields({
      name: "Tags",
      value: meme.tags.slice(0, 15).join(", ")
    });
  }

  if (meme.raw["無文字版本"]) {
    embed.addFields({
      name: "無文字版本",
      value: meme.blankUrl ?? meme.raw["無文字版本"]
    });
  }

  if (meme.raw["維基集數"] || meme.raw["esfio"]) {
    embed.addFields({
      name: "Episode",
      value: [meme.raw["維基集數"], meme.raw["esfio"]].filter(Boolean).join(" / ")
    });
  }

  if (IMAGE_FILE_REGEX.test(displayUrl)) {
    embed.setImage(displayUrl);
  }

  return {
    embeds: [embed]
  };
};

export const renderSearchResult = (memes: MemeRecord[], keyword: string, version: MemeVersion) => {
  const embed = new EmbedBuilder()
    .setTitle(`搜尋結果: ${keyword} (${getVersionLabel(version)})`)
    .setColor(0x1d89ef)
    .setDescription(
      memes
        .slice(0, 10)
        .map((meme) => `**${meme.id}. ${meme.title}**\n${getDisplayUrl(meme, version)}`)
        .join("\n\n")
    )
    .setFooter({
      text:
        memes.length > 10
          ? `顯示前 10 筆，共 ${memes.length} 筆`
          : `共 ${memes.length} 筆`
    });

  return {
    embeds: [embed]
  };
};
