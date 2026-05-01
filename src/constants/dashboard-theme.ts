export type DashboardSportTheme = "general" | "badminton" | "cricket" | "tennis";

export const DASHBOARD_THEME_STORAGE_KEY = "franchise-draft-dashboard-sport-theme";

export const dashboardSportThemeOptions: {
  id: DashboardSportTheme;
  label: string;
  hint: string;
}[] = [
  { id: "general", label: "Arena", hint: "Neutral multi-sport floor" },
  { id: "badminton", label: "Badminton", hint: "Court greens & shuttle tone" },
  { id: "cricket", label: "Cricket", hint: "Outfield grass & pitch warmth" },
  { id: "tennis", label: "Tennis", hint: "Hard-court blues & lines" },
];

/** Full Tailwind class strings (must stay literal for compilation). */
export const dashboardThemeSurfaceClass: Record<DashboardSportTheme, string> = {
  general:
    "bg-gradient-to-br from-slate-50 via-indigo-50/70 to-slate-200/80 dark:from-slate-950 dark:via-indigo-950/50 dark:to-slate-950",
  badminton:
    "bg-gradient-to-br from-emerald-50 via-teal-100/60 to-lime-100/50 dark:from-emerald-950 dark:via-teal-950/45 dark:to-slate-950",
  cricket:
    "bg-gradient-to-br from-green-100/90 via-lime-50/70 to-amber-100/40 dark:from-green-950 dark:via-emerald-900/35 dark:to-stone-950",
  tennis:
    "bg-gradient-to-br from-sky-100 via-blue-50/90 to-slate-100 dark:from-sky-950 dark:via-blue-950/45 dark:to-slate-950",
};

export const dashboardThemeAccentGlowClass: Record<DashboardSportTheme, string> = {
  general:
    "bg-[radial-gradient(ellipse_85%_55%_at_50%_-15%,rgba(99,102,241,0.22),transparent_58%)] dark:bg-[radial-gradient(ellipse_85%_55%_at_50%_-15%,rgba(129,140,248,0.18),transparent_55%)]",
  badminton:
    "bg-[radial-gradient(ellipse_90%_60%_at_70%_-10%,rgba(16,185,129,0.28),transparent_55%)] dark:bg-[radial-gradient(ellipse_90%_60%_at_70%_-10%,rgba(52,211,153,0.14),transparent_52%)]",
  cricket:
    "bg-[radial-gradient(ellipse_85%_50%_at_30%_-12%,rgba(34,197,94,0.24),transparent_55%)] dark:bg-[radial-gradient(ellipse_85%_50%_at_30%_-12%,rgba(74,222,128,0.12),transparent_52%)]",
  tennis:
    "bg-[radial-gradient(ellipse_80%_55%_at_50%_-18%,rgba(14,165,233,0.3),transparent_55%)] dark:bg-[radial-gradient(ellipse_80%_55%_at_50%_-18%,rgba(56,189,248,0.15),transparent_52%)]",
};

export function parseDashboardSportTheme(value: string | null): DashboardSportTheme {
  if (
    value === "general" ||
    value === "badminton" ||
    value === "cricket" ||
    value === "tennis"
  ) {
    return value;
  }
  return "general";
}
