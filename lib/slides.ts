const SLIDE_FOLDER = "/slides/Naples_Hazards_Assessment_Final_PartsIII_IV";

/** Resolve the public URL for an exported working-deck slide image. */
export function getSlideImagePath(slideNumber: number): string {
  return `${SLIDE_FOLDER}/Slide${slideNumber}.PNG`;
}

/** Parse ranges like "4–6", "10-11", "1", or "14–17 plus 1 and 18". */
export function parseSlideReferences(value: string): number[] {
  if (!value) return [];

  const numbers = new Set<number>();
  const normalized = value.replace(/[–—]/g, "-");

  for (const match of normalized.matchAll(/(\d+)\s*-\s*(\d+)/g)) {
    const start = Number.parseInt(match[1], 10);
    const end = Number.parseInt(match[2], 10);
    if (!Number.isFinite(start) || !Number.isFinite(end)) continue;
    const from = Math.min(start, end);
    const to = Math.max(start, end);
    for (let n = from; n <= to; n += 1) numbers.add(n);
  }

  for (const match of normalized.matchAll(/\b(\d+)\b/g)) {
    const n = Number.parseInt(match[1], 10);
    if (Number.isFinite(n)) numbers.add(n);
  }

  return [...numbers].sort((a, b) => a - b);
}

export function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
