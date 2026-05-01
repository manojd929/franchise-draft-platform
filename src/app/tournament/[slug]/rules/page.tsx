import { redirect } from "next/navigation";

import {
  PickLimitsGuidance,
  type PickLimitsCategoryFitRow,
} from "@/features/tournaments/pick-limits-guidance";
import { SquadRulesAutoFillButton } from "@/features/tournaments/squad-rules-auto-fill-button";
import { SquadRulesForm } from "@/features/tournaments/squad-rules-form";
import type { PlayerCategory } from "@/generated/prisma/enums";
import { getSessionUser } from "@/lib/auth/session";
import { requireTournamentAccess } from "@/lib/data/tournament-access";
import {
  SQUAD_RULE_CATEGORY_ORDER,
} from "@/lib/squad-rules/compute-per-team-caps";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function RulesPage({ params }: PageProps) {
  const { slug } = await params;
  const user = await getSessionUser();
  if (!user) {
    redirect(`/login?next=/tournament/${slug}/rules`);
  }

  const tournament = await requireTournamentAccess(slug, user.id);

  const [squadRules, teamCount, groupedPlayers] = await Promise.all([
    prisma.squadRule.findMany({
      where: { tournamentId: tournament.id },
    }),
    prisma.team.count({
      where: { tournamentId: tournament.id, deletedAt: null },
    }),
    prisma.player.groupBy({
      by: ["category"],
      where: { tournamentId: tournament.id, deletedAt: null },
      _count: { _all: true },
    }),
  ]);

  const playersPerCategory: Partial<Record<PlayerCategory, number>> = {};
  for (const category of SQUAD_RULE_CATEGORY_ORDER) {
    playersPerCategory[category] = 0;
  }
  for (const row of groupedPlayers) {
    playersPerCategory[row.category] = row._count._all;
  }

  const categoryRows: PickLimitsCategoryFitRow[] = SQUAD_RULE_CATEGORY_ORDER.map(
    (category) => {
      const pool = playersPerCategory[category] ?? 0;
      const fairCapPerTeam =
        teamCount > 0 ? Math.floor(pool / teamCount) : 0;
      const remainderAfterEvenSplit = pool - teamCount * fairCapPerTeam;
      return {
        category,
        pool,
        fairCapPerTeam,
        remainderAfterEvenSplit,
      };
    },
  );

  const totalPlayers = SQUAD_RULE_CATEGORY_ORDER.reduce(
    (sum, category) => sum + (playersPerCategory[category] ?? 0),
    0,
  );

  return (
    <div className="space-y-6 sm:space-y-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl lg:text-3xl">Pick limits</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Cap how many picks each franchise may spend on each player group. If a group does not
            divide evenly across teams, an{" "}
            <strong className="font-semibold text-foreground">amber notice under that group</strong>{" "}
            lists how many players need recategorizing or how many to add. Use{" "}
            <strong className="font-semibold text-foreground">Auto-set limits from roster</strong>{" "}
            for floor(pool÷teams) defaults — longer explanations follow under the form.
          </p>
        </div>
        <SquadRulesAutoFillButton tournamentSlug={slug} />
      </header>

      <SquadRulesForm
        tournamentSlug={slug}
        rosterSummary={{
          teamCount,
          playersPerCategory,
          categoryFitRows: categoryRows,
        }}
        initialRules={squadRules.map((rule) => ({
          category: rule.category,
          maxCount: rule.maxCount,
        }))}
      />

      <PickLimitsGuidance
        teamCount={teamCount}
        picksPerTeam={tournament.picksPerTeam}
        totalPlayers={totalPlayers}
      />
    </div>
  );
}
