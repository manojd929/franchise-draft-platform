import Image from "next/image";
import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { APP_NAME, ROUTES } from "@/constants/app";
import { getSessionUser } from "@/lib/auth/session";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const LOGO_SRC = "/brand/hulicourt-lockup-full.webp";
const LOGO_INTRINSIC = { width: 291, height: 340 };

interface JourneyStep {
  step: number;
  title: string;
  body: string;
}

interface Persona {
  title: string;
  eyebrow: string;
  body: string;
  cta: { label: string; href: string };
}

const ORGANIZER_JOURNEY: readonly JourneyStep[] = Object.freeze([
  {
    step: 1,
    title: "Create a tournament",
    body: "Pick a sport and format. Snake draft, random assignment, or IPL-style live auction.",
  },
  {
    step: 2,
    title: "Add roster groups & players",
    body: "Paste a list of names or drop a spreadsheet. Split players into groups — Pros, Amateurs, All-Rounders — whatever fits.",
  },
  {
    step: 3,
    title: "Invite team owners",
    body: "One tap creates each owner's login. They join from their phone; you run the desk.",
  },
  {
    step: 4,
    title: "Run the auction or draft",
    body: "Owners bid or pick in real time. The projector board shows purses, current lot, and every SOLD moment.",
  },
  {
    step: 5,
    title: "Play the tournament",
    body: "Auctioned squads flow into fixtures, scoring, and standings all the way to the final.",
  },
]);

const PERSONAS: readonly Persona[] = Object.freeze([
  {
    eyebrow: "You run the event",
    title: "Organizer",
    body: "You set up the tournament, control the desk, and run the auction. You need an account.",
    cta: { label: "Start a tournament", href: ROUTES.tournamentNew },
  },
  {
    eyebrow: "You own a team",
    title: "Team owner",
    body: "The organizer creates your login from the Teams page. You bid from your phone or draft your squad.",
    cta: { label: "Sign in as owner", href: ROUTES.login },
  },
  {
    eyebrow: "You're on the roster",
    title: "Player",
    body: "You don't need an account. Ask your organizer to share the tournament link for fixtures and standings.",
    cta: { label: "How players play", href: "#how-it-works" },
  },
]);

export default async function LandingPage() {
  const sessionUser = await getSessionUser();
  const isSignedIn = sessionUser !== null;

  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-x-hidden bg-background text-foreground">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.9_0.13_92/0.5),transparent_55%),radial-gradient(ellipse_at_bottom_right,oklch(0.95_0.06_96/0.55),transparent_45%)] dark:bg-[radial-gradient(ellipse_at_top,oklch(0.83_0.16_86/0.2),transparent_55%),radial-gradient(ellipse_at_bottom_right,oklch(0.8_0.13_82/0.08),transparent_42%)]"
        aria-hidden
      />

      <header className="relative z-10 px-4 py-5 sm:px-8 md:px-16 md:py-6">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4">
          <Image
            src={LOGO_SRC}
            alt={APP_NAME}
            width={LOGO_INTRINSIC.width}
            height={LOGO_INTRINSIC.height}
            className="h-12 w-auto shrink-0 rounded-xl sm:h-14"
            priority
          />
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <ThemeToggle />
            {isSignedIn ? (
              <Link href={ROUTES.dashboard} className={cn(buttonVariants(), "min-h-10")}>
                My tournaments
              </Link>
            ) : (
              <Link
                href={ROUTES.login}
                className={cn(buttonVariants({ variant: "ghost" }), "min-h-10")}
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pt-6 pb-16 sm:px-8 md:px-16 md:pt-10 md:pb-24">
        <section aria-labelledby="hero-heading">
          <p className="inline-flex items-center gap-2 text-[10px] font-semibold tracking-widest text-brand-accent uppercase sm:text-xs">
            <span className="size-1.5 rounded-full bg-brand" aria-hidden />
            Draft. Auction. Play. Win.
          </p>
          <h1
            id="hero-heading"
            className="mt-4 max-w-4xl text-3xl leading-tight font-semibold tracking-tight text-balance sm:mt-8 sm:text-5xl md:text-6xl lg:text-7xl dark:text-white"
          >
            Run your club&apos;s draft or auction like the big leagues.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:mt-8 sm:text-lg md:text-xl dark:text-white/75">
            Snake draft, one-tap random assignment, or a live IPL-style auction. Owners bid from
            their phones; the room watches on the big screen. Built for badminton, pickleball,
            tennis, and table tennis.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:mt-12 sm:flex-row sm:flex-wrap sm:gap-4">
            <Link
              href={ROUTES.tournamentNew}
              className={cn(
                buttonVariants({ size: "lg" }),
                "min-h-12 w-full bg-brand text-brand-foreground hover:bg-brand/90 focus-visible:ring-brand/50 sm:w-auto",
              )}
            >
              Start a tournament
            </Link>
            <Link
              href={ROUTES.login}
              className={cn(
                buttonVariants({ size: "lg", variant: "outline" }),
                "min-h-12 w-full sm:w-auto",
              )}
            >
              I already have an account
            </Link>
          </div>
        </section>

        <section id="how-it-works" aria-labelledby="journey-heading" className="mt-16 sm:mt-24">
          <h2
            id="journey-heading"
            className="text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl"
          >
            How it works
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Five steps from empty room to winners&rsquo; podium. You can set up a full tournament in
            about ten minutes.
          </p>
          <ol className="mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2 lg:grid-cols-3">
            {ORGANIZER_JOURNEY.map((step) => (
              <li
                key={step.step}
                className="flex gap-4 rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-sm backdrop-blur-md sm:p-6 dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-none"
              >
                <span
                  aria-hidden
                  className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-semibold text-brand-accent"
                >
                  {step.step}
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-foreground dark:text-white">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground dark:text-white/70">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="personas-heading" className="mt-16 sm:mt-24">
          <h2
            id="personas-heading"
            className="text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl"
          >
            Who&apos;s on the app
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Not sure which door to walk through? Pick your role.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PERSONAS.map((persona) => (
              <div
                key={persona.title}
                className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-sm backdrop-blur-md sm:p-6 dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-none"
              >
                <div>
                  <p className="text-[10px] font-semibold tracking-widest text-brand-accent uppercase">
                    {persona.eyebrow}
                  </p>
                  <h3 className="mt-1 text-lg font-semibold">{persona.title}</h3>
                </div>
                <p className="flex-1 text-sm leading-relaxed text-muted-foreground dark:text-white/70">
                  {persona.body}
                </p>
                <Link
                  href={persona.cta.href}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "min-h-10 justify-center",
                  )}
                >
                  {persona.cta.label}
                </Link>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
