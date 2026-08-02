/**
 * Import Naples Group Project Workflow workbook into normalized JSON.
 *
 * Reads the Excel source file (never modifies it) and writes
 * src/data/workflow.json for use by the Next.js application.
 *
 * Progress is derived from Status values in the app — Excel formula
 * cells (e.g. Progress Summary counts) are not treated as authoritative.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as XLSXNamespace from "xlsx";

// SheetJS CJS interop: named ESM exports omit readFile; use default when present.
const XLSX = XLSXNamespace.default ?? XLSXNamespace;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

const PREFERRED_WORKBOOK =
  "Naples_Group_Project_Workflow_Google_Sheets(1).xlsx";
const FALLBACK_WORKBOOK =
  "Naples_Group_Project_Workflow_Google_Sheets.xlsx";

const REQUIRED_SHEETS = [
  "Team Dashboard",
  "Task Assignments",
  "Final Slide Plan",
  "Timeline & Handoffs",
  "Merge Checklist",
  "Source Tracker",
];

/**
 * Status → progress percent.
 * Keep in sync with lib/status.ts (application source of truth).
 */
const STATUS_PROGRESS = {
  "not started": 0,
  "needs revision": 35,
  "in progress": 50,
  "ready for review": 85,
  complete: 100,
};

function resolveWorkbookPath() {
  const sourceDir = path.join(ROOT, "source-files");
  const preferred = path.join(sourceDir, PREFERRED_WORKBOOK);
  const fallback = path.join(sourceDir, FALLBACK_WORKBOOK);

  if (fs.existsSync(preferred)) {
    return preferred;
  }

  if (fs.existsSync(fallback)) {
    console.warn(
      `Warning: Preferred workbook not found:\n  ${preferred}\n` +
        `Using fallback workbook instead:\n  ${fallback}`,
    );
    return fallback;
  }

  throw new Error(
    [
      "Workbook not found.",
      `Looked for:`,
      `  1) ${preferred}`,
      `  2) ${fallback}`,
      `Place the Naples Group Project Workflow .xlsx file in source-files/ and try again.`,
    ].join("\n"),
  );
}

function sheetToMatrix(workbook, sheetName) {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    const available = workbook.SheetNames.join(", ") || "(none)";
    throw new Error(
      `Required sheet "${sheetName}" is missing from the workbook.\n` +
        `Available sheets: ${available}`,
    );
  }

  // raw: true avoids formula evaluation — we only use stored cell values.
  // defval: "" keeps column alignment for sparse rows.
  return XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
    blankrows: false,
    raw: true,
  });
}

function cellText(value) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/\u00a0/g, " ").trim();
}

function isBlankRow(row) {
  if (!Array.isArray(row) || row.length === 0) return true;
  return row.every((cell) => cellText(cell) === "");
}

/** Drop fully blank rows and trailing blank columns; keep row alignment. */
function cleanMatrix(matrix) {
  const withoutBlankRows = matrix
    .filter((row) => !isBlankRow(row))
    .map((row) => (Array.isArray(row) ? row.map(cellText) : []));

  if (withoutBlankRows.length === 0) return [];

  const maxLen = Math.max(...withoutBlankRows.map((r) => r.length));
  const usedColumns = [];

  for (let col = 0; col < maxLen; col += 1) {
    const hasValue = withoutBlankRows.some(
      (row) => cellText(row[col] ?? "") !== "",
    );
    if (hasValue) usedColumns.push(col);
  }

  return withoutBlankRows.map((row) =>
    usedColumns.map((col) => cellText(row[col] ?? "")),
  );
}

