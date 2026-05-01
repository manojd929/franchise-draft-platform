"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/app";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { cn } from "@/lib/utils";

interface SignOutButtonProps {
  className?: string;
  variant?: "outline" | "ghost";
}

export function SignOutButton({
  className,
  variant = "outline",
}: SignOutButtonProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleSignOut(): Promise<void> {
    if (!isSupabaseConfigured()) {
      router.push(ROUTES.home);
      return;
    }
    setBusy(true);
    try {
      const supabase = createBrowserSupabaseClient();
      await supabase.auth.signOut();
    } finally {
      setBusy(false);
    }
    window.location.href = ROUTES.login;
  }

  return (
    <Button
      type="button"
      variant={variant}
      className={cn(
        "min-h-11 w-full touch-manipulation sm:w-auto sm:min-w-[7rem]",
        className,
      )}
      disabled={busy}
      onClick={() => void handleSignOut()}
    >
      {busy ? "Signing out…" : "Log out"}
    </Button>
  );
}
