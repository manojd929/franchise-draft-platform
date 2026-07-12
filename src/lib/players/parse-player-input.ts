/**
 * Pure parser for bulk-adding players from free text or CSV.
 *
 * Kept dependency-free and side-effect-free so it can run in tests, on the
 * server for the bulk-create action, and in the browser for the live preview.
 */

const MAX_NAME_LENGTH = 120;
const MAX_NOTES_LENGTH = 500;
const MIN_BASE_PRICE = 0;
const MAX_BASE_PRICE = 1_000_000;

export const BULK_PLAYER_IMPORT_MAX_ROWS = 500;

export type BulkPlayerGender = "MALE" | "FEMALE" | "OTHER";
export type BulkPlayerInputMode = "paste" | "csv";

export interface BulkRosterCategoryOption {
  id: string;
  name: string;
}

export interface BulkPlayerRow {
  name: string;
  gender: BulkPlayerGender;
  rosterCategoryId: string;
  notes?: string;
  basePrice?: number;
  hasPaidEntryFee?: boolean;
}

export interface BulkPlayerIssue {
  lineNumber: number;
  raw: string;
  message: string;
}

export interface BulkPlayerParseResult {
  rows: BulkPlayerRow[];
  skippedDuplicates: BulkPlayerIssue[];
  errors: BulkPlayerIssue[];
}

export interface BulkPlayerParseOptions {
  rawText: string;
  mode: BulkPlayerInputMode;
  defaultRosterCategoryId: string;
  defaultGender: BulkPlayerGender;
  rosterCategories: BulkRosterCategoryOption[];
  /** Case-insensitive names already in the tournament; used to skip duplicates. */
  existingPlayerNames?: ReadonlySet<string>;
}

const GENDER_ALIASES: Readonly<Record<string, BulkPlayerGender>> = Object.freeze({
  m: "MALE",
  male: "MALE",
  man: "MALE",
  boy: "MALE",
  f: "FEMALE",
  female: "FEMALE",
  woman: "FEMALE",
  girl: "FEMALE",
  o: "OTHER",
  other: "OTHER",
  nb: "OTHER",
  x: "OTHER",
});

const TRUTHY_BOOLEAN_LITERALS: ReadonlySet<string> = new Set(["true", "yes", "y", "1", "paid"]);
const FALSY_BOOLEAN_LITERALS: ReadonlySet<string> = new Set(["false", "no", "n", "0", "unpaid"]);

/** CSV headers we recognize (case-insensitive, hyphen/underscore-insensitive). */
const CSV_HEADER_ALIASES: Readonly<Record<string, keyof BulkPlayerRow | "roster_group">> =
  Object.freeze({
    name: "name",
    player: "name",
    playername: "name",
    gender: "gender",
    sex: "gender",
    roster: "roster_group",
    rostergroup: "roster_group",
    category: "roster_group",
    group: "roster_group",
    notes: "notes",
    note: "notes",
    baseprice: "basePrice",
    price: "basePrice",
    entryfeepaid: "hasPaidEntryFee",
    paid: "hasPaidEntryFee",
  });

/**
 * RFC-4180-compatible-ish single-line CSV splitter.
 *
 * Handles double-quoted fields with escaped `""` sequences. This is
 * deliberately more permissive than a full CSV parser (no multiline fields)
 * because our inputs are one row per line pasted from a spreadsheet.
 */
export function splitCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i += 1;
        continue;
      }
      if (ch === '"') {
        inQuotes = false;
        continue;
      }
      current += ch;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ",") {
      fields.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  fields.push(current);
  return fields.map((field) => field.trim());
}

function normalizeHeaderKey(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[\s_\-]/gu, "");
}

function normalizeGenderToken(raw: string | undefined): BulkPlayerGender | null {
  if (raw === undefined) return null;
  const key = raw.trim().toLowerCase();
  if (key === "") return null;
  return GENDER_ALIASES[key] ?? null;
}

function normalizeBooleanToken(raw: string | undefined): boolean | null {
  if (raw === undefined) return null;
  const key = raw.trim().toLowerCase();
  if (key === "") return null;
  if (TRUTHY_BOOLEAN_LITERALS.has(key)) return true;
  if (FALSY_BOOLEAN_LITERALS.has(key)) return false;
  return null;
}

function normalizeBasePriceToken(raw: string | undefined): number | null {
  if (raw === undefined) return null;
  const trimmed = raw.trim().replace(/,/gu, "");
  if (trimmed === "") return null;
  const numeric = Number(trimmed);
  if (!Number.isFinite(numeric)) return null;
  const asInt = Math.trunc(numeric);
  if (asInt < MIN_BASE_PRICE || asInt > MAX_BASE_PRICE) return null;
  return asInt;
}

function splitTextIntoLines(rawText: string): string[] {
  return rawText.split(/\r?\n/u);
}

