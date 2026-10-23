import assert from "node:assert/strict";
import test from "node:test";

test("spreadsheet CSV preserves BOM, quoted fields and string identifiers", async (t) => {
  process.env.DISCORD_TOKEN = "test-token";
  process.env.DISCORD_CLIENT_ID = "test-client";
  const { GoogleSheetRepository } = await import("../dist/services/googleSheetRepository.js");
  const csv = '\uFEFF流水號,名稱,i.imgur,備註\r\n0050,"海綿,寶寶",https://example.com/meme.png,"第一行\n第二行"\r\n\r\n';
  t.mock.method(globalThis, "fetch", async () => new Response(csv));

  const [meme] = await new GoogleSheetRepository().getMemes();

  assert.equal(meme.id, "0050");
  assert.equal(meme.title, "海綿,寶寶");
  assert.equal(meme.url, "https://example.com/meme.png");
  assert.equal(meme.raw["備註"], "第一行\n第二行");
});
