import { notFound } from "next/navigation";

import { TvDisplayClient } from "@/components/draft/tv-display-client";
import { fetchDraftSnapshotBySlug } from "@/services/draft-service";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function TvDisplayPage({ params }: PageProps) {
  const { slug } = await params;
  const snapshot = await fetchDraftSnapshotBySlug(slug);
  if (!snapshot) {
    notFound();
  }

  return (
    <div className="-mx-4 -my-6 min-h-[100dvh] w-[calc(100%+2rem)] overflow-x-hidden sm:-mx-6 sm:-my-10 sm:w-[calc(100%+3rem)]">
      <TvDisplayClient slug={slug} initialSnapshot={snapshot} />
    </div>
  );
}
