import Link from "next/link";
import { notFound } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ROUTES } from "@/constants/app";
import { TournamentBrandingForm } from "@/features/tournaments/tournament-branding-form";
import { getSessionUser } from "@/lib/auth/session";
import { getTournamentBySlug } from "@/lib/data/tournament-access";
import { isLeagueImageUploadConfigured } from "@/lib/uploads/league-image-blob-env";
import { cn } from "@/lib/utils";

interface PageProps {
  params: Promise<{ slug: string }>;
}

const hubLinks: Array<{
  href: (slug: string) => string;
  title: string;
  description: string;
  primary?: boolean;
}> = [
  {
    href: ROUTES.admin,
    title: "Run the auction",
    description: "Start, pause, go to the next team, and say yes to each pick.",
    primary: true,
  },
  {
    href: ROUTES.tv,
    title: "Show on a TV",
    description: "Big, simple screen for the room. Open this on the projector or TV.",
    primary: true,
  },
  {
    href: ROUTES.draft,
    title: "Auction board",
    description: "See all player photos, filters, and whose turn it is.",
  },
  {
    href: ROUTES.owner,
    title: "Team owner phone",
    description: "For the person who is picking on their phone.",
  },
  {
    href: ROUTES.teams,
    title: "Teams",
    description: "Names, colors, logos, and owners.",
  },
  {
    href: ROUTES.players,
    title: "Players",
    description: "Add people, group, and photos.",
  },
  {
    href: ROUTES.rules,
    title: "Rules",
    description: "How many picks each team can make in each group.",
  },
];

export default async function TournamentHubPage({ params }: PageProps) {
  const { slug } = await params;
  const tournament = await getTournamentBySlug(slug);
  if (!tournament) {
    notFound();
  }

  const user = await getSessionUser();
  const canEditBranding = Boolean(user && user.id === tournament.createdById);
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
          You can set up teams and players first. When it is time for the auction, use{" "}
          <strong className="font-semibold text-foreground">Run the auction</strong> on the
          computer and <strong className="font-semibold text-foreground">Show on a TV</strong>{" "}
          on the big screen.
        </p>
      </header>

      <ul className="grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
        {hubLinks.map((item) => (
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
