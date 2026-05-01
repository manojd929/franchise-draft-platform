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
import { getSessionUser } from "@/lib/auth/session";
import { cn } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

const dashboardTournamentSelect = {
  id: true,
  name: true,
  slug: true,
  draftPhase: true,
  updatedAt: true,
  _count: { select: { teams: true, players: true } },
} satisfies Prisma.TournamentSelect;

type DashboardTournament = Prisma.TournamentGetPayload<{
  select: typeof dashboardTournamentSelect;
}>;

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login?next=/dashboard");
  }

  let tournaments: DashboardTournament[] = [];
  let loadError: string | null = null;
  try {
    tournaments = await prisma.tournament.findMany({
      where: {
        deletedAt: null,
        createdById: user.id,
      },
      orderBy: { updatedAt: "desc" },
      select: dashboardTournamentSelect,
    });
  } catch {
    loadError =
      "Database unavailable. Set DATABASE_URL for your Supabase Postgres pooler and run prisma migrate.";
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
            Make teams and players first. On auction day, open Admin and Big screen.
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Link
            href={ROUTES.settings}
            className={cn(buttonVariants({ variant: "outline" }), "min-h-11 w-full touch-manipulation justify-center sm:w-auto")}
          >
            Settings
          </Link>
          <Link
            href={ROUTES.tournamentNew}
            className={cn(buttonVariants(), "min-h-11 w-full touch-manipulation justify-center sm:w-auto")}
          >
            New tournament
          </Link>
        </div>
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
                    <Link
                      href={ROUTES.draft(tournament.slug)}
                      className={cn(
                        buttonVariants({ size: "sm" }),
                        "min-h-11 w-full touch-manipulation px-4 sm:w-auto sm:min-h-9 sm:ml-auto",
                      )}
                    >
                      Auction
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
