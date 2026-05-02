import { notFound, redirect } from "next/navigation";

import { LeaderboardTable } from "@/features/tournament-run/leaderboard-table";
import { getSessionUser } from "@/lib/auth/session";
import { getTournamentRunSummary } from "@/services/tournament-run-service";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function LeaderboardPage({ params }: PageProps) {
  const { slug } = await params;
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=/tournament/${slug}/leaderboard`);

  const summary = await getTournamentRunSummary(slug);
  if (!summary) notFound();

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Leaderboard</h2>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Standings update from completed fixture results. Use this page for rankings, score differential, and elimination state without mixing it into the live score-entry workflow.
        </p>
      </header>

      <LeaderboardTable
        format={summary.tournament.format}
        standings={summary.standings}
      />
    </div>
  );
}
