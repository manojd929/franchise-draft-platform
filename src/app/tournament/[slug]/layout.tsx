import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";

import { ROUTES } from "@/constants/app";
import { getTournamentBySlug } from "@/lib/data/tournament-access";

interface TournamentLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function TournamentLayout({
  children,
  params,
}: TournamentLayoutProps) {
  const { slug } = await params;
  const tournament = await getTournamentBySlug(slug);
  if (!tournament) notFound();

  const links = [
    { href: ROUTES.tournament(slug), label: "Home" },
    { href: ROUTES.teams(slug), label: "Teams" },
    { href: ROUTES.players(slug), label: "Players" },
    { href: ROUTES.rules(slug), label: "Rules" },
    { href: ROUTES.draft(slug), label: "Auction" },
    { href: ROUTES.admin(slug), label: "Admin" },
    { href: ROUTES.tv(slug), label: "Big screen" },
    { href: ROUTES.owner(slug), label: "Owner" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-40 border-b border-border/70 bg-card/85 backdrop-blur-md supports-[backdrop-filter]:bg-card/75">
        {tournament.colorHex ? (
          <div
            className="h-1 w-full"
            style={{ backgroundColor: tournament.colorHex }}
            aria-hidden
          />
        ) : null}
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-5">
            <div className="min-w-0 space-y-1 sm:space-y-2">
              <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground sm:text-xs sm:tracking-[0.2em]">
                Tournament
              </p>
              <div className="flex flex-wrap items-center gap-3">
                {tournament.logoUrl ? (
                  <Image
                    src={tournament.logoUrl}
                    alt=""
                    width={44}
                    height={44}
                    className="size-11 shrink-0 rounded-lg object-cover ring-1 ring-border"
                    unoptimized
                  />
                ) : null}
                <div className="min-w-0 space-y-1 sm:space-y-2">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                      {tournament.name}
                    </h1>
                    <Link
                      href={ROUTES.dashboard}
                      className="shrink-0 text-xs font-medium text-muted-foreground hover:text-foreground sm:text-sm"
                    >
                      ← All tournaments
                    </Link>
                  </div>
                  <p className="hidden font-mono text-xs text-muted-foreground sm:block">
                    {tournament.slug}
                  </p>
                </div>
              </div>
            </div>
            <nav
              aria-label="Tournament sections"
              className="-mx-1 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:pb-0 [&::-webkit-scrollbar]:hidden"
            >
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="shrink-0 rounded-full border border-border/70 px-3 py-2 text-xs font-medium text-muted-foreground transition hover:border-primary hover:text-foreground sm:py-1.5"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">{children}</div>
    </div>
  );
}
