import { describe, expect, it } from "vitest";

import {
  BULK_PLAYER_IMPORT_MAX_ROWS,
  parseBulkPlayerInput,
  splitCsvLine,
} from "./parse-player-input";

const DEFAULT_ROSTER_ID = "00000000-0000-0000-0000-0000000000aa";
const PROS_ROSTER_ID = "00000000-0000-0000-0000-0000000000bb";
const AMATEURS_ROSTER_ID = "00000000-0000-0000-0000-0000000000cc";

const ROSTER_CATEGORIES = [
  { id: DEFAULT_ROSTER_ID, name: "Unassigned" },
  { id: PROS_ROSTER_ID, name: "Pros" },
  { id: AMATEURS_ROSTER_ID, name: "Amateurs" },
];

const baseOptions = {
  defaultRosterCategoryId: DEFAULT_ROSTER_ID,
  defaultGender: "OTHER" as const,
  rosterCategories: ROSTER_CATEGORIES,
};

describe("splitCsvLine", () => {
  it("splits a plain comma-delimited line", () => {
    expect(splitCsvLine("Alex, Morgan, note")).toEqual(["Alex", "Morgan", "note"]);
  });

  it("respects double-quoted fields containing commas", () => {
    expect(splitCsvLine('Alex,"Morgan, Jr.",note')).toEqual(["Alex", "Morgan, Jr.", "note"]);
  });

  it("unescapes doubled quotes inside quoted fields", () => {
    expect(splitCsvLine('name,"He said ""hi""",note')).toEqual(["name", 'He said "hi"', "note"]);
  });

  it("returns a single empty cell for an empty line", () => {
    expect(splitCsvLine("")).toEqual([""]);
  });
});

describe("parseBulkPlayerInput — paste mode", () => {
  it("parses one player per non-blank line and applies defaults", () => {
    const result = parseBulkPlayerInput({
      ...baseOptions,
      mode: "paste",
      rawText: "Alex Morgan\n\nJamie Chen\n  \nSam Ali\n",
    });

    expect(result.errors).toEqual([]);
    expect(result.skippedDuplicates).toEqual([]);
    expect(result.rows).toEqual([
      { name: "Alex Morgan", gender: "OTHER", rosterCategoryId: DEFAULT_ROSTER_ID },
      { name: "Jamie Chen", gender: "OTHER", rosterCategoryId: DEFAULT_ROSTER_ID },
      { name: "Sam Ali", gender: "OTHER", rosterCategoryId: DEFAULT_ROSTER_ID },
    ]);
  });

  it("reads gender from the 2nd column and notes from remaining columns", () => {
    const result = parseBulkPlayerInput({
      ...baseOptions,
      mode: "paste",
      rawText: "Alex Morgan, F, left-handed\nRavi Kumar, male, right-handed, sharp overhead",
    });

    expect(result.errors).toEqual([]);
    expect(result.rows).toEqual([
      {
        name: "Alex Morgan",
        gender: "FEMALE",
        rosterCategoryId: DEFAULT_ROSTER_ID,
        notes: "left-handed",
      },
      {
        name: "Ravi Kumar",
        gender: "MALE",
        rosterCategoryId: DEFAULT_ROSTER_ID,
        notes: "right-handed, sharp overhead",
      },
    ]);
  });

  it("falls back to defaultGender when the second column is unrecognized", () => {
    const result = parseBulkPlayerInput({
      ...baseOptions,
      defaultGender: "MALE",
      mode: "paste",
      rawText: "Alex Morgan, unknown-token",
    });

    expect(result.errors).toEqual([]);
    expect(result.rows).toEqual([
      {
        name: "Alex Morgan",
        gender: "MALE",
        rosterCategoryId: DEFAULT_ROSTER_ID,
        notes: "unknown-token",
      },
    ]);
  });

  it("skips rows that duplicate existing tournament players (case-insensitive)", () => {
    const result = parseBulkPlayerInput({
      ...baseOptions,
      mode: "paste",
      rawText: "Alex Morgan\nalex morgan\nJamie Chen",
      existingPlayerNames: new Set(["alex morgan"]),
    });

    expect(result.rows).toEqual([
      { name: "Jamie Chen", gender: "OTHER", rosterCategoryId: DEFAULT_ROSTER_ID },
    ]);
    expect(result.skippedDuplicates).toHaveLength(2);
    expect(result.skippedDuplicates[0]?.message).toContain("Already on the roster");
    expect(result.skippedDuplicates[1]?.message).toContain("Already on the roster");
  });

  it("collapses in-batch duplicates into a single row", () => {
    const result = parseBulkPlayerInput({
      ...baseOptions,
      mode: "paste",
      rawText: "Alex Morgan\nAlex Morgan\nAlex morgan",
    });

    expect(result.rows).toHaveLength(1);
    expect(result.skippedDuplicates).toHaveLength(2);
    expect(result.skippedDuplicates[0]?.message).toContain("Duplicate of an earlier row");
  });

  it("flags rows whose name exceeds 120 characters as errors", () => {
    const longName = "a".repeat(121);
    const result = parseBulkPlayerInput({
      ...baseOptions,
      mode: "paste",
      rawText: `${longName}\nAlex Morgan`,
    });

    expect(result.rows.map((row) => row.name)).toEqual(["Alex Morgan"]);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.message).toContain("longer than 120");
  });

  it("stops after BULK_PLAYER_IMPORT_MAX_ROWS with a bounded-batch error", () => {
    const lines = Array.from(
      { length: BULK_PLAYER_IMPORT_MAX_ROWS + 5 },
      (_, index) => `Player ${index + 1}`,
    );
    const result = parseBulkPlayerInput({
      ...baseOptions,
      mode: "paste",
      rawText: lines.join("\n"),
    });

    expect(result.rows).toHaveLength(BULK_PLAYER_IMPORT_MAX_ROWS);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.message).toContain(String(BULK_PLAYER_IMPORT_MAX_ROWS));
  });
});

