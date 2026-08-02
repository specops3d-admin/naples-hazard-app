/**
 * Extract slide text from the Naples Hazards Assessment PowerPoint.
 *
 * Reads the .pptx with JSZip, parses each ppt/slides/slideN.xml with
 * fast-xml-parser, and writes normalized slide data to
 * src/data/presentation.json.
 *
 * The original PowerPoint file is never modified.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import JSZip from "jszip";
import { XMLParser } from "fast-xml-parser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

const PREFERRED_PPTX =
  "Naples_Hazards_Assessment_Final_PartsIII_IV(3).pptx";
const FALLBACK_PPTX = "Naples_Hazards_Assessment_Final_PartsIII_IV.pptx";

const SECTION_RULES = [
  {
    start: 1,
    end: 7,
    section: "Part I — Plate Tectonics",
  },
  {
    start: 8,
    end: 15,
    section: "Part II — Earthquakes",
  },
  {
    start: 16,
    end: 23,
    section: "Part III — Volcanoes and Climate Change",
  },
  {
    start: 24,
    end: 29,
    section: "Part IV — Prioritization and Mitigation",
  },
  {
    start: 30,
    end: 31,
    section: "References",
  },
];

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  removeNSPrefix: true,
  trimValues: false,
  isArray: (name) =>
    ["sp", "pic", "graphicFrame", "cxnSp", "grpSp", "p", "r", "br", "t"].includes(
      name,
    ),
});

function resolvePptxPath() {
  const sourceDir = path.join(ROOT, "source-files");
  const preferred = path.join(sourceDir, PREFERRED_PPTX);
  const fallback = path.join(sourceDir, FALLBACK_PPTX);

  if (fs.existsSync(preferred)) {
    return preferred;
  }

  if (fs.existsSync(fallback)) {
    console.warn(
      `Warning: Preferred PowerPoint not found:\n  ${preferred}\n` +
        `Using fallback PowerPoint instead:\n  ${fallback}`,
    );
    return fallback;
  }

  throw new Error(
    [
      "PowerPoint file not found.",
      "Looked for:",
      `  1) ${preferred}`,
      `  2) ${fallback}`,
      "Place the Naples Hazards Assessment .pptx file in source-files/ and try again.",
    ].join("\n"),
  );
}

function sectionForSlide(slideNumber) {
  const rule = SECTION_RULES.find(
    (entry) => slideNumber >= entry.start && slideNumber <= entry.end,
  );
  return rule?.section ?? "Uncategorized";
}

function asArray(value) {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function normalizeWhitespace(text) {
  return String(text)
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function collectTextNodes(node, bucket) {
  if (node === undefined || node === null) return;

  if (typeof node === "string" || typeof node === "number") {
    bucket.push(String(node));
    return;
  }

  if (Array.isArray(node)) {
    for (const item of node) collectTextNodes(item, bucket);
    return;
  }

  if (typeof node !== "object") return;

  if (Object.prototype.hasOwnProperty.call(node, "#text")) {
    collectTextNodes(node["#text"], bucket);
  }

  for (const [key, value] of Object.entries(node)) {
    if (key.startsWith("@_")) continue;
    if (key === "#text") continue;
    if (key === "t") {
      for (const textItem of asArray(value)) {
        if (typeof textItem === "string" || typeof textItem === "number") {
          bucket.push(String(textItem));
        } else if (textItem && typeof textItem === "object") {
          collectTextNodes(textItem["#text"] ?? textItem, bucket);
        }
      }
      continue;
    }
    collectTextNodes(value, bucket);
  }
}

function paragraphText(paragraph) {
  const parts = [];

  for (const childKey of Object.keys(paragraph)) {
    if (childKey.startsWith("@_")) continue;

    if (childKey === "r") {
      for (const run of asArray(paragraph.r)) {
        const runParts = [];
        collectTextNodes(run.t ?? run, runParts);
        parts.push(runParts.join(""));
      }
    } else if (childKey === "br") {
      parts.push("\n");
    } else if (childKey === "fld") {
      for (const field of asArray(paragraph.fld)) {
        const fieldParts = [];
        collectTextNodes(field, fieldParts);
        parts.push(fieldParts.join(""));
      }
    }
  }

  return normalizeWhitespace(parts.join(""));
}

function shapeTextBlocks(shape) {
  const txBody = shape?.txBody;
  if (!txBody) return [];

  const paragraphs = asArray(txBody.p);
  const lines = [];

  for (const paragraph of paragraphs) {
    const text = paragraphText(paragraph);
    if (text) lines.push(text);
  }

  if (lines.length === 0) return [];
  return [normalizeWhitespace(lines.join("\n"))].filter(Boolean);
}

function walkShapes(node, shapes) {
  if (!node || typeof node !== "object") return;

  for (const shape of asArray(node.sp)) {
    shapes.push(shape);
  }

  for (const group of asArray(node.grpSp)) {
    walkShapes(group, shapes);
  }

  // Some decks nest content under spTree only; still walk known containers.
  if (node.spTree) walkShapes(node.spTree, shapes);
}

function extractOrderedTextBlocks(slideObject) {
  const shapes = [];
  const spTree = slideObject?.sld?.cSld?.spTree;
  if (spTree) walkShapes(spTree, shapes);

  const blocks = [];
  for (const shape of shapes) {
    for (const block of shapeTextBlocks(shape)) {
      if (block) blocks.push(block);
    }
  }

  // Fallback: gather any remaining a:t text if shape walking found nothing.
  if (blocks.length === 0) {
    const fallbackParts = [];
    collectTextNodes(slideObject, fallbackParts);
    const joined = normalizeWhitespace(fallbackParts.join(" "));
    if (joined) blocks.push(joined);
  }

  return blocks.filter((block) => block.length > 0);
}

function isSourceOrCitationBlock(text) {
  const value = text.trim();
  if (!value) return false;

  const lower = value.toLowerCase();

  if (
    lower.startsWith("sources") ||
    lower.startsWith("source:") ||
    lower.startsWith("source ") ||
    lower.startsWith("sources/images") ||
    lower.startsWith("image/source") ||
    lower.startsWith("images/sources") ||
    lower.startsWith("images/source") ||
    lower.startsWith("map/source") ||
    lower.startsWith("photo:") ||
    lower.startsWith("references") ||
    lower.startsWith("suggested apa") ||
    lower.startsWith("synthesis based on") ||
    lower.startsWith("section framing based on") ||
    lower.startsWith("mitigation plan synthesized from") ||
    lower.startsWith("conclusion based on") ||
    lower.startsWith("scores synthesized from") ||
    lower.includes("https://") ||
    lower.includes("http://") ||
    lower.includes("doi.org/") ||
    (lower.includes("et al.") && /\(\d{4}\)/.test(value)) ||
    /^\d+\.\s+.+\(\d{4}\)/.test(value) ||
    /^\d+\.\s+.+\. https?:\/\//i.test(value)
  ) {
    return true;
  }

  return false;
}

function looksLikeSlideNumberOnly(text) {
  return /^\d{1,2}$/.test(text.trim());
}

function splitTitleSubtitleAndBody(blocks) {
  const usable = blocks.filter((block) => !looksLikeSlideNumberOnly(block));

  if (usable.length === 0) {
    return {
      title: "",
      subtitle: undefined,
      textBlocks: [],
      sourceOrCitationText: undefined,
    };
  }

  const title = usable[0];
  let subtitle;
  let bodyStart = 1;

  if (usable.length >= 2) {
    const candidate = usable[1];
    const isLikelySubtitle =
      candidate.length <= 220 &&
      !isSourceOrCitationBlock(candidate) &&
      !/^https?:\/\//i.test(candidate);
    if (isLikelySubtitle) {
      subtitle = candidate;
      bodyStart = 2;
    }
  }

  const remaining = usable.slice(bodyStart);
  const textBlocks = [];
  const sourceBlocks = [];

  for (const block of remaining) {
    if (isSourceOrCitationBlock(block)) {
      sourceBlocks.push(block);
    } else {
      textBlocks.push(block);
    }
  }

  // On reference slides, most content is citation text — keep it in textBlocks
  // and also expose a combined sourceOrCitationText when identifiable.
  const sourceOrCitationText =
    sourceBlocks.length > 0
      ? sourceBlocks.join("\n\n")
      : undefined;

  return {
    title,
    subtitle,
    textBlocks: textBlocks.filter(Boolean),
    sourceOrCitationText,
  };
}

function listSlideEntries(zip) {
  const entries = Object.keys(zip.files).filter((name) =>
    /^ppt\/slides\/slide\d+\.xml$/i.test(name),
  );

  if (entries.length === 0) {
    throw new Error(
      "No slide XML files found at ppt/slides/slideN.xml inside the PowerPoint archive.",
    );
  }

  entries.sort((a, b) => {
    const numA = Number.parseInt(a.match(/slide(\d+)\.xml/i)?.[1] ?? "0", 10);
    const numB = Number.parseInt(b.match(/slide(\d+)\.xml/i)?.[1] ?? "0", 10);
    return numA - numB;
  });

  return entries;
}

async function loadZip(pptxPath) {
  let buffer;
  try {
    buffer = fs.readFileSync(pptxPath);
  } catch (error) {
    throw new Error(
      `PowerPoint file is unreadable:\n  ${pptxPath}\n${error instanceof Error ? error.message : String(error)}`,
    );
  }

  try {
    return await JSZip.loadAsync(buffer);
  } catch (error) {
    throw new Error(
      `Failed to open PowerPoint as a ZIP archive:\n  ${pptxPath}\n${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

async function extractSlide(zip, entryName) {
  const match = entryName.match(/slide(\d+)\.xml/i);
  const slideNumber = Number.parseInt(match?.[1] ?? "0", 10);
  if (!Number.isFinite(slideNumber) || slideNumber < 1) {
    throw new Error(`Could not determine slide number from "${entryName}".`);
  }

  let xml;
  try {
    xml = await zip.file(entryName).async("text");
  } catch (error) {
    throw new Error(
      `Failed to read slide XML "${entryName}".\n${error instanceof Error ? error.message : String(error)}`,
    );
  }

  let parsed;
  try {
    parsed = xmlParser.parse(xml);
  } catch (error) {
    throw new Error(
      `Failed to parse slide XML "${entryName}".\n${error instanceof Error ? error.message : String(error)}`,
    );
  }

  const orderedBlocks = extractOrderedTextBlocks(parsed);
  const { title, subtitle, textBlocks, sourceOrCitationText } =
    splitTitleSubtitleAndBody(orderedBlocks);

  const slide = {
    slideNumber,
    title,
  };

  if (subtitle) {
    slide.subtitle = subtitle;
  }

  slide.textBlocks = textBlocks;
  slide.imagePath = `/slides/Slide${slideNumber}.PNG`;
  slide.section = sectionForSlide(slideNumber);

  if (sourceOrCitationText) {
    slide.sourceOrCitationText = sourceOrCitationText;
  }

  return slide;
}

async function main() {
  const pptxPath = resolvePptxPath();
  console.log(`Reading PowerPoint:\n  ${pptxPath}`);

  const zip = await loadZip(pptxPath);
  const slideEntries = listSlideEntries(zip);

  const slides = [];
  for (const entry of slideEntries) {
    slides.push(await extractSlide(zip, entry));
  }

  const presentation = {
    meta: {
      extractedAt: new Date().toISOString(),
      sourceFile: path.relative(ROOT, pptxPath).replaceAll("\\", "/"),
      slideCount: slides.length,
      note: "Text extracted verbatim from PowerPoint slide XML. Scientific content was not summarized or rewritten.",
    },
    slides,
  };

  const outDir = path.join(ROOT, "src", "data");
  const outPath = path.join(outDir, "presentation.json");

  try {
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(
      outPath,
      `${JSON.stringify(presentation, null, 2)}\n`,
      "utf8",
    );
  } catch (error) {
    throw new Error(
      `Failed to write ${outPath}\n${error instanceof Error ? error.message : String(error)}`,
    );
  }

  const bySection = {};
  for (const slide of slides) {
    bySection[slide.section] = (bySection[slide.section] ?? 0) + 1;
  }

  console.log(`Wrote presentation data:\n  ${outPath}`);
  console.log(`  Slides extracted: ${slides.length}`);
  for (const [section, count] of Object.entries(bySection)) {
    console.log(`  ${section}: ${count}`);
  }
}

try {
  await main();
} catch (error) {
  console.error(
    `\nextract-presentation failed:\n${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exit(1);
}
