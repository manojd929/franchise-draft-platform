import Link from "next/link";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DeleteTournamentButton } from "@/features/dashboard/delete-tournament-button";
import { APP_NAME, ROUTES } from "@/constants/app";
import { DRAFT_PHASE_LABEL } from "@/constants/draft-phase-labels";
import {
  tournamentDashboardListSelect,
  type TournamentDashboardListRow,
} from "@/lib/data/tournament-dashboard-list-select";
import { getSessionUser } from "@/lib/auth/session";
import { cn } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login?next=/dashboard");
  }

  let tournaments: TournamentDashboardListRow[] = [];
  let loadError: string | null = null;
  try {
    tournaments = await prisma.tournament.findMany({
      where: {
        deletedAt: null,
        createdById: user.id,
      },
      orderBy: { updatedAt: "desc" },
      select: tournamentDashboardListSelect,
    });
  } catch {
    loadError =
      "DraftForge couldn't reach live data right now. Check back shortly, or contact your administrator if this continues.";
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 pb-14 sm:gap-10 sm:px-6 sm:py-12">
      <header className="flex flex-col gap-6 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="max-w-xl">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground sm:tracking-[0.2em]">
            {APP_NAME}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Your tournaments</h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Build rosters before auction day — then Manage auction and Live board are your two live-room links.
          </p>
        </div>
        <Link
          href={ROUTES.tournamentNew}
          className={cn(
            buttonVariants(),
            "min-h-11 w-full touch-manipulation justify-center sm:w-auto",
          )}
        >
          New tournament
        </Link>
      </header>

      {loadError ? (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardHeader>
            <CardTitle>Connection required</CardTitle>
            <CardDescription>{loadError}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <section className="grid gap-5 md:grid-cols-2">
          {tournaments.length === 0 ? (
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle>No tournaments yet</CardTitle>
                <CardDescription>
                  Create one tournament. Then add teams, owners, and players before the auction.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href={ROUTES.tournamentNew} className={cn(buttonVariants())}>
                  Create tournament
                </Link>
              </CardContent>
            </Card>
          ) : (
            tournaments.map((tournament) => (
              <Card key={tournament.id} className="border-border/70 bg-card/60 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-xl">{tournament.name}</CardTitle>
                      <CardDescription className="font-mono text-xs">
                        /{tournament.slug}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">
                      {DRAFT_PHASE_LABEL[tournament.draftPhase]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    <span>{tournament._count.teams} teams</span>
                    <span>{tournament._count.players} players</span>
                  </div>
                  <div className="flex flex-wrap gap-2 border-t border-border/60 pt-4">
                    <Link
                      href={ROUTES.admin(tournament.slug)}
                      className={cn(
                        buttonVariants({ variant: "default", size: "sm" }),
                        "min-h-11 touch-manipulation px-4 sm:min-h-9",
                      )}
                    >
                      Manage auction
                    </Link>
                    <Link
                      href={ROUTES.tv(tournament.slug)}
                      className={cn(
                        buttonVariants({ variant: "secondary", size: "sm" }),
                        "min-h-11 touch-manipulation px-4 sm:min-h-9",
                      )}
                    >
                      Live board
                    </Link>
                    <Link
                      href={ROUTES.categories(tournament.slug)}
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "min-h-11 touch-manipulation px-4 sm:min-h-9",
                      )}
                    >
                      Roster groups
                    </Link>
                    <Link
                      href={ROUTES.tournament(tournament.slug)}
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "min-h-11 touch-manipulation px-4 sm:min-h-9",
                      )}
                    >
                      Home
                    </Link>
                    <Link
                      href={ROUTES.teams(tournament.slug)}
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "min-h-11 touch-manipulation px-4 sm:min-h-9",
                      )}
                    >
                      Teams
                    </Link>
                    <Link
                      href={ROUTES.players(tournament.slug)}
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "min-h-11 touch-manipulation px-4 sm:min-h-9",
                      )}
                    >
                      Players
                    </Link>
                    <Link
                      href={ROUTES.rules(tournament.slug)}
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "min-h-11 touch-manipulation px-4 sm:min-h-9",
                      )}
                    >
                      Rules
                    </Link>
                  </div>
                  <DeleteTournamentButton
                    tournamentSlug={tournament.slug}
                    tournamentName={tournament.name}
                  />
                </CardContent>
              </Card>
            ))
          )}
        </section>
      )}
    </div>
  );
}