function buildRosterLookup(categories: BulkRosterCategoryOption[]): ReadonlyMap<string, string> {
  const lookup = new Map<string, string>();
  for (const category of categories) {
    lookup.set(category.name.trim().toLowerCase(), category.id);
  }
  return lookup;
}

interface BuildRowContext {
  lineNumber: number;
  raw: string;
  defaultRosterCategoryId: string;
  defaultGender: BulkPlayerGender;
  rosterLookup: ReadonlyMap<string, string>;
  seenNamesLower: Set<string>;
  existingPlayerNames?: ReadonlySet<string>;
}

interface RawPlayerFields {
  name?: string;
  gender?: string;
  rosterGroup?: string;
  notes?: string;
  basePrice?: string;
  hasPaidEntryFee?: string;
}

function buildRow(
  fields: RawPlayerFields,
  ctx: BuildRowContext,
): { kind: "row"; row: BulkPlayerRow } | { kind: "duplicate" | "error"; issue: BulkPlayerIssue } {
  const rawName = fields.name?.trim() ?? "";
  if (rawName === "") {
    return {
      kind: "error",
      issue: { lineNumber: ctx.lineNumber, raw: ctx.raw, message: "Missing player name." },
    };
  }
  if (rawName.length > MAX_NAME_LENGTH) {
    return {
      kind: "error",
      issue: {
        lineNumber: ctx.lineNumber,
        raw: ctx.raw,
        message: `Name is longer than ${MAX_NAME_LENGTH} characters.`,
      },
    };
  }

  const nameLower = rawName.toLowerCase();
  if (ctx.existingPlayerNames?.has(nameLower)) {
    return {
      kind: "duplicate",
      issue: {
        lineNumber: ctx.lineNumber,
        raw: ctx.raw,
        message: "Already on the roster.",
      },
    };
  }
  if (ctx.seenNamesLower.has(nameLower)) {
    return {
      kind: "duplicate",
      issue: {
        lineNumber: ctx.lineNumber,
        raw: ctx.raw,
        message: "Duplicate of an earlier row in this import.",
      },
    };
  }
  ctx.seenNamesLower.add(nameLower);

  const gender = normalizeGenderToken(fields.gender) ?? ctx.defaultGender;

  const rosterCategoryId = (() => {
    const requested = fields.rosterGroup?.trim().toLowerCase();
    if (!requested) return ctx.defaultRosterCategoryId;
    const matched = ctx.rosterLookup.get(requested);
    return matched ?? ctx.defaultRosterCategoryId;
  })();

  const notes = (() => {
    const trimmed = fields.notes?.trim();
    if (!trimmed) return undefined;
    if (trimmed.length > MAX_NOTES_LENGTH) return trimmed.slice(0, MAX_NOTES_LENGTH);
    return trimmed;
  })();

  const basePriceParsed = normalizeBasePriceToken(fields.basePrice);
  const hasPaidEntryFeeParsed = normalizeBooleanToken(fields.hasPaidEntryFee);

  const row: BulkPlayerRow = {
    name: rawName,
    gender,
    rosterCategoryId,
    ...(notes !== undefined ? { notes } : {}),
    ...(basePriceParsed !== null ? { basePrice: basePriceParsed } : {}),
    ...(hasPaidEntryFeeParsed !== null ? { hasPaidEntryFee: hasPaidEntryFeeParsed } : {}),
  };
  return { kind: "row", row };
}

interface CsvHeaderColumnMap {
  name: number;
  gender: number | null;
  rosterGroup: number | null;
  notes: number | null;
  basePrice: number | null;
  hasPaidEntryFee: number | null;
}

function readCsvHeader(cells: string[]): CsvHeaderColumnMap | null {
  const columns: CsvHeaderColumnMap = {
    name: -1,
    gender: null,
    rosterGroup: null,
    notes: null,
    basePrice: null,
    hasPaidEntryFee: null,
  };
  cells.forEach((cell, index) => {
    const canonical = CSV_HEADER_ALIASES[normalizeHeaderKey(cell)];
    switch (canonical) {
      case "name":
        columns.name = index;
        break;
      case "gender":
        columns.gender = index;
        break;
      case "roster_group":
        columns.rosterGroup = index;
        break;
      case "notes":
        columns.notes = index;
        break;
      case "basePrice":
        columns.basePrice = index;
        break;
      case "hasPaidEntryFee":
        columns.hasPaidEntryFee = index;
        break;
      default:
        break;
    }
  });
  return columns.name >= 0 ? columns : null;
}

