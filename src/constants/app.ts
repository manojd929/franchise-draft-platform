export const APP_NAME = "DraftForge";

export const ROUTES = {
  home: "/",
  login: "/login",
  dashboard: "/dashboard",
  settings: "/settings",
  tournamentNew: "/tournament/new",
  tournament: (slug: string) => `/tournament/${slug}`,
  teams: (slug: string) => `/tournament/${slug}/teams`,
  players: (slug: string) => `/tournament/${slug}/players`,
  rules: (slug: string) => `/tournament/${slug}/rules`,
  draft: (slug: string) => `/tournament/${slug}/draft`,
  admin: (slug: string) => `/tournament/${slug}/admin`,
  tv: (slug: string) => `/tournament/${slug}/tv`,
  owner: (slug: string) => `/tournament/${slug}/owner`,
} as const;
