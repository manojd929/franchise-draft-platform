import { ROUTES } from "@/constants/app";

/** Links shown in tournament shell nav (sticky header pills). */
export type TournamentChromeNavLink = Readonly<{ href: string; label: string }>;

/**
 * Commissioners run the auction from Manage auction; nominee phones use Owner/Auction routes.
 */
export type TournamentChromeNavViewer = "commissioner" | "participant";

export function tournamentChromeNavLinks(
  slug: string,
  viewer: TournamentChromeNavViewer,
): TournamentChromeNavLink[] {
  const shared: TournamentChromeNavLink[] = [
    { href: ROUTES.tournament(slug), label: "Home" },
    { href: ROUTES.categories(slug), label: "Roster groups" },
    { href: ROUTES.players(slug), label: "Players" },
    { href: ROUTES.teams(slug), label: "Teams" },
    { href: ROUTES.rules(slug), label: "Rules" },
    { href: ROUTES.admin(slug), label: "Manage auction" },
    { href: ROUTES.tv(slug), label: "Live roster board" },
  ];

  if (viewer === "participant") {
    return [
      ...shared,
      { href: ROUTES.draft(slug), label: "Auction screen" },
      { href: ROUTES.owner(slug), label: "Owner phone" },
    ];
  }

  return shared;
}

/** Hub cards on tournament home (`/tournament/[slug]`). */
export type TournamentHubCard = Readonly<{
  href: (slug: string) => string;
  title: string;
  description: string;
  primary?: boolean;
  /**
   * When true, card is omitted for commissioners (auction creator).
   * Franchise owners and anyone else signed in without creator rights still sees these.
   */
  participantOnly?: boolean;
}>;

export const tournamentHubCards: TournamentHubCard[] = [
  {
    href: ROUTES.admin,
    title: "Run the auction",
    description:
      "Start, shuffle order, spotlight rounds, pause, confirm — everything you run from one desk.",
    primary: true,
  },
  {
    href: ROUTES.tv,
    title: "Live roster board",
    description:
      "Hall & projector view: franchises, drafted players by group, spotlight, clock, and picks — refreshes automatically.",
    primary: true,
  },
  {
    href: ROUTES.categories,
    title: "Roster groups",
    description: "Labels, tint colors, display order — what shows on every roster surface.",
  },
  {
    href: ROUTES.teams,
    title: "Teams",
    description: "Names, colors, logos, and franchise-owner logins.",
  },
  {
    href: ROUTES.players,
    title: "Players",
    description: "Add nominees, attach photos, and sort them into roster groups.",
  },
  {
    href: ROUTES.rules,
    title: "Rules",
    description: "Caps per roster group — what each franchise can roster live.",
  },
  {
    href: ROUTES.draft,
    title: "Auction board",
    description: "Participant view: filtered board and nominate when you are up.",
    participantOnly: true,
  },
  {
    href: ROUTES.owner,
    title: "Owner phone",
    description: "For franchise owners nominating during the auction (phone-friendly layout).",
    participantOnly: true,
  },
];

export function tournamentHubCardsForViewer(options: {
  isCommissioner: boolean;
}): TournamentHubCard[] {
  if (!options.isCommissioner) {
    return [...tournamentHubCards];
  }
  return tournamentHubCards.filter((card) => !card.participantOnly);
}
