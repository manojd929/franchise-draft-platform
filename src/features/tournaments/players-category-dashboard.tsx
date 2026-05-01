import type { PlayerCategory } from "@/generated/prisma/enums";
import { PLAYER_CATEGORY_LABEL } from "@/constants/player-labels";
import { SQUAD_RULE_CATEGORY_ORDER } from "@/lib/squad-rules/compute-per-team-caps";

interface PlayersCategoryDashboardProps {
  categoryCounts: Record<PlayerCategory, number>;
  totalPlayers: number;
}

export function PlayersCategoryDashboard({
  categoryCounts,
  totalPlayers,
}: PlayersCategoryDashboardProps) {
  return (
    <section className="space-y-3" aria-labelledby="players-category-dashboard-title">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h3
          id="players-category-dashboard-title"
          className="text-sm font-semibold tracking-tight text-foreground sm:text-base"
        >
          Roster by group
        </h3>
        <p className="text-xs text-muted-foreground sm:text-sm">
          Total{" "}
          <span className="font-medium tabular-nums text-foreground">{totalPlayers}</span>{" "}
          {totalPlayers === 1 ? "player" : "players"}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {SQUAD_RULE_CATEGORY_ORDER.map((category) => {
          const count = categoryCounts[category] ?? 0;
          return (
            <div
              key={category}
              className="rounded-xl border border-border/70 bg-card/40 p-4 backdrop-blur-md sm:p-5"
            >
              <p className="text-xs font-medium leading-snug text-muted-foreground sm:text-sm">
                {PLAYER_CATEGORY_LABEL[category]}
              </p>
              <p
                className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-foreground sm:text-3xl"
                aria-label={`${PLAYER_CATEGORY_LABEL[category]}: ${count}`}
              >
                {count}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
