import { redirect } from "next/navigation";
import Link from "next/link";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ROUTES } from "@/constants/app";
import { DeletePlayerButton } from "@/features/tournaments/delete-player-button";
import { GrantFranchiseLoginDialog } from "@/features/tournaments/grant-franchise-login-dialog";
import { PlayerEditDialog } from "@/features/tournaments/player-edit-dialog";
import type { RosterCategorySelectOption } from "@/features/tournaments/players-quick-add";
import {
  PlayersCategoryDashboard,
  type PlayersCategoryDashboardRow,
} from "@/features/tournaments/players-category-dashboard";
import { PlayersSetupToolbar } from "@/features/tournaments/players-setup-toolbar";
import { RevokeFranchiseLoginButton } from "@/features/tournaments/revoke-franchise-login-button";
import { RosterCategoryPill } from "@/features/roster/roster-category-pill";
import { DraftPhase } from "@/generated/prisma/enums";
import { getSessionUser } from "@/lib/auth/session";
import { requireTournamentAccess } from "@/lib/data/tournament-access";
import { prisma } from "@/lib/prisma";
import { isLeagueImageUploadConfigured } from "@/lib/uploads/league-image-blob-env";
import { isLeagueOwnerInviteConfigured } from "@/services/league-account-service";

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
  const invitingSupported = isLeagueOwnerInviteConfigured();
  const canInviteOwners =
    tournament.draftPhase === DraftPhase.SETUP || tournament.draftPhase === DraftPhase.READY;

  const rosterCategories = await prisma.rosterCategory.findMany({
    where: { tournamentId: tournament.id, archivedAt: null },
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, colorHex: true },
  });

  const players = await prisma.player.findMany({
    where: { tournamentId: tournament.id, deletedAt: null },
    orderBy: { name: "asc" },
    include: {
      rosterCategory: {
        select: { id: true, name: true, colorHex: true },
      },
    },
  });

  const selectableCategories: RosterCategorySelectOption[] = rosterCategories.map((c) => ({
    id: c.id,
    name: c.name,
  }));

  const defaultRosterCategoryId = selectableCategories[0]?.id ?? "";

  const countsByCategory = new Map<string, number>();
  for (const player of players) {
    countsByCategory.set(
      player.rosterCategoryId,
      (countsByCategory.get(player.rosterCategoryId) ?? 0) + 1,
    );
  }

  const dashboardRows: PlayersCategoryDashboardRow[] = rosterCategories.map((c) => ({
    rosterCategoryId: c.id,
    name: c.name,
    colorHex: c.colorHex,
    count: countsByCategory.get(c.id) ?? 0,
  }));

  return (
    <div className="space-y-6 sm:space-y-10">
      <header>
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl lg:text-3xl">Players</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
          Build the draft pool privately on this desk, then{' '}
          <Link href={ROUTES.categories(slug)} className="font-medium text-foreground underline-offset-4 hover:underline">
            tune roster groups
          </Link>{' '}
          before syncing franchise owners from Teams.
        </p>
      </header>

      <PlayersCategoryDashboard rows={dashboardRows} totalPlayers={players.length} />

      <PlayersSetupToolbar
        tournamentSlug={slug}
        uploadsEnabled={uploadsEnabled}
        selectableCategories={selectableCategories}
        defaultRosterCategoryId={defaultRosterCategoryId}
      />

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
                  {selectableCategories.length === 0 ? (
                    <>
                      Configure{' '}
                      <Link href={ROUTES.categories(slug)} className="font-medium underline-offset-4 hover:underline">
                        roster groups
                      </Link>{' '}
                      first, then open <span className="font-medium">Add player</span>.
                    </>
                  ) : (
                    <>
                      No players yet. Use <span className="font-medium">Add player</span> above.
                    </>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              players.map((player) => (
                <TableRow key={player.id}>
                  <TableCell className="font-medium">{player.name}</TableCell>
                  <TableCell className="align-middle">
                    <RosterCategoryPill name={player.rosterCategory.name} colorHex={player.rosterCategory.colorHex} />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {[
                      player.linkedOwnerUserId ? "Team owner" : null,
                      player.isUnavailable ? "Away" : null,
                      player.isLocked ? "Locked" : null,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
                      <PlayerEditDialog
                        tournamentSlug={slug}
                        uploadsEnabled={uploadsEnabled}
                        selectableCategories={selectableCategories}
                        player={{
                          id: player.id,
                          name: player.name,
                          rosterCategoryId: player.rosterCategoryId,
                          gender: player.gender,
                          photoUrl: player.photoUrl,
                          notes: player.notes,
                        }}
                      />
                      {player.linkedOwnerUserId ? (
                        <RevokeFranchiseLoginButton
                          tournamentSlug={slug}
                          playerId={player.id}
                          playerName={player.name}
                          canInviteOwners={canInviteOwners}
                        />
                      ) : (
                        <GrantFranchiseLoginDialog
                          tournamentSlug={slug}
                          playerId={player.id}
                          playerName={player.name}
                          invitingSupported={invitingSupported}
                          canInviteOwners={canInviteOwners}
                        />
                      )}
                      <DeletePlayerButton
                        tournamentSlug={slug}
                        playerId={player.id}
                        playerName={player.name}
                        disabled={player.linkedOwnerUserId !== null}
                        disabledReason={
                          player.linkedOwnerUserId !== null
                            ? "Revoke franchise login first (or remove them on Teams), then you can delete this roster row."
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
