"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { DraftRoomClient } from "@/components/draft/draft-room-client";
import { RandomDraftOrderShuffle } from "@/components/draft/random-draft-order-shuffle";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  confirmPickAction,
  endDraftAction,
  freezeDraftAction,
  forceSyncAction,
  lockDraftAction,
  nextTurnAction,
  pauseDraftAction,
  previousTurnAction,
  resumeDraftAction,
  skipTurnAction,
  startDraftAction,
  toggleOverrideValidationAction,
  undoPickAction,
  unlockDraftAction,
} from "@/features/draft/actions";
import { DraftPhase } from "@/generated/prisma/enums";
import { useDraftLiveSync } from "@/hooks/use-draft-live-sync";
import type { DraftSnapshotDto } from "@/types/draft";

interface AdminControlRoomClientProps {
  slug: string;
  initialSnapshot: DraftSnapshotDto;
  viewerUserId: string | null;
}

export function AdminControlRoomClient({
  slug,
  initialSnapshot,
  viewerUserId,
}: AdminControlRoomClientProps) {
  const [liveSnapshot, setLiveSnapshot] = useState(initialSnapshot);
  const [overrideWarnOpen, setOverrideWarnOpen] = useState(false);
  useDraftLiveSync(slug, liveSnapshot.tournamentId, setLiveSnapshot);

  const slugRef = useRef(slug);
  const snapshotRef = useRef(liveSnapshot);

  useEffect(() => {
    slugRef.current = slug;
  }, [slug]);

  useEffect(() => {
    snapshotRef.current = liveSnapshot;
  }, [liveSnapshot]);

  const fire = useCallback(
    async (label: string, fn: () => Promise<{ ok: boolean; error?: string }>) => {
      const result = await fn();
      if (!result.ok) {
        toast.error(result.error ?? `${label} failed`);
        return;
      }
      toast.success(label);
    },
    [],
  );

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      const currentSlug = slugRef.current;
      const phase = snapshotRef.current.draftPhase;

      if (event.code === "Space") {
        event.preventDefault();
        void fire(
          phase === DraftPhase.LIVE ? "Paused" : "Live again",
          () =>
            phase === DraftPhase.LIVE
              ? pauseDraftAction({ tournamentSlug: currentSlug })
              : resumeDraftAction({ tournamentSlug: currentSlug }),
        );
      }
      if (event.key === "Enter") {
        event.preventDefault();
        void fire("Pick saved", () =>
          confirmPickAction({ tournamentSlug: currentSlug }),
        );
      }
      if (event.key === "Backspace") {
        event.preventDefault();
        void fire("Pick removed", () =>
          undoPickAction({ tournamentSlug: currentSlug }),
        );
      }
      if (event.key.toLowerCase() === "n") {
        event.preventDefault();
        void fire("Next team", () =>
          nextTurnAction({ tournamentSlug: currentSlug }),
        );
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [fire]);

  const shortcuts = useMemo(
    () => [
      { keys: "Space", label: "Pause or go live" },
      { keys: "Enter", label: "Save the pick" },
      { keys: "Backspace", label: "Undo last pick" },
      { keys: "N", label: "Next team" },
    ],
    [],
  );

  const confirmEnableRulesOverride = useCallback(async () => {
    const result = await toggleOverrideValidationAction({
      tournamentSlug: slug,
      enabled: true,
    });
    if (!result.ok) {
      toast.error(result.error ?? "Could not turn on rules override.");
      return;
    }
    toast.success("Rules override on");
    setOverrideWarnOpen(false);
  }, [slug]);

  const s = slug;

  return (
    <>
      <AlertDialog open={overrideWarnOpen} onOpenChange={setOverrideWarnOpen}>
        <AlertDialogContent className="sm:max-w-md" size="default">
          <AlertDialogHeader>
            <AlertDialogTitle>Turn on rules override?</AlertDialogTitle>
            <AlertDialogDescription className="text-left">
              <span className="mb-3 block">
                Only use this for exceptions (wrong clock, bad quota setting, league allowance).
                Normal picks should leave rules on.
              </span>
              <span className="block font-medium text-foreground">What changes</span>
              <span className="mt-2 block text-muted-foreground">
                Squad category limits will not block nominations or confirmations. You may confirm a
                pending pick even when it does not match the team on the clock. Usual checks still
                apply: the player exists in this tournament, is available, and is not already drafted.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
            <AlertDialogAction
              type="button"
              variant="destructive"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => void confirmEnableRulesOverride()}
            >
              Turn on override
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex flex-col gap-4 lg:gap-6 xl:flex-row">
      <div className="space-y-3 xl:w-[min(100%,380px)] xl:shrink-0">
        <div className="rounded-xl border border-border/80 bg-gradient-to-b from-card/80 to-card/40 p-3 backdrop-blur-md sm:p-4">
          <h1 className="text-lg font-semibold tracking-tight sm:text-xl">
            Auction tools
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Start here. When an owner says a name, find them on the board and tap{" "}
            <strong className="font-semibold text-foreground">Confirm pick</strong>.
          </p>
          <Separator className="my-4" />
          <p className="mb-2 text-xs font-medium text-muted-foreground">Start and pause</p>
          <div className="grid grid-cols-2 gap-2">
            <RandomDraftOrderShuffle
              tournamentSlug={s}
              teams={liveSnapshot.teams.map((t) => ({ id: t.id, name: t.name }))}
              className="min-h-11 w-full"
            />
            <Button
              type="button"
              className="min-h-11 text-sm sm:text-xs sm:uppercase sm:tracking-wide"
              onClick={() =>
                void fire("Auction live", () => startDraftAction({ tournamentSlug: s }))
              }
            >
              Start auction
            </Button>
            <Button
              type="button"
              variant="outline"
              className="min-h-11 text-sm sm:text-xs sm:uppercase sm:tracking-wide"
              onClick={() =>
                void fire("Paused", () => pauseDraftAction({ tournamentSlug: s }))
              }
            >
              Pause
            </Button>
            <Button
              type="button"
              variant="outline"
              className="min-h-11 text-sm sm:text-xs sm:uppercase sm:tracking-wide"
              onClick={() =>
                void fire("Live again", () => resumeDraftAction({ tournamentSlug: s }))
              }
            >
              Go live
            </Button>
            <Button
              type="button"
              variant="outline"
              className="min-h-11 text-sm sm:text-xs sm:uppercase sm:tracking-wide"
              onClick={() =>
                void fire("Board frozen", () => freezeDraftAction({ tournamentSlug: s }))
              }
            >
              Freeze board
            </Button>
            <Button
              type="button"
              variant="outline"
              className="min-h-11 text-sm sm:text-xs sm:uppercase sm:tracking-wide"
              onClick={() =>
                void fire("Board open", () => unlockDraftAction({ tournamentSlug: s }))
              }
            >
              Open board
            </Button>
            <Button
              type="button"
              variant="outline"
              className="min-h-11 text-sm sm:text-xs sm:uppercase sm:tracking-wide"
              onClick={() =>
                void fire("Board locked", () => lockDraftAction({ tournamentSlug: s }))
              }
            >
              Lock board
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="min-h-11 text-sm sm:text-xs sm:uppercase sm:tracking-wide"
              onClick={() =>
                void fire("Auction finished", () => endDraftAction({ tournamentSlug: s }))
              }
            >
              End auction
            </Button>
          </div>
          <Separator className="my-4" />
          <p className="mb-2 text-xs font-medium text-muted-foreground">Whose turn</p>
          <div className="grid grid-cols-3 gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="min-h-9 text-xs"
              onClick={() =>
                void fire("Previous team", () =>
                  previousTurnAction({ tournamentSlug: s }),
                )
              }
            >
              Back
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="min-h-9 text-xs"
              onClick={() =>
                void fire("Skip team", () => skipTurnAction({ tournamentSlug: s }))
              }
            >
              Skip
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="min-h-9 text-xs"
              onClick={() =>
                void fire("Next team", () => nextTurnAction({ tournamentSlug: s }))
              }
            >
              Next
            </Button>
          </div>
          <Separator className="my-4" />
          <p className="mb-2 text-xs font-medium text-muted-foreground">Pick</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button
              type="button"
              className="min-h-11 text-sm sm:text-xs sm:uppercase sm:tracking-wide"
              onClick={() =>
                void fire("Pick saved", () => confirmPickAction({ tournamentSlug: s }))
              }
            >
              Confirm pick
            </Button>
            <Button
              type="button"
              variant="outline"
              className="min-h-11 text-sm sm:text-xs sm:uppercase sm:tracking-wide"
              onClick={() =>
                void fire("Pick removed", () => undoPickAction({ tournamentSlug: s }))
              }
            >
              Undo pick
            </Button>
          </div>
          <Separator className="my-4" />
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="ghost"
              className="min-h-10 text-xs"
              onClick={() =>
                void fire("Screens refreshed", () =>
                  forceSyncAction({ tournamentSlug: s }),
                )
              }
            >
              Refresh screens
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="min-h-10 text-xs"
              onClick={() => {
                if (liveSnapshot.overrideValidation) {
                  void fire("Rules restored", () =>
                    toggleOverrideValidationAction({
                      tournamentSlug: s,
                      enabled: false,
                    }),
                  );
                  return;
                }
                setOverrideWarnOpen(true);
              }}
            >
              {liveSnapshot.overrideValidation ? "Restore rule checks" : "Skip rule check"}
            </Button>
          </div>
        </div>

        <details className="rounded-xl border border-dashed border-primary/40 bg-primary/5 p-3 sm:p-4">
          <summary className="cursor-pointer text-sm font-medium text-primary">
            Keyboard shortcuts (optional)
          </summary>
          <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
            {shortcuts.map((item) => (
              <li key={item.keys} className="flex items-center justify-between gap-3">
                <span>{item.label}</span>
                <kbd className="rounded border border-border bg-muted px-2 py-0.5 font-mono text-[10px] text-foreground">
                  {item.keys}
                </kbd>
              </li>
            ))}
          </ul>
        </details>
      </div>

      <div className="min-h-[50vh] min-w-0 flex-1 rounded-xl border border-border/80 bg-background/40 p-2 backdrop-blur-md sm:min-h-[60vh] sm:p-4 xl:min-h-[min(85vh,900px)]">
        <DraftRoomClient
          slug={slug}
          initialSnapshot={initialSnapshot}
          controlledSnapshot={liveSnapshot}
          syncEnabled={false}
          viewerUserId={viewerUserId}
          enableOwnerPick={false}
        />
      </div>
    </div>
    </>
  );
}
