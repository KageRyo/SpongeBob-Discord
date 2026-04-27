export type MemeRecord = {
  id: string;
  title: string;
  url: string;
  captionedUrl?: string;
  blankUrl?: string;
  tags: string[];
  description?: string;
  raw: Record<string, string>;
};
