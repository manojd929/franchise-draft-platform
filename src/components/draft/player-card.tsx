"use client";

import { motion } from "framer-motion";
import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { DraftPlayerDto, DraftTeamDto } from "@/types/draft";
import { GENDER_LABEL, PLAYER_CATEGORY_LABEL } from "@/constants/player-labels";

interface PlayerCardProps {
  player: DraftPlayerDto;
  team?: DraftTeamDto | null;
  emphasize: boolean;
  onNominate?: () => void;
  nominateDisabled?: boolean;
}

export function PlayerCard({
  player,
  team,
  emphasize,
  onNominate,
  nominateDisabled,
}: PlayerCardProps) {
  const picked = Boolean(player.hasConfirmedPick && player.assignedTeamId);
  const pending =
    !player.hasConfirmedPick &&
    Boolean(player.assignedTeamId);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="h-full"
    >
      <Card
        data-state={picked ? "picked" : pending ? "pending" : "available"}
        className={cn(
          "relative flex h-full flex-col overflow-hidden border bg-card/80 p-2 shadow-sm backdrop-blur-sm transition-all duration-300 sm:p-3",
          picked &&
            "pointer-events-none scale-[0.98] opacity-60 grayscale border-muted",
          pending &&
            "border-amber-400/70 ring-2 ring-amber-400/40 shadow-[0_0_40px_-12px_rgba(251,191,36,0.55)]",
          !picked &&
            !pending &&
            emphasize &&
            "cursor-pointer border-primary/40 shadow-[0_0_28px_-10px_rgba(56,189,248,0.55)] hover:border-primary hover:shadow-[0_0_34px_-8px_rgba(56,189,248,0.65)]",
        )}
      >
        {(picked || pending) && (
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/85 via-background/20 to-transparent"
            aria-hidden
          />
        )}
        <div className="relative flex flex-1 flex-col gap-2">
          <div className="flex gap-3">
            <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-muted ring-1 ring-border sm:size-16">
              {player.photoUrl ? (
                <Image
                  src={player.photoUrl}
                  alt=""
                  fill
                  sizes="(max-width:640px) 56px, 64px"
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center text-lg font-semibold text-muted-foreground"
                  aria-hidden
                >
                  {player.name.slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <p className="truncate font-semibold tracking-tight">{player.name}</p>
              <div className="flex flex-wrap gap-1">
                <Badge variant="secondary" className="text-[10px] uppercase">
                  {PLAYER_CATEGORY_LABEL[player.category]}
                </Badge>
                <Badge variant="outline" className="text-[10px] uppercase">
                  {GENDER_LABEL[player.gender]}
                </Badge>
                {player.isUnavailable && (
                  <Badge variant="destructive" className="text-[10px]">
                    Not here
                  </Badge>
                )}
                {player.isLocked && (
                  <Badge variant="outline" className="text-[10px]">
                    Locked
                  </Badge>
                )}
              </div>
            </div>
          </div>
          {player.notes ? (
            <p className="line-clamp-2 text-xs text-muted-foreground">{player.notes}</p>
          ) : null}
          {picked && team ? (
            <div className="mt-auto flex items-center justify-between gap-2 rounded-lg bg-muted/60 px-2 py-2">
              <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Taken
              </span>
              <span className="truncate text-sm font-semibold">{team.name}</span>
            </div>
          ) : null}
          {pending && team ? (
            <div className="mt-auto rounded-lg border border-amber-400/40 bg-amber-500/10 px-2 py-2 text-xs font-medium text-amber-950 dark:text-amber-100">
              Waiting for admin · {team.shortName ?? team.name}
            </div>
          ) : null}
          {onNominate && !picked ? (
            <button
              type="button"
              disabled={nominateDisabled}
              onClick={onNominate}
              className={cn(
                "mt-auto min-h-11 rounded-lg bg-primary px-3 py-2.5 text-center text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40 sm:text-xs",
              )}
            >
              Pick this player
            </button>
          ) : null}
        </div>
      </Card>
    </motion.div>
  );
}
