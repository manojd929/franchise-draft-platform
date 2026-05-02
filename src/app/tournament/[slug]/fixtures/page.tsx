import { notFound, redirect } from "next/navigation";

import { getSessionUser } from "@/lib/auth/session";
import { getFixturesSummary } from "@/services/fixtures-service";
import { generateRoundRobinTiesAction } from "@/features/fixtures/actions";
import { TournamentFormat } from "@/generated/prisma/enums";
import { getTournamentRunSummary } from "@/services/tournament-run-service";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function FixturesPage({ params }: PageProps) {
  const { slug } = await params;
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=/tournament/${slug}/fixtures`);

  const summary = await getFixturesSummary(slug);
  if (!summary) notFound();
  const { tournament, ties, matches, fixturesReady } = summary;
  const runSummary = await getTournamentRunSummary(slug);

  const fixturesVisible = tournament.draftPhase === "COMPLETED";
  if (!fixturesVisible) {
    return <p className="text-sm text-muted-foreground">Fixtures unlock after draft completion.</p>;
  }
  if (!fixturesReady) {
    return (
      <p className="text-sm text-muted-foreground">
        Fixtures are not initialized in this environment yet. Run <code>npm run db:migrate</code> and restart dev server.
      </p>
    );
  }

  const isAdmin = tournament.createdById === user.id;

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Fixtures</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Doubles-only fixture board. Owners can view progress; only admin can generate pairings.
        </p>
      </header>

      {isAdmin ? (
        <div className="grid gap-4 md:grid-cols-1">
          <form
            action={async (formData) => {
              "use server";
              await generateRoundRobinTiesAction({
                tournamentSlug: slug,
                matchesPerTie: Number(formData.get("matchesPerTie") ?? 5),
              });
            }}
            className="space-y-2 rounded-md border p-4"
          >
            <h3 className="font-medium">Generate Team Round Robin</h3>
            <p className="text-sm text-muted-foreground">
              Regenerates all doubles ties for this tournament and replaces existing fixture rows.
            </p>
            <input name="matchesPerTie" type="number" defaultValue={5} min={1} max={15} className="h-10 w-full rounded border px-3" />
            <button type="submit" className="rounded bg-primary px-3 py-2 text-primary-foreground">Generate ties</button>
          </form>
        </div>
      ) : null}

      <section className="space-y-2">
        <h3 className="font-medium">Ties ({ties.length})</h3>
        <ul className="space-y-2">
          {ties.map((tie) => (
            <li key={tie.id} className="rounded border p-3 text-sm">
              {tie.teamOne.name} vs {tie.teamTwo.name} · Matches: {tie.matches.length}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h3 className="font-medium">Matches ({matches.length})</h3>
        {ties.length === 0 ? (
          <p className="text-sm text-muted-foreground">No ties generated yet.</p>
        ) : (
          <ul className="space-y-3">
            {ties.map((tie) => {
              const tieMatches = matches.filter((match) => match.tieId === tie.id);
              return (
                <li key={tie.id} className="rounded-md border p-3">
                  <p className="text-sm font-medium">
                    {tie.teamOne.name} vs {tie.teamTwo.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Round {tie.roundNumber} · {tieMatches.length} doubles matches
                  </p>
                  <ul className="mt-2 space-y-2">
                    {tieMatches.map((match, index) => (
                      <li key={match.id} className="rounded border border-border/70 px-3 py-2 text-sm">
                        Match {index + 1} · {match.status}
                        {match.participants.length > 0 ? (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Side 1: {match.participants.filter((p) => p.side === "SIDE_ONE").map((p) => p.player.name).join(" + ") || "TBD"}
                            {"  "}vs{"  "}
                            Side 2: {match.participants.filter((p) => p.side === "SIDE_TWO").map((p) => p.player.name).join(" + ") || "TBD"}
                          </p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {runSummary ? (
        <section className="space-y-3">
          <h3 className="font-medium">Leaderboard</h3>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="px-3 py-2">Rank</th>
                  <th className="px-3 py-2">{runSummary.tournament.format === TournamentFormat.DOUBLES_ONLY ? "Team" : "Player"}</th>
                  <th className="px-3 py-2">Pts</th>
                  <th className="px-3 py-2">W</th>
                  <th className="px-3 py-2">L</th>
                  <th className="px-3 py-2">Scored</th>
                  <th className="px-3 py-2">Conceded</th>
                  <th className="px-3 py-2">Diff</th>
                </tr>
              </thead>
              <tbody>
                {runSummary.standings.map((row, index) => (
                  <tr key={row.entityId} className="border-t">
                    <td className="px-3 py-2">{index + 1}</td>
                    <td className="px-3 py-2">{row.name}{row.eliminated ? " (Eliminated)" : ""}</td>
                    <td className="px-3 py-2">{row.points}</td>
                    <td className="px-3 py-2">{row.wins}</td>
                    <td className="px-3 py-2">{row.losses}</td>
                    <td className="px-3 py-2">{row.pointsScored}</td>
                    <td className="px-3 py-2">{row.pointsConceded}</td>
                    <td className="px-3 py-2">{row.pointDifference}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
