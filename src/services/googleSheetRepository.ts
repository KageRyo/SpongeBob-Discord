import { parse } from "csv-parse/sync";

import { config } from "../config.js";
import type { MemeRecord } from "../domain/memeRecord.js";
import { detectFallbackHeaders, splitTagText } from "../utils/csv.js";
import { normalizeKey, normalizeText } from "../utils/normalize.js";

type CachedMemes = {
  fetchedAt: number;
  memes: MemeRecord[];
};

type ColumnGroup = "id" | "title" | "captionedUrl" | "blankUrl" | "tag" | "description";

const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp"];

const defaultFieldMatchers: Record<ColumnGroup, string[]> = {
  id: config.idColumns,
  title: config.titleColumns,
  captionedUrl: config.captionedUrlColumns,
  blankUrl: config.blankUrlColumns,
  tag: config.tagColumns,
  description: config.descriptionColumns
};

const isLikelyUrl = (value: string) => /^https?:\/\//i.test(value.trim());
const isLikelyImage = (value: string) =>
  IMAGE_EXTENSIONS.some((extension) => value.toLowerCase().includes(extension));

export class GoogleSheetRepository {
  private cache?: CachedMemes;

  private get sheetCsvUrl() {
    const params = new URLSearchParams({
      format: "csv",
      gid: config.googleSheetGid
    });

    return `https://docs.google.com/spreadsheets/d/${config.googleSheetId}/export?${params.toString()}`;
  }

