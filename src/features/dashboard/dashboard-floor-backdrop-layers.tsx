"use client";

import type { ReactNode } from "react";

import type { DashboardFloorTheme } from "@/constants/dashboard-theme";
import {
  dashboardThemeAccentGlowClass,
  dashboardThemeGridMixClass,
  dashboardThemeSurfaceClass,
} from "@/constants/dashboard-theme";
import { cn } from "@/lib/utils";

const GRID_LINES =
  "h-full w-full bg-[linear-gradient(rgba(0,0,0,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.14)_1px,transparent_1px)] bg-size-[48px_48px] dark:bg-[linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)]";

export function DashboardFloorBackdropDecor({
  theme,
  motionClassName = "transition-opacity duration-500 motion-reduce:transition-none",
}: {
  theme: DashboardFloorTheme;
  motionClassName?: string;
}) {
  return (
    <>
      <div
        className={cn(
          "pointer-events-none absolute inset-0 z-0",
          motionClassName,
          dashboardThemeAccentGlowClass[theme],
        )}
        aria-hidden
      />
      <div
        className={cn(
          "pointer-events-none absolute inset-0 z-0",
          motionClassName,
          dashboardThemeGridMixClass[theme],
        )}
        aria-hidden
      >
        <div className={GRID_LINES} aria-hidden />
      </div>
    </>
  );
}

/**
 * Applies floor gradient + cinematic layers for the commissioner dashboard chrome or previews.
 */
export function DashboardFloorBackdropShell({
  theme,
  className,
  children,
}: {
  theme: DashboardFloorTheme;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative isolate overflow-hidden",
        dashboardThemeSurfaceClass[theme],
        className,
      )}
    >
      <DashboardFloorBackdropDecor theme={theme} />
      {children ?? null}
    </div>
  );
}
