const splitCsvLine = (line: string): string[] => {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === "\"") {
      if (inQuotes && next === "\"") {
        current += "\"";
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  result.push(current);
  return result;
};

export const splitTagText = (value: string) =>
  value
    .split(/[,\n;/|]/)
    .map((tag) => tag.trim())
    .filter(Boolean);

export const detectFallbackHeaders = (csvText: string): string[] => {
  const [headerLine = ""] = csvText.split(/\r?\n/, 1);
  return splitCsvLine(headerLine);
};
