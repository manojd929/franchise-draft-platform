import { Skeleton } from "@/components/ui/skeleton";

/** Tournament hub skeleton while slug metadata loads. */
export default function TournamentHubLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 md:py-12">
      <div className="flex flex-wrap items-start justify-between gap-6 pb-10">
        <div className="min-w-0 flex-1 space-y-4">
          <Skeleton className="h-11 w-[min(18rem_100%)] rounded-lg" />
          <Skeleton className="h-6 w-[min(12rem_100%)] rounded-md" />
          <Skeleton className="h-36 w-full max-w-lg rounded-2xl" />
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[12rem]">
          <Skeleton className="h-11 w-full rounded-lg sm:w-52" />
          <Skeleton className="h-11 w-full rounded-lg sm:w-52" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <Skeleton
            key={`tournament-hub-tile-${String(index)}`}
            className="h-28 rounded-xl border border-transparent"
          />
        ))}
      </div>
    </div>
  );
}
