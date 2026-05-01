"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { DraftPhase } from "@/generated/prisma/enums";
import { useDraftLiveSync } from "@/hooks/use-draft-live-sync";
import type { DraftSnapshotDto } from "@/types/draft";
import { DRAFT_PHASE_LABEL } from "@/constants/draft-phase-labels";
import { PLAYER_CATEGORY_LABEL } from "@/constants/player-labels";

interface TvDisplayClientProps {
  slug: string;
  initialSnapshot: DraftSnapshotDto;
}

export function TvDisplayClient({ slug, initialSnapshot }: TvDisplayClientProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  useDraftLiveSync(slug, snapshot.tournamentId, setSnapshot, 2500);

  const teamsById = useMemo(() => {
    const map: Record<string, (typeof snapshot.teams)[0]> = {};
    snapshot.teams.forEach((t) => {
      map[t.id] = t;
    });
    return map;
  }, [snapshot]);

  const currentTurnTeamId = useMemo(() => {
    const slot = snapshot.draftSlots.find(
      (s) => s.slotIndex === snapshot.currentSlotIndex,
    );
    return slot?.teamId ?? null;
  }, [snapshot.currentSlotIndex, snapshot.draftSlots]);

  const activeTeam = currentTurnTeamId ? teamsById[currentTurnTeamId] : null;

  const live = snapshot.draftPhase === DraftPhase.LIVE;

  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-x-hidden bg-[radial-gradient(ellipse_at_top,_rgba(56,189,248,0.22),_transparent_55%),radial-gradient(ellipse_at_bottom,_rgba(168,85,247,0.18),_transparent_45%),#020617] px-4 py-6 text-white sm:px-6 sm:py-10">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:48px_48px] opacity-40" />

      <header className="relative z-10 mb-6 flex flex-col gap-4 border-b border-white/10 pb-6 sm:mb-10 sm:gap-6 sm:pb-8 md:flex-row md:flex-wrap md:items-start md:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-widest text-sky-200/90 sm:text-xs sm:tracking-[0.2em]">
            TV screen
          </p>
          <h1 className="mt-3 max-w-4xl text-balance text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
            {snapshot.name}
          </h1>
        </div>
        <div className="flex flex-row items-center justify-between gap-3 sm:flex-col sm:items-end">
          <Badge className="border-white/20 bg-white/10 px-3 py-1.5 text-xs font-normal sm:px-4 sm:text-sm">
            {DRAFT_PHASE_LABEL[snapshot.draftPhase]}
          </Badge>
          <p className="text-xs text-white/80 sm:text-sm">
            Turn{" "}
            <span className="font-semibold text-white">
              {Math.min(
                snapshot.currentSlotIndex + 1,
                Math.max(snapshot.draftSlotsTotal, 1),
              )}
            </span>
            {" / "}
            {snapshot.draftSlotsTotal || "—"}
          </p>
        </div>
      </header>

      <main className="relative z-10 grid flex-1 gap-4 sm:gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="flex min-h-0 flex-col justify-center rounded-2xl border border-white/15 bg-black/45 p-6 shadow-[0_0_120px_-40px_rgba(56,189,248,0.85)] backdrop-blur-xl sm:rounded-3xl sm:p-10">
          <p className="text-xs font-medium tracking-wide text-white/65">
            Picks now
          </p>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTeam?.id ?? "idle"}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.45 }}
              className="mt-6"
            >
              <p
                className={`break-words text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl ${live ? "text-white" : "text-white/40"}`}
              >
                {activeTeam?.name ?? "Waiting to start"}
              </p>
              {activeTeam?.shortName ? (
                <p className="mt-4 text-xl font-medium text-sky-200 sm:text-2xl md:text-3xl">
                  {activeTeam.shortName}
                </p>
              ) : null}
            </motion.div>
          </AnimatePresence>
        </section>

        <section className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-black/35 p-5 backdrop-blur-xl sm:gap-6 sm:rounded-3xl sm:p-8">
          <p className="text-xs font-medium tracking-wide text-white/60">
            Last pick
          </p>
          <AnimatePresence mode="wait">
            <motion.div
              key={snapshot.lastConfirmedPick?.playerName ?? "none"}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.4 }}
              className="flex flex-1 flex-col justify-center rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-6"
            >
              {snapshot.lastConfirmedPick ? (
                <>
                  <p className="text-xs font-medium uppercase tracking-wide text-emerald-100/90 sm:text-sm">
                    Joins team
                  </p>
                  <p className="mt-3 break-words text-3xl font-semibold sm:mt-4 sm:text-4xl md:text-5xl">
                    {snapshot.lastConfirmedPick.playerName}
                  </p>
                  <p className="mt-2 text-base text-emerald-50/95 sm:mt-3 sm:text-lg">
                    {PLAYER_CATEGORY_LABEL[snapshot.lastConfirmedPick.category]}
                  </p>
                  <p className="mt-4 text-lg font-medium text-white sm:mt-6 sm:text-2xl">
                    {snapshot.lastConfirmedPick.teamName}
                  </p>
                </>
              ) : (
                <p className="text-lg text-white/60 sm:text-xl">No picks yet.</p>
              )}
            </motion.div>
          </AnimatePresence>
        </section>
      </main>

      <footer className="relative z-10 mt-6 border-t border-white/10 pt-4 text-center text-[10px] text-white/50 sm:mt-10 sm:pt-6 sm:text-xs">
        Press F11 on the TV computer for full screen.
      </footer>
    </div>
  );
}
