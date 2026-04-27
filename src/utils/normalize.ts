export const normalizeKey = (value: string) => value.trim().toLowerCase();

export const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim();
