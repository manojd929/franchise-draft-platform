"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { bulkCreatePlayersAction } from "@/features/tournaments/actions";
import type { RosterCategorySelectOption } from "@/features/tournaments/players-quick-add";
import {
  BULK_PLAYER_IMPORT_MAX_ROWS,
  parseBulkPlayerInput,
  type BulkPlayerGender,
  type BulkPlayerInputMode,
} from "@/lib/players/parse-player-input";
import { cn } from "@/lib/utils";

interface PlayersBulkImportSheetProps {
  tournamentSlug: string;
  rosterCategories: RosterCategorySelectOption[];
  defaultRosterCategoryId: string;
  existingPlayerNamesLower: string[];
  disabled?: boolean;
}

const PASTE_PLACEHOLDER = `Alex Morgan
Jamie Chen, F
Ravi Kumar, M, sharp overhead`;

const CSV_PLACEHOLDER = `name,gender,roster_group,notes,base_price,entry_fee_paid
Alex Morgan,F,Pros,,500,yes
Ravi Kumar,M,Amateurs,steady,,no`;

const GENDER_LABELS: Record<BulkPlayerGender, string> = {
  MALE: "Male",
  FEMALE: "Female",
  OTHER: "Other",
};

const MODE_LABELS: Record<BulkPlayerInputMode, string> = {
  paste: "Paste names",
  csv: "CSV / spreadsheet",
};

const selectClassName =
  "min-h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

