import Link from "next/link";
import { Suspense } from "react";

import { LoginForm } from "@/features/auth/login-form";
import { ROUTES } from "@/constants/app";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[radial-gradient(ellipse_at_top,_rgba(56,189,248,0.15),_transparent_55%),#020617] px-6 py-16 text-white">
      <div className="mb-10 flex justify-between text-sm">
        <Link href={ROUTES.home} className="text-white/70 hover:text-white">
          ← Back to landing
        </Link>
        <Link href={ROUTES.dashboard} className="text-white/70 hover:text-white">
          Dashboard →
        </Link>
      </div>
      <Suspense fallback={<div className="mx-auto max-w-md text-center text-sm">Loading…</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
