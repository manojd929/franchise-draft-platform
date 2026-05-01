import Link from "next/link";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { ROUTES } from "@/constants/app";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link href={ROUTES.dashboard} className="text-sm text-muted-foreground hover:text-foreground">
          ← Dashboard
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <ThemeToggle />
          <SignOutButton className="min-w-[8rem]" variant="outline" />
        </div>
      </div>
      <h1 className="mt-8 text-3xl font-semibold tracking-tight">Settings</h1>
      <p className="mt-3 text-muted-foreground">
        Profile branding, notification routing, and commissioner preferences land here in subsequent
        iterations. Environment secrets remain in Vercel & Supabase dashboards only.
      </p>
    </div>
  );
}