export function PlayersBulkImportSheet({
  tournamentSlug,
  rosterCategories,
  defaultRosterCategoryId,
  existingPlayerNamesLower,
  disabled = false,
}: PlayersBulkImportSheetProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<BulkPlayerInputMode>("paste");
  const [rawText, setRawText] = useState("");
  const [selectedDefaultRosterId, setSelectedDefaultRosterId] =
    useState<string>(defaultRosterCategoryId);
  const [selectedDefaultGender, setSelectedDefaultGender] = useState<BulkPlayerGender>("OTHER");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const existingNames = useMemo(
    () => new Set(existingPlayerNamesLower.map((name) => name.toLowerCase())),
    [existingPlayerNamesLower],
  );

  const parseResult = useMemo(
    () =>
      parseBulkPlayerInput({
        rawText,
        mode,
        defaultRosterCategoryId: selectedDefaultRosterId,
        defaultGender: selectedDefaultGender,
        rosterCategories,
        existingPlayerNames: existingNames,
      }),
    [
      rawText,
      mode,
      selectedDefaultRosterId,
      selectedDefaultGender,
      rosterCategories,
      existingNames,
    ],
  );

  const canSubmit = parseResult.rows.length > 0 && !isSubmitting;

  const resetForm = () => {
    setRawText("");
    setSubmitError(null);
    setMode("paste");
  };

  async function handleImport(): Promise<void> {
    if (!canSubmit) return;
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const result = await bulkCreatePlayersAction({
        tournamentSlug,
        players: parseResult.rows,
      });
      if (!result.ok) {
        setSubmitError(result.error);
        return;
      }
      const created = result.createdCount ?? parseResult.rows.length;
      toast.success(created === 1 ? "1 player added." : `${created} players added.`);
      resetForm();
      setOpen(false);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) resetForm();
      }}
    >
      <SheetTrigger
        type="button"
        disabled={disabled}
        className={cn(
          "inline-flex min-h-11 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium shadow-xs transition-colors hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60",
        )}
      >
        Bulk import
      </SheetTrigger>
      <SheetContent side="right" className="w-full gap-0 sm:max-w-lg md:max-w-xl">
        <SheetHeader className="border-b border-border/60 pb-4">
          <SheetTitle>Bulk import players</SheetTitle>
          <SheetDescription>
            Paste a list of names, or drop a CSV exported from a spreadsheet. We&rsquo;ll show a
            live preview and skip anyone already on the roster.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
          <div
            role="tablist"
            aria-label="Import mode"
            className="inline-flex rounded-lg border border-border/70 bg-muted/40 p-1 text-sm"
          >
            {(Object.keys(MODE_LABELS) as BulkPlayerInputMode[]).map((value) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={mode === value}
                onClick={() => setMode(value)}
                className={cn(
                  "min-h-9 rounded-md px-4 font-medium transition-colors",
                  mode === value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {MODE_LABELS[value]}
              </button>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="bulk-default-roster">Default roster group</Label>
              <select
                id="bulk-default-roster"
                value={selectedDefaultRosterId}
                onChange={(event) => setSelectedDefaultRosterId(event.target.value)}
                className={selectClassName}
              >
                {rosterCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Used when a row doesn&rsquo;t specify one.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bulk-default-gender">Default gender</Label>
              <select
                id="bulk-default-gender"
                value={selectedDefaultGender}
                onChange={(event) =>
                  setSelectedDefaultGender(event.target.value as BulkPlayerGender)
                }
                className={selectClassName}
              >
                {(Object.keys(GENDER_LABELS) as BulkPlayerGender[]).map((value) => (
                  <option key={value} value={value}>
                    {GENDER_LABELS[value]}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">Applied when the row omits a gender.</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bulk-raw-text">
              {mode === "paste" ? "Paste one player per line" : "Paste CSV rows"}
            </Label>
            <Textarea
              id="bulk-raw-text"
              rows={8}
              value={rawText}
              onChange={(event) => setRawText(event.target.value)}
              placeholder={mode === "paste" ? PASTE_PLACEHOLDER : CSV_PLACEHOLDER}
              spellCheck={false}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              {mode === "paste"
                ? "Format per line: name, gender (M/F/O optional), notes."
                : `Header row required. Recognized columns: name (required), gender, roster_group, notes, base_price, entry_fee_paid. Up to ${BULK_PLAYER_IMPORT_MAX_ROWS} rows per import.`}
            </p>
          </div>

          <BulkImportPreview
            valid={parseResult.rows.length}
            duplicates={parseResult.skippedDuplicates.length}
            errors={parseResult.errors.length}
          />

          {parseResult.errors.length > 0 ? (
            <details className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm">
              <summary className="cursor-pointer font-medium text-destructive">
                {parseResult.errors.length} row
                {parseResult.errors.length === 1 ? "" : "s"} with errors
              </summary>
              <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                {parseResult.errors.slice(0, 10).map((issue) => (
                  <li key={`${issue.lineNumber}-${issue.raw}`}>
                    <span className="font-mono text-foreground">Line {issue.lineNumber}:</span>{" "}
                    {issue.message}
                  </li>
                ))}
                {parseResult.errors.length > 10 ? (
                  <li>… and {parseResult.errors.length - 10} more.</li>
                ) : null}
              </ul>
            </details>
          ) : null}

          {parseResult.skippedDuplicates.length > 0 ? (
            <details className="rounded-lg border border-border/70 bg-muted/30 px-4 py-3 text-sm">
              <summary className="cursor-pointer font-medium">
                {parseResult.skippedDuplicates.length} duplicate
                {parseResult.skippedDuplicates.length === 1 ? "" : "s"} skipped
              </summary>
              <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                {parseResult.skippedDuplicates.slice(0, 10).map((issue) => (
                  <li key={`${issue.lineNumber}-${issue.raw}`}>
                    <span className="font-mono text-foreground">Line {issue.lineNumber}:</span>{" "}
                    {issue.message}
                  </li>
                ))}
                {parseResult.skippedDuplicates.length > 10 ? (
                  <li>… and {parseResult.skippedDuplicates.length - 10} more.</li>
                ) : null}
              </ul>
            </details>
          ) : null}

          {parseResult.rows.length > 0 ? (
            <div className="rounded-lg border border-border/70">
              <div className="border-b border-border/70 bg-muted/30 px-4 py-2 text-xs font-medium text-muted-foreground uppercase">
                Preview
              </div>
              <ul className="max-h-64 divide-y divide-border/50 overflow-y-auto text-sm">
                {parseResult.rows.slice(0, 50).map((row, index) => (
                  <li
                    key={`${row.name}-${index}`}
                    className="flex items-center justify-between gap-3 px-4 py-2"
                  >
                    <span className="truncate font-medium">{row.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {GENDER_LABELS[row.gender]}
                      {row.notes ? ` · ${row.notes}` : ""}
                    </span>
                  </li>
                ))}
                {parseResult.rows.length > 50 ? (
                  <li className="px-4 py-2 text-xs text-muted-foreground">
                    … and {parseResult.rows.length - 50} more.
                  </li>
                ) : null}
              </ul>
            </div>
          ) : null}

          {submitError ? (
            <p className="text-sm text-destructive" role="alert">
              {submitError}
            </p>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border/60 px-6 py-4">
          <p className="text-xs text-muted-foreground">
            {parseResult.rows.length} ready to import.
          </p>
          <Button
            type="button"
            onClick={() => void handleImport()}
            disabled={!canSubmit}
            pending={isSubmitting}
            pendingLabel="Importing…"
            className="min-h-11 min-w-[10rem]"
          >
            Import players
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function BulkImportPreview({
  valid,
  duplicates,
  errors,
}: {
  valid: number;
  duplicates: number;
  errors: number;
}) {
  return (
    <div className="grid grid-cols-3 gap-2 text-center">
      <BulkImportStat label="Ready" value={valid} tone="positive" />
      <BulkImportStat label="Duplicates" value={duplicates} tone="muted" />
      <BulkImportStat label="Errors" value={errors} tone={errors > 0 ? "destructive" : "muted"} />
    </div>
  );
}

function BulkImportStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "positive" | "muted" | "destructive";
}) {
  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2",
        tone === "positive" && "border-brand/40 bg-brand-soft/40",
        tone === "muted" && "border-border/70 bg-muted/30",
        tone === "destructive" && "border-destructive/40 bg-destructive/5",
      )}
    >
      <div className="text-lg font-semibold tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground uppercase">{label}</div>
    </div>
  );
}
