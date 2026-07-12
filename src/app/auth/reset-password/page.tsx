import Image from "next/image";
import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";
import { APP_NAME, ROUTES } from "@/constants/app";
import { ResetPasswordForm } from "@/features/auth/reset-password-form";

export const dynamic = "force-dynamic";

export default function ResetPasswordPage() {
  return (
    <div className="relative min-h-[100dvh] bg-background text-foreground dark:bg-neutral-950">
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_78%_55%_at_50%_-8%,oklch(0.9_0.13_92/0.4),transparent_62%)] dark:bg-[radial-gradient(ellipse_72%_52%_at_50%_-8%,oklch(0.83_0.16_86/0.17),transparent_60%)]"
        aria-hidden
      />
      <div className="flex min-h-[100dvh] flex-col px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5 md:px-6 md:py-8 lg:py-10">
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
          <header className="flex shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-border/40 pb-3 text-sm md:border-0 md:pb-0">
            <Link
              href={ROUTES.login}
              className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-md py-1.5 pr-1.5 text-muted-foreground ring-offset-background transition-colors hover:bg-muted/40 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              ← Back to sign in
            </Link>
            <ThemeToggle />
          </header>

          <main className="flex flex-1 flex-col justify-center py-7 sm:py-8 md:py-10">
            <Image
              src="/brand/hulicourt-lockup-full.webp"
              alt={`${APP_NAME}: Draft. Auction. Play. Win.`}
              width={291}
              height={340}
              className="mx-auto mb-6 h-24 w-auto rounded-xl sm:h-28"
              priority
            />
            <ResetPasswordForm />
          </main>
        </div>
      </div>
    </div>
  );
}