function parseCsv(
  rawText: string,
  options: Omit<BulkPlayerParseOptions, "rawText" | "mode">,
): BulkPlayerParseResult {
  const rows: BulkPlayerRow[] = [];
  const errors: BulkPlayerIssue[] = [];
  const skippedDuplicates: BulkPlayerIssue[] = [];
  const seenNamesLower = new Set<string>();
  const rosterLookup = buildRosterLookup(options.rosterCategories);

  const lines = splitTextIntoLines(rawText);
  let headerColumns: CsvHeaderColumnMap | null = null;
  let dataLineNumber = 0;

  for (let index = 0; index < lines.length; index += 1) {
    const raw = lines[index];
    const trimmed = raw.trim();
    if (trimmed === "") continue;

    const cells = splitCsvLine(raw);
    if (headerColumns === null) {
      headerColumns = readCsvHeader(cells);
      if (headerColumns === null) {
        errors.push({
          lineNumber: index + 1,
          raw,
          message: 'CSV must start with a header row containing at least a "name" column.',
        });
        return { rows, errors, skippedDuplicates };
      }
      continue;
    }

    dataLineNumber += 1;
    if (rows.length + skippedDuplicates.length + errors.length >= BULK_PLAYER_IMPORT_MAX_ROWS) {
      errors.push({
        lineNumber: index + 1,
        raw,
        message: `Row cap is ${BULK_PLAYER_IMPORT_MAX_ROWS}; split the import.`,
      });
      break;
    }

    const fields: RawPlayerFields = {
      name: cells[headerColumns.name],
      gender: headerColumns.gender !== null ? cells[headerColumns.gender] : undefined,
      rosterGroup:
        headerColumns.rosterGroup !== null ? cells[headerColumns.rosterGroup] : undefined,
      notes: headerColumns.notes !== null ? cells[headerColumns.notes] : undefined,
      basePrice: headerColumns.basePrice !== null ? cells[headerColumns.basePrice] : undefined,
      hasPaidEntryFee:
        headerColumns.hasPaidEntryFee !== null ? cells[headerColumns.hasPaidEntryFee] : undefined,
    };

    const result = buildRow(fields, {
      lineNumber: index + 1,
      raw,
      defaultRosterCategoryId: options.defaultRosterCategoryId,
      defaultGender: options.defaultGender,
      rosterLookup,
      seenNamesLower,
      existingPlayerNames: options.existingPlayerNames,
    });
    if (result.kind === "row") {
      rows.push(result.row);
    } else if (result.kind === "duplicate") {
      skippedDuplicates.push(result.issue);
    } else {
      errors.push(result.issue);
    }
  }

  if (headerColumns === null && dataLineNumber === 0) {
    errors.push({
      lineNumber: 1,
      raw: "",
      message: "Paste some rows first.",
    });
  }

  return { rows, errors, skippedDuplicates };
}

function parsePaste(
  rawText: string,
  options: Omit<BulkPlayerParseOptions, "rawText" | "mode">,
): BulkPlayerParseResult {
  const rows: BulkPlayerRow[] = [];
  const errors: BulkPlayerIssue[] = [];
  const skippedDuplicates: BulkPlayerIssue[] = [];
  const seenNamesLower = new Set<string>();
  const rosterLookup = buildRosterLookup(options.rosterCategories);

  const lines = splitTextIntoLines(rawText);
  for (let index = 0; index < lines.length; index += 1) {
    const raw = lines[index];
    if (raw.trim() === "") continue;

    if (rows.length + skippedDuplicates.length + errors.length >= BULK_PLAYER_IMPORT_MAX_ROWS) {
      errors.push({
        lineNumber: index + 1,
        raw,
        message: `Row cap is ${BULK_PLAYER_IMPORT_MAX_ROWS}; split the import.`,
      });
      break;
    }

    const parts = splitCsvLine(raw);
    const secondColumnGender = normalizeGenderToken(parts[1]);
    /**
     * Paste column 2 is ambiguous: it might be a gender token or the start of
     * notes. Treat it as gender only when it parses cleanly; otherwise fold it
     * back into notes so the pasted context is not silently dropped.
     */
    const fields: RawPlayerFields = {
      name: parts[0],
      gender: secondColumnGender !== null ? parts[1] : undefined,
      notes:
        secondColumnGender !== null
          ? parts.slice(2).join(", ") || undefined
          : parts.slice(1).join(", ") || undefined,
    };

    const result = buildRow(fields, {
      lineNumber: index + 1,
      raw,
      defaultRosterCategoryId: options.defaultRosterCategoryId,
      defaultGender: options.defaultGender,
      rosterLookup,
      seenNamesLower,
      existingPlayerNames: options.existingPlayerNames,
    });
    if (result.kind === "row") {
      rows.push(result.row);
    } else if (result.kind === "duplicate") {
      skippedDuplicates.push(result.issue);
    } else {
      errors.push(result.issue);
    }
  }
  return { rows, errors, skippedDuplicates };
}

export function parseBulkPlayerInput(options: BulkPlayerParseOptions): BulkPlayerParseResult {
  if (options.mode === "csv") {
    return parseCsv(options.rawText, options);
  }
  return parsePaste(options.rawText, options);
}
