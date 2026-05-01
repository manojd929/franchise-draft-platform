import { notFound, redirect } from "next/navigation";

import { AdminControlRoomClient } from "@/components/draft/admin-control-room-client";
import { getSessionUser } from "@/lib/auth/session";
import { requireTournamentAccess } from "@/lib/data/tournament-access";
import { fetchDraftSnapshotBySlug } from "@/services/draft-service";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function AdminControlRoomPage({ params }: PageProps) {
  const { slug } = await params;
  const user = await getSessionUser();
  if (!user) {
    redirect(`/login?next=/tournament/${slug}/admin`);
  }

  await requireTournamentAccess(slug, user.id);

  const snapshot = await fetchDraftSnapshotBySlug(slug);
  if (!snapshot) {
    notFound();
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <header>
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl lg:text-3xl">
          Organizer: run the auction
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
          Use <strong className="font-semibold text-foreground">Shuffle pick order</strong> before you start
          so teams get a fair pick order. Start the auction, then press{" "}
          <strong className="font-semibold text-foreground">Confirm pick</strong> after each choice.
        </p>
      </header>
      <AdminControlRoomClient
        slug={slug}
        initialSnapshot={snapshot}
        viewerUserId={user.id}
      />
    </div>
  );
}
