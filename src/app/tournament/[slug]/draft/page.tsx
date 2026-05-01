import { notFound, redirect } from "next/navigation";

import { DraftRoomClient } from "@/components/draft/draft-room-client";
import { getSessionUser } from "@/lib/auth/session";
import { fetchDraftSnapshotBySlug } from "@/services/draft-service";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function DraftFloorPage({ params }: PageProps) {
  const { slug } = await params;
  const user = await getSessionUser();
  if (!user) {
    redirect(`/login?next=/tournament/${slug}/draft`);
  }

  const snapshot = await fetchDraftSnapshotBySlug(slug);
  if (!snapshot) {
    notFound();
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <header>
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl lg:text-3xl">
          Auction board
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
          Photos for everyone still free to pick. Choose your group and women or men. When it is your
          team&apos;s turn, tap <strong className="font-semibold text-foreground">Pick this player</strong>.
          The organizer confirms on the Admin screen.
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