function toCamelCase(label) {
  const cleaned = cellText(label)
    .replace(/[–—]/g, "-")
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim();

  if (!cleaned) return "field";

  const parts = cleaned.split(/\s+/).filter(Boolean);
  return parts
    .map((part, index) => {
      const lower = part.toLowerCase();
      if (index === 0) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join("");
}

function normalizeStatus(status) {
  const text = cellText(status);
  if (!text) return "Not Started";

  const key = text.toLowerCase();
  const known = {
    "not started": "Not Started",
    "needs revision": "Needs Revision",
    "in progress": "In Progress",
    "ready for review": "Ready for Review",
    complete: "Complete",
    completed: "Complete",
  };

  return known[key] ?? text;
}

function progressFromStatus(status) {
  const key = normalizeStatus(status).toLowerCase();
  return STATUS_PROGRESS[key] ?? 0;
}

function findHeaderRow(matrix, requiredHeaders) {
  const required = requiredHeaders.map((h) => h.toLowerCase());

  for (let i = 0; i < matrix.length; i += 1) {
    const cells = matrix[i].map((c) => cellText(c).toLowerCase());
    const matched = required.every((header) => cells.includes(header));
    if (matched) return i;
  }

  throw new Error(
    `Could not find a header row containing: ${requiredHeaders.join(", ")}`,
  );
}

function rowsToObjects(matrix, headerIndex) {
  const headers = matrix[headerIndex].map((h, i) => {
    const name = toCamelCase(h);
    return name === "field" ? `column${i + 1}` : name;
  });

  // Ensure unique property names
  const seen = new Map();
  const uniqueHeaders = headers.map((name) => {
    const count = seen.get(name) ?? 0;
    seen.set(name, count + 1);
    return count === 0 ? name : `${name}${count + 1}`;
  });

  const records = [];

  for (let i = headerIndex + 1; i < matrix.length; i += 1) {
    const row = matrix[i];
    if (isBlankRow(row)) continue;

    const record = {};
    let hasMeaningfulValue = false;

    uniqueHeaders.forEach((key, col) => {
      const value = cellText(row[col] ?? "");
      record[key] = value;
      if (value) hasMeaningfulValue = true;
    });

    if (hasMeaningfulValue) records.push(record);
  }

  return { headers: uniqueHeaders, records };
}

function parseKeyValuePairs(matrix, startLabel) {
  const startIndex = matrix.findIndex(
    (row) => cellText(row[0]).toLowerCase() === startLabel.toLowerCase(),
  );
  if (startIndex === -1) return {};

  const result = {};
  for (let i = startIndex + 1; i < matrix.length; i += 1) {
    const row = matrix[i];
    const key = cellText(row[0]);
    const value = cellText(row[1]);

    // Stop when we hit another section header or the member table.
    if (!key && !value) continue;
    if (
      key &&
      !value &&
      (key === key.toUpperCase() ||
        key.toLowerCase() === "member" ||
        key.toLowerCase().startsWith("team working"))
    ) {
      break;
    }
    if (key.toLowerCase() === "member") break;

    if (key && value) {
      result[toCamelCase(key)] = value;
    }
  }
  return result;
}

function parseWorkingRules(matrix) {
  const startIndex = matrix.findIndex((row) =>
    cellText(row[0]).toLowerCase().includes("team working rules"),
  );
  if (startIndex === -1) return [];

  const rules = [];
  for (let i = startIndex + 1; i < matrix.length; i += 1) {
    const text = cellText(matrix[i][0]);
    if (!text) continue;
    // Stop if we somehow hit another all-caps section
    if (text === text.toUpperCase() && text.length < 40) break;
    rules.push(text.replace(/^\d+\.\s*/, ""));
  }
  return rules;
}

function parseTeamDashboard(matrix) {
  const cleaned = cleanMatrix(matrix);

  const title = cellText(cleaned[0]?.[0] ?? "");
  const subtitle =
    cleaned
      .slice(1, 6)
      .map((row) => cellText(row[0]))
      .find(
        (text) =>
          text &&
          !text.toUpperCase().includes("PROJECT SUMMARY") &&
          !text.toUpperCase().includes("PROGRESS SUMMARY"),
      ) ?? "";

  const projectSummary = parseKeyValuePairs(cleaned, "PROJECT SUMMARY");

  const memberHeaderIndex = findHeaderRow(cleaned, [
    "Member",
    "Status",
    "Final Slides",
  ]);
  const { records: memberRows } = rowsToObjects(cleaned, memberHeaderIndex);

  const members = memberRows
    .filter((row) => cellText(row.member).toLowerCase().startsWith("member"))
    .map((row) => {
      const status = normalizeStatus(row.status);
      return {
        member: cellText(row.member),
        naplesSection: cellText(row.naplesSection),
        finalSlides: cellText(row.finalSlides),
        status,
        progress: progressFromStatus(status),
        primaryHandoff: cellText(row.primaryHandoff),
      };
    });

  const statusCounts = {
    notStarted: 0,
    needsRevision: 0,
    inProgress: 0,
    readyForReview: 0,
    complete: 0,
  };

  for (const member of members) {
    const key = member.status.toLowerCase();
    if (key === "not started") statusCounts.notStarted += 1;
    else if (key === "needs revision") statusCounts.needsRevision += 1;
    else if (key === "in progress") statusCounts.inProgress += 1;
    else if (key === "ready for review") statusCounts.readyForReview += 1;
    else if (key === "complete") statusCounts.complete += 1;
  }

  const overallCompletion =
    members.length === 0
      ? 0
      : Math.round(
          members.reduce((sum, m) => sum + m.progress, 0) / members.length,
        );

  return {
    title,
    subtitle,
    projectSummary: {
      assignedCity: projectSummary.assignedCity ?? "",
      audience: projectSummary.audience ?? "",
      finalProduct: projectSummary.finalProduct ?? "",
      targetLength: projectSummary.targetLength ?? "",
      bigQuestion: projectSummary.bigQuestion ?? "",
      decisionQuestion: projectSummary.decisionQuestion ?? "",
    },
    // Counts and overall completion are derived from Status — not Excel formulas.
    progressSummary: {
      teamMembers: members.length,
      contentSlides: 16,
      assignmentsComplete: statusCounts.complete,
      assignmentsInProgress: statusCounts.inProgress,
      readyForReview: statusCounts.readyForReview,
      needsRevision: statusCounts.needsRevision,
      notStarted: statusCounts.notStarted,
      overallCompletion,
    },
    members,
    teamWorkingRules: parseWorkingRules(cleaned),
  };
}

function parseTaskAssignments(matrix) {
  const cleaned = cleanMatrix(matrix);
  const title = cellText(cleaned[0]?.[0] ?? "Task Assignments");

  const headerIndex = findHeaderRow(cleaned, [
    "Member",
    "Section",
    "Status",
    "Priority",
  ]);
  const { records } = rowsToObjects(cleaned, headerIndex);

  const assignments = records
    .filter((row) => cellText(row.member))
    .map((row) => {
      const status = normalizeStatus(row.status);
      return {
        member: cellText(row.member),
        section: cellText(row.section),
        finalSlides: cellText(row.finalSlides),
        draftSlidesToReuse: cellText(row.draftSlidesToReuse),
        requiredContent: cellText(row.requiredContent),
        visualsRequired: cellText(row.visualsRequired),
        deliverable: cellText(row.deliverable),
        dependenciesHandoff: cellText(
          row.dependenciesHandoff ?? row.dependenciesHandOff ?? "",
        ),
        status,
        priority: cellText(row.priority),
        progress: progressFromStatus(status),
        actualDueDate: cellText(row.actualDueDate),
        memberFileNotesLink: cellText(
          row.memberFileNotesLink ?? row.memberFileNotes ?? "",
        ),
      };
    });

  return { title, assignments };
}

function parseFinalSlidePlan(matrix) {
  const cleaned = cleanMatrix(matrix);
  const title = cellText(cleaned[0]?.[0] ?? "Final Slide Plan");

  const headerIndex = findHeaderRow(cleaned, [
    "Final #",
    "Slide Title",
    "Owner",
    "Status",
  ]);
  const { records } = rowsToObjects(cleaned, headerIndex);

  const slides = records
    .filter((row) => cellText(row.final ?? row.final1 ?? ""))
    .map((row) => {
      const status = normalizeStatus(row.status);
      const finalNumberRaw = cellText(row.final ?? row.final1 ?? "");
      const finalNumber = Number.parseInt(finalNumberRaw, 10);

      return {
        finalNumber: Number.isFinite(finalNumber)
          ? finalNumber
          : finalNumberRaw,
        slideTitle: cellText(row.slideTitle),
        owner: cellText(row.owner),
        requiredContentTakeaway: cellText(row.requiredContentTakeaway),
        suggestedVisual: cellText(row.suggestedVisual),
        existingDraftSlides: cellText(row.existingDraftSlides),
        citationSourceCheck: cellText(row.citationSourceCheck),
        status,
        progress: progressFromStatus(status),
      };
    });

  return { title, slides };
}

function parseTimeline(matrix) {
  const cleaned = cleanMatrix(matrix);
  const title = cellText(cleaned[0]?.[0] ?? "Timeline & Handoffs");

  const headerIndex = findHeaderRow(cleaned, [
    "Phase",
    "Target Day",
    "Owner",
    "Status",
  ]);
  const { records } = rowsToObjects(cleaned, headerIndex);

  const phases = records
    .filter((row) => cellText(row.phase))
    .map((row) => {
      const status = normalizeStatus(row.status);
      return {
        phase: cellText(row.phase),
        targetDay: cellText(row.targetDay),
        owner: cellText(row.owner),
        action: cellText(row.action),
        requiredOutput: cellText(row.requiredOutput),
        dependsOn: cellText(row.dependsOn),
        approvalHandoff: cellText(row.approvalHandoff),
        status,
        progress: progressFromStatus(status),
      };
    });

  return { title, phases };
}

function parseMergeChecklist(matrix) {
  const cleaned = cleanMatrix(matrix);
  const title = cellText(cleaned[0]?.[0] ?? "Merge Checklist");

  const headerIndex = findHeaderRow(cleaned, [
    "Category",
    "Checklist Item",
    "Owner",
    "Status",
  ]);
  const { records } = rowsToObjects(cleaned, headerIndex);

  const items = records
    .filter((row) => cellText(row.checklistItem))
    .map((row) => {
      const status = normalizeStatus(row.status);
      return {
        category: cellText(row.category),
        checklistItem: cellText(row.checklistItem),
        owner: cellText(row.owner),
        evidenceSlides: cellText(row.evidenceSlide ?? row.evidenceSlides),
        status,
        progress: progressFromStatus(status),
        notesFixNeeded: cellText(row.notesFixNeeded),
      };
    });

  return { title, items };
}

function parseSourceTracker(matrix) {
  const cleaned = cleanMatrix(matrix);
  const title = cellText(cleaned[0]?.[0] ?? "Source Tracker");

  const headerIndex = findHeaderRow(cleaned, [
    "Section",
    "Source / Organization",
    "URL",
    "Verification Status",
  ]);
  const { records } = rowsToObjects(cleaned, headerIndex);

  const verificationNoteRow = cleaned.find((row) =>
    cellText(row[0])
      .toLowerCase()
      .includes("do not mark a source complete"),
  );

  const sources = records
    .filter((row) => {
      const source = cellText(row.sourceOrganization);
      const section = cellText(row.section);
      // Skip the footer instruction row if it landed in records
      if (source.toLowerCase().includes("do not mark a source")) return false;
      if (section.toLowerCase().includes("do not mark a source")) return false;
      return Boolean(source || section);
    })
    .map((row) => {
      const status = normalizeStatus(row.verificationStatus);
      return {
        section: cellText(row.section),
        sourceOrganization: cellText(row.sourceOrganization),
        primaryUse: cellText(row.primaryUse),
        url: cellText(row.url),
        assignedTo: cellText(row.assignedTo),
        verificationStatus: status,
        progress: progressFromStatus(status),
        notesImageCredit: cellText(row.notesImageCredit),
      };
    });

  return {
    title,
    sources,
    verificationNote: verificationNoteRow
      ? cellText(verificationNoteRow[0])
      : "",
  };
}

function assertRequiredSheets(workbook) {
  const missing = REQUIRED_SHEETS.filter(
    (name) => !workbook.SheetNames.includes(name),
  );

  if (missing.length > 0) {
    throw new Error(
      [
        "The workbook is missing required sheet(s):",
        ...missing.map((name) => `  - ${name}`),
        "",
        `Available sheets: ${workbook.SheetNames.join(", ") || "(none)"}`,
      ].join("\n"),
    );
  }
}

function main() {
  const workbookPath = resolveWorkbookPath();
  console.log(`Reading workbook:\n  ${workbookPath}`);

  let workbook;
  try {
    // cellFormula: false — do not depend on Excel formula expressions.
    workbook = XLSX.readFile(workbookPath, {
      cellDates: true,
      cellFormula: false,
      cellNF: false,
      cellText: false,
    });
  } catch (error) {
    throw new Error(
      `Failed to read workbook at ${workbookPath}\n${error instanceof Error ? error.message : String(error)}`,
    );
  }

  assertRequiredSheets(workbook);

  const workflow = {
    meta: {
      importedAt: new Date().toISOString(),
      sourceFile: path.relative(ROOT, workbookPath).replaceAll("\\", "/"),
      sheets: REQUIRED_SHEETS,
      progressNote:
        "Progress values are calculated from Status fields in the application, not from Excel formulas.",
    },
    teamDashboard: parseTeamDashboard(
      sheetToMatrix(workbook, "Team Dashboard"),
    ),
    taskAssignments: parseTaskAssignments(
      sheetToMatrix(workbook, "Task Assignments"),
    ),
    finalSlidePlan: parseFinalSlidePlan(
      sheetToMatrix(workbook, "Final Slide Plan"),
    ),
    timelineAndHandoffs: parseTimeline(
      sheetToMatrix(workbook, "Timeline & Handoffs"),
    ),
    mergeChecklist: parseMergeChecklist(
      sheetToMatrix(workbook, "Merge Checklist"),
    ),
    sourceTracker: parseSourceTracker(
      sheetToMatrix(workbook, "Source Tracker"),
    ),
  };

  const outDir = path.join(ROOT, "src", "data");
  const outPath = path.join(outDir, "workflow.json");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(workflow, null, 2)}\n`, "utf8");

  console.log(`Wrote normalized workflow data:\n  ${outPath}`);
  console.log(
    [
      `  Members: ${workflow.teamDashboard.members.length}`,
      `  Assignments: ${workflow.taskAssignments.assignments.length}`,
      `  Final slides: ${workflow.finalSlidePlan.slides.length}`,
      `  Timeline phases: ${workflow.timelineAndHandoffs.phases.length}`,
      `  Checklist items: ${workflow.mergeChecklist.items.length}`,
      `  Sources: ${workflow.sourceTracker.sources.length}`,
    ].join("\n"),
  );
}

try {
  main();
} catch (error) {
  console.error(
    `\nimport-workflow failed:\n${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exit(1);
}
