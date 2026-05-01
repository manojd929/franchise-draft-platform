import { notFound, redirect } from "next/navigation";

import { DraftRoomClient } from "@/components/draft/draft-room-client";
import { getSessionUser } from "@/lib/auth/session";
import { fetchDraftSnapshotBySlug } from "@/services/draft-service";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function OwnerViewPage({ params }: PageProps) {
  const { slug } = await params;
  const user = await getSessionUser();
  if (!user) {
    redirect(`/login?next=/tournament/${slug}/owner`);
  }

  const snapshot = await fetchDraftSnapshotBySlug(slug);
  if (!snapshot) {
    notFound();
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <header>
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl lg:text-3xl">
          Your turn on the phone
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
          Same photo board as the room. When your team is highlighted, choose a player and wait for the
          organizer to confirm.
        </p>
      </header>
      <DraftRoomClient
        slug={slug}
        initialSnapshot={snapshot}
        viewerUserId={user.id}
        enableOwnerPick
      />
    </div>
  );
}
