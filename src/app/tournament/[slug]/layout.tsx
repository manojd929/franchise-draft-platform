import { AccountHeaderActions } from "@/components/auth/account-header-actions";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ROUTES } from "@/constants/app";
import { getTournamentBySlug } from "@/lib/data/tournament-access";
import {
  tournamentChromeNavLinks,
  type TournamentChromeNavViewer,
} from "@/lib/navigation/tournament-nav-links";
import { getSessionUser } from "@/lib/auth/session";

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

  const user = await getSessionUser();
  const chromeViewer: TournamentChromeNavViewer =
    user?.id === tournament.createdById ? "commissioner" : "participant";
  const showFixtures = tournament.draftPhase === "COMPLETED";
  const links = tournamentChromeNavLinks(slug, chromeViewer, { showFixtures });

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border/70 bg-card">
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
                  <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                    {tournament.name}
                  </h1>
                  <p className="hidden font-mono text-xs text-muted-foreground sm:block">
                    {tournament.slug}
                  </p>
                </div>
              </div>
            </div>
            <div className="-mx-1 flex flex-col gap-3 sm:mx-0 lg:max-w-[min(100%,42rem)] lg:flex-1">
              <div className="flex w-full flex-wrap justify-end gap-2 sm:w-auto">
                <AccountHeaderActions signOutButtonClassName="flex-1 sm:flex-none sm:min-w-[8rem]" />
              </div>
              <nav
                aria-label="Tournament sections"
                className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] sm:flex-wrap sm:overflow-visible sm:pb-0 [&::-webkit-scrollbar]:hidden"
              >
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="inline-flex min-h-11 shrink-0 touch-manipulation items-center rounded-full border border-border/70 px-3 py-2 text-xs font-medium text-muted-foreground transition hover:border-primary hover:text-foreground sm:min-h-9 sm:py-1.5"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <nav aria-label="Breadcrumb" className="border-b border-border/50 py-3">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <li className="min-w-0">
              <Link
                href={ROUTES.dashboard}
                className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                All tournaments
              </Link>
            </li>
            <li className="text-muted-foreground select-none" aria-hidden>
              /
            </li>
            <li
              className="min-w-0 truncate font-medium text-foreground"
              aria-current="page"
            >
              {tournament.name}
            </li>
          </ol>
        </nav>
        <div className="py-6 sm:py-10">{children}</div>
      </div>
    </div>
  );
}