describe("parseBulkPlayerInput — csv mode", () => {
  it("maps aliased headers case-insensitively", () => {
    const csv = [
      "Name,Gender,Roster Group,Notes,Base Price,Entry Fee Paid",
      "Alex Morgan,F,Pros,,500,yes",
      "Ravi Kumar,M,Amateurs,steady,,no",
    ].join("\n");

    const result = parseBulkPlayerInput({
      ...baseOptions,
      mode: "csv",
      rawText: csv,
    });

    expect(result.errors).toEqual([]);
    expect(result.rows).toEqual([
      {
        name: "Alex Morgan",
        gender: "FEMALE",
        rosterCategoryId: PROS_ROSTER_ID,
        basePrice: 500,
        hasPaidEntryFee: true,
      },
      {
        name: "Ravi Kumar",
        gender: "MALE",
        rosterCategoryId: AMATEURS_ROSTER_ID,
        notes: "steady",
        hasPaidEntryFee: false,
      },
    ]);
  });

  it("falls back to the default roster group when the name is unknown", () => {
    const csv = ["name,roster_group", "Alex Morgan,Legends"].join("\n");

    const result = parseBulkPlayerInput({
      ...baseOptions,
      mode: "csv",
      rawText: csv,
    });

    expect(result.rows).toEqual([
      { name: "Alex Morgan", gender: "OTHER", rosterCategoryId: DEFAULT_ROSTER_ID },
    ]);
  });

  it("returns an error when the header row has no name column", () => {
    const csv = ["gender,notes", "F,left-handed"].join("\n");
    const result = parseBulkPlayerInput({ ...baseOptions, mode: "csv", rawText: csv });
    expect(result.rows).toEqual([]);
    expect(result.errors[0]?.message).toContain('"name" column');
  });

  it("ignores commas inside quoted names", () => {
    const csv = ["name", '"Morgan, Alex"'].join("\n");
    const result = parseBulkPlayerInput({ ...baseOptions, mode: "csv", rawText: csv });
    expect(result.rows).toEqual([
      { name: "Morgan, Alex", gender: "OTHER", rosterCategoryId: DEFAULT_ROSTER_ID },
    ]);
  });

  it("clamps notes to 500 characters", () => {
    const longNote = "n".repeat(600);
    const csv = ["name,notes", `Alex Morgan,${longNote}`].join("\n");
    const result = parseBulkPlayerInput({ ...baseOptions, mode: "csv", rawText: csv });
    expect(result.rows[0]?.notes).toHaveLength(500);
  });

  it("rejects a base_price above the 1_000_000 cap by ignoring the field", () => {
    const csv = ["name,base_price", "Alex Morgan,9999999"].join("\n");
    const result = parseBulkPlayerInput({ ...baseOptions, mode: "csv", rawText: csv });
    expect(result.rows[0]).toEqual({
      name: "Alex Morgan",
      gender: "OTHER",
      rosterCategoryId: DEFAULT_ROSTER_ID,
    });
  });

  it("emits an error for empty input", () => {
    const result = parseBulkPlayerInput({ ...baseOptions, mode: "csv", rawText: "" });
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.message).toContain("Paste some rows");
  });
});
