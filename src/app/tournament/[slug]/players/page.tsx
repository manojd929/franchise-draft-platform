import { redirect } from "next/navigation";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeletePlayerButton } from "@/features/tournaments/delete-player-button";
import { PlayerEditDialog } from "@/features/tournaments/player-edit-dialog";
import { PlayersCategoryDashboard } from "@/features/tournaments/players-category-dashboard";
import { PlayersQuickAdd } from "@/features/tournaments/players-quick-add";
import { PLAYER_CATEGORY_LABEL } from "@/constants/player-labels";
import type { PlayerCategory } from "@/generated/prisma/enums";
import { getSessionUser } from "@/lib/auth/session";
import { requireTournamentAccess } from "@/lib/data/tournament-access";
import { SQUAD_RULE_CATEGORY_ORDER } from "@/lib/squad-rules/compute-per-team-caps";
import { prisma } from "@/lib/prisma";
import { isLeagueImageUploadConfigured } from "@/lib/uploads/league-image-blob-env";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function PlayersPage({ params }: PageProps) {
  const { slug } = await params;
  const user = await getSessionUser();
  if (!user) {
    redirect(`/login?next=/tournament/${slug}/players`);
  }

  const tournament = await requireTournamentAccess(slug, user.id);

  const uploadsEnabled = isLeagueImageUploadConfigured();

  const players = await prisma.player.findMany({
    where: { tournamentId: tournament.id, deletedAt: null },
    orderBy: { name: "asc" },
  });

  const categoryCounts = {} as Record<PlayerCategory, number>;
  for (const category of SQUAD_RULE_CATEGORY_ORDER) {
    categoryCounts[category] = 0;
  }
  for (const player of players) {
    categoryCounts[player.category] += 1;
  }

  return (
    <div className="space-y-6 sm:space-y-10">
      <header>
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl lg:text-3xl">Players</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
          Add each person&apos;s name, group, and gender. Upload a photo or paste an image link —
          photos show on the auction board. Franchise owners appear here too once assigned on Teams —
          edit their category or photo like anyone else.
        </p>
      </header>

      <PlayersCategoryDashboard
        categoryCounts={categoryCounts}
        totalPlayers={players.length}
      />

      <PlayersQuickAdd tournamentSlug={slug} uploadsEnabled={uploadsEnabled} />

      <div className="overflow-x-auto rounded-xl border border-border/70 bg-card/30 backdrop-blur-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Group</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {players.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground">
                  Add players with the form above.
                </TableCell>
              </TableRow>
            ) : (
              players.map((player) => (
                <TableRow key={player.id}>
                  <TableCell className="font-medium">{player.name}</TableCell>
                  <TableCell>{PLAYER_CATEGORY_LABEL[player.category]}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {[
                      player.linkedOwnerUserId ? "Team owner" : null,
                      player.isUnavailable ? "Away" : null,
                      player.isLocked ? "Locked" : null,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
                      <PlayerEditDialog
                        tournamentSlug={slug}
                        uploadsEnabled={uploadsEnabled}
                        player={{
                          id: player.id,
                          name: player.name,
                          category: player.category,
                          gender: player.gender,
                          photoUrl: player.photoUrl,
                          notes: player.notes,
                        }}
                      />
                      <DeletePlayerButton
                        tournamentSlug={slug}
                        playerId={player.id}
                        playerName={player.name}
                        disabled={player.linkedOwnerUserId !== null}
                        disabledReason={
                          player.linkedOwnerUserId !== null
                            ? "Remove franchise owner on Teams before deleting this roster row."
                            : undefined
                        }
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
