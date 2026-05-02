import { RosterCategoryPill } from "@/features/roster/roster-category-pill";

export interface PlayersCategoryDashboardRow {
  rosterCategoryId: string;
  name: string;
  colorHex: string | null;
  count: number;
}

interface PlayersCategoryDashboardProps {
  rows: PlayersCategoryDashboardRow[];
  totalPlayers: number;
}

export function PlayersCategoryDashboard({
  rows,
  totalPlayers,
}: PlayersCategoryDashboardProps) {
  const activeRows = rows.filter((row) => row.count > 0);

  return (
    <section
      className="rounded-xl border border-border/70 bg-card/35 p-4 backdrop-blur-md sm:p-5"
      aria-labelledby="players-category-dash-heading"
    >
      <h3
        id="players-category-dash-heading"
        className="text-sm font-semibold tracking-tight text-foreground sm:text-base"
      >
        Roster mix
      </h3>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">
        <span className="font-semibold tabular-nums text-foreground">{totalPlayers}</span>{" "}
        {totalPlayers === 1 ? "player" : "players"} across roster groups ({activeRows.length} group
        {activeRows.length === 1 ? "" : "s"} occupied).
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Configure roster groups first, then add players.
          </p>
        ) : (
          rows.map((row) => (
            <div
              key={row.rosterCategoryId}
              className="inline-flex flex-col gap-1 rounded-lg border border-border/60 bg-background/40 px-3 py-2"
            >
              <RosterCategoryPill name={row.name} colorHex={row.colorHex} />
              <span className="text-xs tabular-nums text-muted-foreground">
                <span className="font-semibold text-foreground">{row.count}</span>{" "}
                {row.count === 1 ? "player" : "players"}
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
