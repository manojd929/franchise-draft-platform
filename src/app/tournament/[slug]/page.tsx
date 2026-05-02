import Link from "next/link";
import { notFound } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TournamentBrandingForm } from "@/features/tournaments/tournament-branding-form";
import { getSessionUser } from "@/lib/auth/session";
import { getTournamentBySlug } from "@/lib/data/tournament-access";
import { tournamentHubCardsForViewer } from "@/lib/navigation/tournament-nav-links";
import { isLeagueImageUploadConfigured } from "@/lib/uploads/league-image-blob-env";
import { cn } from "@/lib/utils";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function TournamentHubPage({ params }: PageProps) {
  const { slug } = await params;
  const tournament = await getTournamentBySlug(slug);
  if (!tournament) {
    notFound();
  }

  const user = await getSessionUser();
  const isCommissioner = Boolean(user && user.id === tournament.createdById);
  const canEditBranding = isCommissioner;
  const hubCards = tournamentHubCardsForViewer({ isCommissioner });
  const uploadsEnabled = isLeagueImageUploadConfigured();

  return (
    <div className="space-y-6 sm:space-y-8">
      {canEditBranding ? (
        <TournamentBrandingForm
          key={`${tournament.logoUrl ?? ""}-${tournament.colorHex ?? ""}-${tournament.name}`}
          tournamentSlug={slug}
          initialName={tournament.name}
          initialLogoUrl={tournament.logoUrl ?? null}
          initialColorHex={tournament.colorHex ?? null}
          uploadsEnabled={uploadsEnabled}
        />
      ) : null}

      <header className="space-y-2">
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Choose a screen
        </h2>
        <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
          {isCommissioner ? (
            <>
              Set up rosters before go-live day. Drive the auction from{" "}
              <strong className="font-semibold text-foreground">Run the auction</strong>; put{" "}
              <strong className="font-semibold text-foreground">Live roster board</strong> up for
              the room.
            </>
          ) : (
            <>
              You can browse setup pages now. Franchise owners nominate from{" "}
              <strong className="font-semibold text-foreground">Owner phone</strong> /{" "}
              <strong className="font-semibold text-foreground">Auction board</strong> cards when they
              are signed in — the commissioner works from Manage auction instead.
            </>
          )}
        </p>
      </header>

      <ul className="grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
        {hubCards.map((item) => (
          <li key={item.title}>
            <Card
              className={cn(
                "h-full border-border/80 transition hover:border-primary/40",
                item.primary && "border-primary/30 bg-primary/5",
              )}
            >
              <CardHeader className="space-y-3 pb-4">
                <CardTitle className="text-base sm:text-lg">{item.title}</CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  {item.description}
                </CardDescription>
                <Link
                  href={item.href(slug)}
                  className={cn(
                    buttonVariants({
                      variant: item.primary ? "default" : "outline",
                      size: "sm",
                    }),
                    "w-full sm:w-auto",
                  )}
                >
                  Open
                </Link>
              </CardHeader>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