  async getMemes(forceRefresh = false): Promise<MemeRecord[]> {
    const cacheMaxAge = config.googleSheetRefreshMinutes * 60 * 1000;
    const cacheIsFresh =
      this.cache && Date.now() - this.cache.fetchedAt < cacheMaxAge;

    if (!forceRefresh && cacheIsFresh && this.cache) {
      return this.cache.memes;
    }

    const response = await fetch(this.sheetCsvUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch spreadsheet CSV: ${response.status} ${response.statusText}`);
    }

    const csvText = await response.text();
    const rawRecords = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
      bom: true
    }) as Record<string, string>[];

    const memes = this.toMemeRecords(rawRecords, csvText);
    if (memes.length === 0) {
      throw new Error("Spreadsheet loaded successfully, but no usable meme rows were detected.");
    }

    this.cache = {
      fetchedAt: Date.now(),
      memes
    };

    return memes;
  }

  private toMemeRecords(rows: Record<string, string>[], csvText: string): MemeRecord[] {
    const fallbackHeaders = detectFallbackHeaders(csvText).map(normalizeKey);

    return rows
      .map((row, index) => this.mapRow(row, index, fallbackHeaders))
      .filter((record): record is MemeRecord => record !== null);
  }

  private mapRow(
    row: Record<string, string>,
    index: number,
    fallbackHeaders: string[]
  ): MemeRecord | null {
    const normalizedRow = new Map<string, string>();

    for (const [key, value] of Object.entries(row)) {
      normalizedRow.set(normalizeKey(key), String(value ?? "").trim());
    }

    const captionedUrl =
      this.pickColumn(normalizedRow, "captionedUrl") ?? this.findPreferredUrlValue(normalizedRow, true);
    const blankUrl =
      this.pickColumn(normalizedRow, "blankUrl") ?? this.findPreferredUrlValue(normalizedRow, false);
    const url = captionedUrl ?? blankUrl;

    if (!url) {
      return null;
    }

    const id = this.pickColumn(normalizedRow, "id") ?? String(index + 1);

    const title =
      this.pickColumn(normalizedRow, "title") ??
      this.findTitleValue(normalizedRow, fallbackHeaders) ??
      `SpongeBob Meme #${id}`;

    const description =
      this.buildDescription(normalizedRow) ??
      this.pickColumn(normalizedRow, "description") ??
      this.findDescriptionValue(normalizedRow, title, url);

    const tagText =
      this.pickColumn(normalizedRow, "tag") ??
      this.findTagValue(normalizedRow, title, description, url);

    return {
      id: String(id),
      title,
      url,
      captionedUrl,
      blankUrl,
      tags: splitTagText(tagText ?? ""),
      description: description || undefined,
      raw: Object.fromEntries(normalizedRow.entries())
    };
  }

  private pickColumn(row: Map<string, string>, group: ColumnGroup): string | undefined {
    for (const alias of defaultFieldMatchers[group]) {
      const value = row.get(alias);
      if (value) {
        return value;
      }
    }
    return undefined;
  }

  private findPreferredUrlValue(row: Map<string, string>, preferCaptioned: boolean) {
    for (const [key, value] of row.entries()) {
      if (!isLikelyUrl(value)) {
        continue;
      }

      const isBlankField = key.includes("無文字") || key.includes("blank") || key.includes("template");
      if (preferCaptioned && !isBlankField) {
        return value;
      }

      if (!preferCaptioned && isBlankField) {
        return value;
      }
    }

    for (const value of row.values()) {
      if (isLikelyUrl(value)) {
        return value;
      }
    }
    return undefined;
  }

  private findTitleValue(row: Map<string, string>, fallbackHeaders: string[]) {
    for (const header of fallbackHeaders) {
      const value = row.get(header);
      if (!value) {
        continue;
      }

      if (
        isLikelyUrl(value) ||
        value.length > 120 ||
        header.includes("日期") ||
        header.includes("流水號") ||
        header.includes("imgur") ||
        header.includes("esfio") ||
        header.includes("維基集數")
      ) {
        continue;
      }

      return value;
    }

    return undefined;
  }

  private findDescriptionValue(row: Map<string, string>, title: string, url: string) {
    for (const value of row.values()) {
      if (!value || value === title || value === url) {
        continue;
      }

      if (isLikelyUrl(value) || value.length < 8) {
        continue;
      }

      return value;
    }

    return undefined;
  }

  private buildDescription(row: Map<string, string>) {
    const lines = [
      row.get("維基集數") ? `維基集數: ${row.get("維基集數")}` : undefined,
      row.get("esfio") ? `ESFIO: ${row.get("esfio")}` : undefined,
      row.get("日期") ? `建立日期: ${row.get("日期")}` : undefined
    ].filter((value): value is string => Boolean(value));

    return lines.length > 0 ? lines.join("\n") : undefined;
  }

  private findTagValue(row: Map<string, string>, title: string, description: string | undefined, url: string) {
    for (const [key, value] of row.entries()) {
      if (!value || value === title || value === description || value === url) {
        continue;
      }

      const looksLikeTagField = key.includes("tag") || key.includes("keyword") || key.includes("分類");
      const isMetadataField =
        key.includes("日期") ||
        key.includes("流水號") ||
        key.includes("imgur") ||
        key.includes("維基集數") ||
        key.includes("esfio");
      const isShortText = value.length <= 80 && !isLikelyUrl(value) && !isLikelyImage(value);
      if (looksLikeTagField || (isShortText && !isMetadataField)) {
        return value;
      }
    }

    return undefined;
  }

  search(memes: MemeRecord[], keyword?: string) {
    if (!keyword) {
      return memes;
    }

    const query = normalizeText(keyword);
    return memes.filter((meme) => {
      const haystack = normalizeText(
        [meme.id, meme.title, meme.description ?? "", meme.tags.join(" "), Object.values(meme.raw).join(" ")]
          .join(" ")
      );

      return haystack.includes(query);
    });
  }

  autocomplete(memes: MemeRecord[], keyword?: string, limit = 25) {
    const query = normalizeText(keyword ?? "");
    const suggestions = new Map<string, { score: number; label: string; value: string }>();

    for (const meme of memes) {
      const candidates = [meme.title, meme.id];

      for (const candidate of candidates) {
        const normalizedCandidate = normalizeText(candidate);
        const score = this.scoreAutocompleteMatch(normalizedCandidate, query);
        if (score === null) {
          continue;
        }

        const existing = suggestions.get(candidate);
        if (!existing || score < existing.score) {
          const labelPrefix = candidate === meme.id ? "ID" : "Title";
          suggestions.set(candidate, {
            score,
            label: `${labelPrefix}: ${candidate}`.slice(0, 100),
            value: candidate
          });
        }
      }
    }

    return [...suggestions.values()]
      .sort((left, right) => {
        if (left.score !== right.score) {
          return left.score - right.score;
        }

        return left.value.localeCompare(right.value, "zh-Hant");
      })
      .slice(0, limit);
  }

  private scoreAutocompleteMatch(candidate: string, query: string) {
    if (!query) {
      return 2;
    }

    if (candidate === query) {
      return 0;
    }

    if (candidate.startsWith(query)) {
      return 1;
    }

    if (candidate.includes(query)) {
      return 2;
    }

    return null;
  }
}
