/**
 * Commissioner dashboard backdrop themes (sport-broadcast aesthetic).
 * Central config: IDs, labels, and surface styles. Add themes by extending tuples + Records below.
 */

export const dashboardFloorThemeIds = ["broadcast", "circuit", "pitch", "velocity"] as const;

export type DashboardFloorTheme = (typeof dashboardFloorThemeIds)[number];

/** Storage key unchanged so existing installs keep their choice via legacy-ID migration below. */
export const DASHBOARD_THEME_STORAGE_KEY = "franchise-draft-dashboard-sport-theme";

/** UI copy for each curated floor theme. */
export const dashboardFloorThemeOptions: readonly {
  id: DashboardFloorTheme;
  label: string;
  hint: string;
}[] = [
  {
    id: "broadcast",
    label: "Broadcast",
    hint: "Control-room graphite, soft violet lift — neutral multi-event floor.",
  },
  {
    id: "circuit",
    label: "Circuit",
    hint: "Teal telemetry and glass depth — ops / replay suite energy.",
  },
  {
    id: "pitch",
    label: "Pitch",
    hint: "Moss turf, damped amber — stadium grass under floodlights.",
  },
  {
    id: "velocity",
    label: "Velocity",
    hint: "Cobalt readouts and cobalt haze — esports HUD, broadcast safe.",
  },
] as const;

const LEGACY_DASHBOARD_THEME_MAP = {
  general: "broadcast",
  badminton: "circuit",
  cricket: "pitch",
  tennis: "velocity",
} as const satisfies Record<string, DashboardFloorTheme>;

function isDashboardFloorTheme(value: string): value is DashboardFloorTheme {
  return (dashboardFloorThemeIds as readonly string[]).includes(value);
}

/** Maps persisted values to current theme IDs (backward compatible). */
export function parseDashboardFloorTheme(value: string | null): DashboardFloorTheme {
  if (value === null || value.trim() === "") {
    return "broadcast";
  }
  if (isDashboardFloorTheme(value)) {
    return value;
  }
  const migrated = LEGACY_DASHBOARD_THEME_MAP[value as keyof typeof LEGACY_DASHBOARD_THEME_MAP];
  return migrated ?? "broadcast";
}

/** Base wash + restrained mesh (light/dark tuned). Must stay literal for Tailwind. */
export const dashboardThemeSurfaceClass: Record<DashboardFloorTheme, string> = {
  broadcast:
    "bg-gradient-to-br from-neutral-50 via-zinc-100 to-slate-200/80 dark:bg-gradient-to-br dark:from-[#101218] dark:via-[#0b0e14] dark:to-[#06070b]",
  circuit:
    "bg-gradient-to-br from-slate-50 via-teal-50/40 to-emerald-100/65 dark:bg-gradient-to-br dark:from-[#0b1215] dark:via-[#071416] dark:to-[#060c0f]",
  pitch:
    "bg-gradient-to-br from-stone-100 via-neutral-50/90 to-emerald-100/50 dark:bg-gradient-to-br dark:from-[#11160f] dark:via-[#0d1310] dark:to-[#080c09]",
  velocity:
    "bg-gradient-to-br from-slate-100 via-blue-50/55 to-indigo-100/60 dark:bg-gradient-to-br dark:from-[#0b101a] dark:via-[#0a121c] dark:to-[#05080f]",
};

/** Atmospheric accent — kept low-contrast so layout stays readable. */
export const dashboardThemeAccentGlowClass: Record<DashboardFloorTheme, string> = {
  broadcast:
    "bg-[radial-gradient(ellipse_110%_55%_at_45%_-8%,rgba(99,102,241,0.14),transparent_58%)] dark:bg-[radial-gradient(ellipse_110%_50%_at_50%_-6%,rgba(129,140,248,0.11),transparent_52%)]",
  circuit:
    "bg-[radial-gradient(ellipse_100%_55%_at_72%_-6%,rgba(20,184,166,0.16),transparent_55%)] dark:bg-[radial-gradient(ellipse_100%_50%_at_72%_-4%,rgba(45,212,191,0.09),transparent_52%)]",
  pitch:
    "bg-[radial-gradient(ellipse_105%_50%_at_28%_-8%,rgba(34,197,94,0.12),transparent_58%)] dark:bg-[radial-gradient(ellipse_100%_50%_at_38%_-6%,rgba(74,222,128,0.065),transparent_52%)]",
  velocity:
    "bg-[radial-gradient(ellipse_105%_55%_at_52%_-10%,rgba(14,165,233,0.15),transparent_58%)] dark:bg-[radial-gradient(ellipse_100%_50%_at_52%_-7%,rgba(56,189,248,0.09),transparent_52%)]",
};

/** Compact gradient strip used on commissioner theme picker cards (must stay literal for Tailwind). */
export const dashboardFloorThemeSwatchBannerClass: Record<DashboardFloorTheme, string> = {
  broadcast:
    "relative min-h-[3.75rem] w-full shrink-0 bg-gradient-to-br from-neutral-200/85 via-zinc-100 to-indigo-200/65 dark:from-[#2a3140] dark:via-[#161b26] dark:to-[#172a3f]/90",
  circuit:
    "relative min-h-[3.75rem] w-full shrink-0 bg-gradient-to-br from-teal-200/65 via-emerald-100/85 to-slate-200/50 dark:from-[#115e59]/90 dark:via-[#134e4a]/85 dark:to-[#0f172a]/95",
  pitch:
    "relative min-h-[3.75rem] w-full shrink-0 bg-gradient-to-br from-lime-200/55 via-stone-200/65 to-emerald-200/50 dark:from-[#25402a] dark:via-[#223122] dark:to-[#1a2920]",
  velocity:
    "relative min-h-[3.75rem] w-full shrink-0 bg-gradient-to-br from-sky-200/70 via-indigo-100/75 to-slate-100/65 dark:from-[#17395c] dark:via-[#12243d] dark:to-[#0f172a]/95",
};

/** Fine mesh contrast per theme — subtle cinematic texture without noisy contrast. */
export const dashboardThemeGridMixClass: Record<DashboardFloorTheme, string> = {
  broadcast: "opacity-[0.028] dark:opacity-[0.055]",
  circuit: "opacity-[0.03] dark:opacity-[0.052]",
  pitch: "opacity-[0.03] dark:opacity-[0.048]",
  velocity: "opacity-[0.03] dark:opacity-[0.054]",
};
