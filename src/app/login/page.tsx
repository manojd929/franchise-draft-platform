import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { ThemeToggle } from "@/components/theme-toggle";
import { LoginForm } from "@/features/auth/login-form";
import { ROUTES } from "@/constants/app";
import { getSessionUser } from "@/lib/auth/session";
import { sanitizeNextPath } from "@/lib/navigation/sanitize-next-path";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const sessionUser = await getSessionUser();
  if (sessionUser) {
    const params = await searchParams;
    redirect(sanitizeNextPath(params.next, ROUTES.dashboard));
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-background px-6 py-16 text-foreground">
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-sky-500/[0.07] to-transparent dark:from-sky-500/[0.14]"
        aria-hidden
      />
      <div className="mb-10 flex flex-wrap items-center justify-between gap-4 text-sm">
        <Link href={ROUTES.home} className="text-muted-foreground hover:text-foreground">
          ← Back to landing
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <ThemeToggle />
        </div>
      </div>
      <Suspense
        fallback={
          <div className="mx-auto max-w-md text-center text-sm text-muted-foreground">
            Loading…
          </div>
        }
      >
        <LoginForm />
      </Suspense>
      <p className="mx-auto mt-10 max-w-lg px-2 text-center text-sm leading-relaxed text-muted-foreground sm:text-base">
        First time at auction time? Ask your organizer for this league&apos;s sign-in link (it opens
        this page, then sends you to the right screen after you enter email and password). Franchise
        owners usually bookmark{" "}
        <span className="font-medium text-foreground">Owner</span> in the tournament menu. Players on the roster only need an account if they were invited as an owner.
      </p>
    </div>
  );
}
