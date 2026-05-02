import { notFound, redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  togglePlayerEliminationAction,
  toggleTeamEliminationAction,
  updateMatchStateAction,
} from "@/features/tournament-run/actions";
import { TournamentFormat } from "@/generated/prisma/enums";
import { getSessionUser } from "@/lib/auth/session";
import { getTournamentRunSummary } from "@/services/tournament-run-service";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function RunTournamentPage({ params }: PageProps) {
  const { slug } = await params;
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=/tournament/${slug}/run`);

  const summary = await getTournamentRunSummary(slug);
  if (!summary) notFound();

  const isAdmin = summary.tournament.createdById === user.id;
  if (!isAdmin) {
    return <p className="text-sm text-muted-foreground">Only tournament admin can manage live match operations.</p>;
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Run Tournament</h2>
        <p className="text-sm text-muted-foreground">
          Update match status, scores, winner, and eliminations. Standings update automatically from completed matches.
        </p>
      </header>

      <section className="space-y-3">
        <h3 className="font-medium">Live Standings</h3>
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-3 py-2">Rank</th>
                <th className="px-3 py-2">{summary.tournament.format === TournamentFormat.DOUBLES_ONLY ? "Team" : "Player"}</th>
                <th className="px-3 py-2">MP</th><th className="px-3 py-2">W</th><th className="px-3 py-2">L</th>
                <th className="px-3 py-2">Pts</th><th className="px-3 py-2">Scored</th><th className="px-3 py-2">Conceded</th><th className="px-3 py-2">Diff</th><th className="px-3 py-2">State</th>
              </tr>
            </thead>
            <tbody>
              {summary.standings.map((row, index) => (
                <tr key={row.entityId} className="border-t">
                  <td className="px-3 py-2">{index + 1}</td>
                  <td className="px-3 py-2 font-medium">{row.name}</td>
                  <td className="px-3 py-2">{row.matchesPlayed}</td>
                  <td className="px-3 py-2">{row.wins}</td>
                  <td className="px-3 py-2">{row.losses}</td>
                  <td className="px-3 py-2">{row.points}</td>
                  <td className="px-3 py-2">{row.pointsScored}</td>
                  <td className="px-3 py-2">{row.pointsConceded}</td>
                  <td className="px-3 py-2">{row.pointDifference}</td>
                  <td className="px-3 py-2">{row.eliminated ? <Badge variant="destructive">Eliminated</Badge> : <Badge variant="secondary">Active</Badge>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="font-medium">Elimination Controls</h3>
        <div className="grid gap-2 md:grid-cols-2">
          {summary.standings.map((row) => (
            <form
              key={row.entityId}
              action={async () => {
                "use server";
                if (summary.tournament.format === TournamentFormat.DOUBLES_ONLY) {
                  await toggleTeamEliminationAction({
                    tournamentSlug: slug,
                    entityId: row.entityId,
                    eliminated: !row.eliminated,
                  });
                } else {
                  await togglePlayerEliminationAction({
                    tournamentSlug: slug,
                    entityId: row.entityId,
                    eliminated: !row.eliminated,
                  });
                }
              }}
              className="flex items-center justify-between rounded border px-3 py-2"
            >
              <span className="text-sm">{row.name}</span>
              <Button type="submit" variant={row.eliminated ? "outline" : "destructive"} size="sm">
                {row.eliminated ? "Reinstate" : "Eliminate"}
              </Button>
            </form>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="font-medium">All Matches</h3>
        <ul className="space-y-3">
          {summary.matches.map((match) => (
            <li key={match.id} className="rounded-md border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium">{match.matchType} · {match.status}</p>
                <p className="text-xs text-muted-foreground">Winner: {match.winnerSide ?? "TBD"}</p>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Side 1: {match.participants.filter((p) => p.side === "SIDE_ONE").map((p) => p.player.name).join(" + ") || "TBD"}
                {"  "}vs{"  "}
                Side 2: {match.participants.filter((p) => p.side === "SIDE_TWO").map((p) => p.player.name).join(" + ") || "TBD"}
              </p>
              <form
                action={async (formData) => {
                  "use server";
                  const status = String(formData.get("status") ?? "SCHEDULED");
                  const sideOneScoreRaw = String(formData.get("sideOneScore") ?? "").trim();
                  const sideTwoScoreRaw = String(formData.get("sideTwoScore") ?? "").trim();
                  await updateMatchStateAction({
                    tournamentSlug: slug,
                    matchId: match.id,
                    status,
                    sideOneScore: sideOneScoreRaw === "" ? null : Number(sideOneScoreRaw),
                    sideTwoScore: sideTwoScoreRaw === "" ? null : Number(sideTwoScoreRaw),
                  });
                }}
                className="mt-3 grid gap-2 md:grid-cols-5"
              >
                <select name="status" defaultValue={match.status} className="h-10 rounded border px-2 text-sm">
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="IN_PROGRESS">In progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
                <Input name="sideOneScore" type="number" min={0} defaultValue={match.sideOneScore ?? ""} placeholder="Side 1 score" />
                <Input name="sideTwoScore" type="number" min={0} defaultValue={match.sideTwoScore ?? ""} placeholder="Side 2 score" />
                <Button type="submit" className="md:col-span-2">Save match update</Button>
              </form>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
