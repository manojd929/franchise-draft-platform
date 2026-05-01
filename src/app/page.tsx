import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { APP_NAME, ROUTES } from "@/constants/app";
import { cn } from "@/lib/utils";

export default function LandingPage() {
  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-x-hidden bg-[#030712] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(56,189,248,0.25),_transparent_55%),radial-gradient(ellipse_at_bottom,_rgba(236,72,153,0.12),_transparent_40%)]" />
      <header className="relative z-10 flex flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-8 md:px-16 md:py-6">
        <span className="text-xs font-semibold uppercase tracking-widest text-sky-200/90 sm:text-sm sm:tracking-[0.25em]">
          {APP_NAME}
        </span>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <Link
            href={ROUTES.login}
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "min-h-10 text-white hover:bg-white/10",
            )}
          >
            Sign in
          </Link>
          <Link
            href={ROUTES.dashboard}
            className={cn(buttonVariants(), "min-h-10 bg-white text-black hover:bg-white/90")}
          >
            My tournaments
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-4 pb-16 pt-6 sm:px-8 md:px-16 md:pb-24 md:pt-10">
        <p className="text-[10px] font-medium uppercase tracking-widest text-sky-300/90 sm:text-xs">
          Live player auction
        </p>
        <h1 className="mt-4 max-w-4xl text-balance text-3xl font-semibold leading-tight tracking-tight sm:mt-8 sm:text-5xl md:text-6xl lg:text-7xl">
          Run a calm auction for your club — teams, photos, turn order, TV screen.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/75 sm:mt-8 sm:text-lg md:text-xl">
          One organizer runs the computer. Owners pick players by name. Everyone sees the photos at
          the same time. Works on phones and TVs.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:mt-12 sm:flex-row sm:flex-wrap sm:gap-4">
          <Link
            href={ROUTES.tournamentNew}
            className={cn(
              buttonVariants({ size: "lg" }),
              "min-h-12 w-full bg-sky-400 text-slate-950 hover:bg-sky-300 sm:w-auto",
            )}
          >
            New tournament
          </Link>
          <Link
            href={ROUTES.login}
            className={cn(
              buttonVariants({ size: "lg", variant: "outline" }),
              "min-h-12 w-full border-white/30 bg-white/5 text-white hover:bg-white/10 sm:w-auto",
            )}
          >
            I already have an account
          </Link>
        </div>

        <dl className="mt-12 grid gap-4 sm:mt-20 sm:gap-6 md:grid-cols-3">
          {[
            {
              title: "Easy for the room",
              body: "Big TV page shows whose turn it is and the last player who joined a team.",
            },
            {
              title: "Fair order",
              body: "Press one button to shuffle teams into a fair pick order before you start.",
            },
            {
              title: "Photos together",
              body: "Filter by group and gender so everyone sees the same wall of faces.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md sm:p-6"
            >
              <dt className="text-sm font-semibold text-sky-200/95">{item.title}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-white/70">{item.body}</dd>
            </div>
          ))}
        </dl>
      </main>
    </div>
  );
}
